// Chhatravritti Sahayak Worker: static assets are served directly; only /api/* runs here.
// Anonymous counter (Durable Object): event name, language, day and, for "schemes", how many were shown.
// Never answers, state, category, income, caste or IPs.
const EVENTS = new Set(['check', 'schemes', 'copy', 'share', 'applied_yes', 'applied_no']);
const LANGS = new Set(['en', 'hi']);
const count = (x) => Number.isInteger(x) && x >= 0 && x <= 200;

export class Counter {
  constructor(state) { this.storage = state.storage; }

  async fetch(req) {
    const { pathname } = new URL(req.url);
    if (pathname === '/api/event') return this.event(req);
    if (pathname === '/api/stats') return this.stats();
    return new Response(null, { status: 404 });
  }

  async event(req) {
    let body;
    try { body = JSON.parse(await req.text()); } catch { return new Response('bad json', { status: 400 }); }
    if (!EVENTS.has(body?.event) || !LANGS.has(body?.lang)) return new Response('bad event', { status: 400 });
    // "schemes" adds the number of schemes shown on one result; every other event adds 1.
    if (body.event === 'schemes' && !count(body.n)) return new Response('bad count', { status: 400 });
    const by = body.event === 'schemes' ? body.n : 1;
    const day = new Date().toISOString().slice(0, 10);
    for (const k of [`total:${body.event}`, `lang:${body.lang}:${body.event}`, `day:${day}:${body.event}`]) {
      await this.storage.put(k, ((await this.storage.get(k)) || 0) + by);
    }
    return new Response(null, { status: 204 });
  }

  async stats() {
    const counts = {};
    for (const [k, v] of await this.storage.list()) if (/^(total|lang|day):/.test(k)) counts[k] = v;
    return Response.json({ since: '2026-11-05', counts }, { headers: { 'cache-control': 'no-store' } });
  }
}

const counter = (env) => env.COUNTER.get(env.COUNTER.idFromName('global'));

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    if (pathname === '/api/event' || pathname === '/api/stats') {
      const wanted = pathname === '/api/event' ? 'POST' : 'GET';
      if (req.method !== wanted) return new Response(null, { status: 405 });
      return counter(env).fetch(req);
    }
    if (pathname.startsWith('/api/')) return new Response(null, { status: 404 });
    return env.ASSETS.fetch(req);
  },
};
