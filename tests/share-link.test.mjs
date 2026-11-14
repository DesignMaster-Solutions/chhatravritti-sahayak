import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shareUrl, answersFrom, INCOME_BANDS } from '../rules.js';

const a = { course: 'ug', state: 'UP', cats: ['obc', 'pwd'], income: INCOME_BANDS[1], renewal: true, x: { girl: true, csss: true } };

test('the link carries the language and the tapped answers, and opens on the same answers', () => {
  const url = new URL(shareUrl('https://x.example', a, 'hi'));
  assert.equal(url.origin + url.pathname, 'https://x.example/');
  assert.equal(url.searchParams.get('lang'), 'hi');
  assert.equal(url.searchParams.has('nostats'), false);
  assert.deepEqual(answersFrom(url.search), a);
});

test('fresh application with no optional answer round-trips too', () => {
  const b = { course: 'c11', state: 'JK', cats: ['general'], income: INCOME_BANDS[6], renewal: false, x: {} };
  assert.deepEqual(answersFrom(new URL(shareUrl('https://x.example', b, 'en')).search), b);
});

test('a missing or unknown answer opens the first question, not a wrong result', () => {
  const ok = new URL(shareUrl('https://x.example', a, 'en')).searchParams;
  const without = (k) => { const p = new URLSearchParams(ok); p.delete(k); return `?${p}`; };
  const withv = (k, v) => { const p = new URLSearchParams(ok); p.set(k, v); return `?${p}`; };
  assert.equal(answersFrom(''), null);
  assert.equal(answersFrom('?lang=hi'), null);
  for (const k of ['course', 'state', 'cats', 'income', 'renewal']) assert.equal(answersFrom(without(k)), null, k);
  assert.equal(answersFrom(withv('course', 'mba')), null);
  assert.equal(answersFrom(withv('state', 'ZZ')), null);
  assert.equal(answersFrom(withv('cats', 'obc,brahmin')), null);
  assert.equal(answersFrom(withv('cats', '')), null);
  assert.equal(answersFrom(withv('income', 'i9')), null);
  assert.equal(answersFrom(withv('renewal', 'yes')), null);
  assert.equal(answersFrom(withv('x', 'girl,admin')), null);
  assert.deepEqual(answersFrom(without('x')).x, {});
});

// Seen on a real phone (384 px): the long Hindi label did not wrap and the page scrolled sideways.
test('the family link wraps instead of pushing the page wider than the phone', async () => {
  const { readFileSync } = await import('node:fs');
  const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(css, /#pass\s*\{[^}]*white-space:\s*normal/);
});
