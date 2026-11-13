import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker, { Counter } from '../worker.js';

class FakeStorage {
  constructor() { this.m = new Map(); }
  async get(k) { return this.m.get(k); }
  async put(k, v) { this.m.set(k, v); }
  async list() { return new Map([...this.m].sort()); }
}
const newCounter = () => new Counter({ storage: new FakeStorage() });
const post = (body) => new Request('https://x/api/event', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });
const stats = async (c) => (await c.fetch(new Request('https://x/api/stats'))).json();
const today = () => new Date().toISOString().slice(0, 10);
const envWith = (c) => ({
  ASSETS: { fetch: async () => new Response('asset') },
  COUNTER: { idFromName: (n) => n, get: () => c },
});

test('every event is counted in total, per language and per day; schemes adds the number shown', async () => {
  const c = newCounter();
  for (const e of ['check', 'copy', 'share', 'share_link', 'applied_yes', 'applied_no']) {
    assert.equal((await c.fetch(post({ event: e, lang: 'hi' }))).status, 204, e);
  }
  assert.equal((await c.fetch(post({ event: 'schemes', lang: 'en', n: 3 }))).status, 204);
  assert.equal((await c.fetch(post({ event: 'schemes', lang: 'en', n: 0 }))).status, 204);
  assert.equal((await c.fetch(post({ event: 'check', lang: 'en' }))).status, 204);
  const { since, counts } = await stats(c);
  assert.equal(since, '2026-11-05');
  assert.equal(counts['total:check'], 2);
  assert.equal(counts['lang:hi:check'], 1);
  assert.equal(counts['total:schemes'], 3);
  assert.equal(counts[`day:${today()}:applied_yes`], 1);
  assert.equal(counts['lang:hi:applied_no'], 1);
});

test('bad events, languages, counts and JSON are rejected and nothing is stored', async () => {
  const c = newCounter();
  const bad = [
    { event: 'plan', lang: 'en' }, { event: 'check', lang: 'xx' }, { event: 'check' },
    { event: 'schemes', lang: 'en' }, { event: 'schemes', lang: 'en', n: -1 }, { event: 'schemes', lang: 'en', n: 1.5 },
    { event: 'schemes', lang: 'en', n: '3' }, { event: 'schemes', lang: 'en', n: 201 }, '{not json', 'null',
  ];
  for (const b of bad) assert.equal((await c.fetch(post(b))).status, 400, JSON.stringify(b));
  assert.deepEqual(await stats(c), { since: '2026-11-05', counts: {} });
});

test('no personal field is ever stored, only counters', async () => {
  const c = newCounter();
  await c.fetch(post({ event: 'check', lang: 'en', state: 'UP', cats: ['sc'], income: 100000, name: 'x' }));
  assert.deepEqual([...c.storage.m.keys()].sort(), ['day:' + today() + ':check', 'lang:en:check', 'total:check'].sort());
});

test('routing: /api/* reaches the Worker, other paths are static, wrong methods get 405', async () => {
  const env = envWith(newCounter());
  assert.equal(await (await worker.fetch(new Request('https://x/stats.html'), env)).text(), 'asset');
  assert.equal(await (await worker.fetch(new Request('https://x/'), env)).text(), 'asset');
  assert.equal((await worker.fetch(new Request('https://x/api/stats'), env)).status, 200);
  assert.equal((await worker.fetch(post({ event: 'check', lang: 'en' }), env)).status, 204);
  assert.equal((await worker.fetch(new Request('https://x/api/event'), env)).status, 405);
  assert.equal((await worker.fetch(new Request('https://x/api/stats', { method: 'POST' }), env)).status, 405);
  assert.equal((await worker.fetch(new Request('https://x/api/nope'), env)).status, 404);
});
