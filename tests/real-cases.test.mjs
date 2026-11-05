// Replays real court and Information Commission cases (evidence/real-cases) through the app's own rules and screens.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { eligibleSchemes, portalFor, WELFARE } from '../rules.js';
import { STRINGS } from '../i18n.js';

const dir = new URL('../evidence/real-cases/', import.meta.url);
const { cases } = JSON.parse(readFileSync(new URL('cases.json', dir), 'utf8'));
const flat = (s) => s.replace(/\s+/g, ' ');
const appJs = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const TODAY = '2026-11-05';

// What each warning must actually say for it to count against the cause in the decision.
const SAYS = {
  chk1_a: /bank account seeded with your Aadhaar/,
  chk1_d: /no credit limit on the account/,
  chk1_e: /PFMS rejects wrong bank details/,
  chk2_a: /father's name and roll number exactly as on the mark sheet/,
  chk2_c: /Fix it before you submit/,
  chk3_a: /institute must verify your application/,
  chk3_b: /marked Defective, correct it/,
  dl_open: /Last date for students: \{date\}/,
  where_nsp: /National Scholarship Portal/,
  after_1: /Track the payment on PFMS/,
};
// Every warning a cause needs before a case can be counted as covered by the app.
const NEEDS = {
  bank_dbt: ['chk1_a'], name_or_documents: ['chk2_a'], institute_verification: ['chk3_a'],
  portal_or_deadline: ['dl_open'], not_stated: [],
};

test('there are 8 to 15 real cases, ids unique, each from a saved decision', () => {
  assert.ok(cases.length >= 8 && cases.length <= 15, String(cases.length));
  assert.equal(new Set(cases.map((c) => c.id)).size, cases.length);
});

for (const c of cases) {
  test(`${c.id}: the quote is verbatim in the saved decision`, () => {
    assert.match(c.url, /^https:\/\/indiankanoon\.org\/doc\/\d+\/$/);
    assert.equal(c.source, `sources/${c.url.match(/\d+/)[0]}.txt`);
    const src = flat(readFileSync(new URL(c.source, dir), 'utf8'));
    assert.ok(src.includes(flat(c.quote)), c.quote);
  });

  test(`${c.id}: the app shows, in English and Hindi, the warnings that address "${c.blocked_by}"`, () => {
    assert.ok(Object.hasOwn(NEEDS, c.blocked_by), c.blocked_by);
    for (const k of NEEDS[c.blocked_by]) assert.ok(c.warnings.includes(k), `${c.blocked_by} needs ${k}`);
    for (const k of c.warnings) {
      assert.match(STRINGS.en[k], SAYS[k], k);
      assert.ok(STRINGS.hi[k]?.length > 10, `hi ${k}`);
      // Rendered on the result screen: the key appears in app.js where the result is built.
      assert.ok(appJs.includes(`'${k}'`), `${k} not rendered in app.js`);
    }
  });

  const { answers: a, replay: r } = c;
  if (!r) continue;

  test(`${c.id}: the schemes and portal the app gives for the student's answers`, () => {
    if (r.fits) {
      assert.ok(a.course && a.state && a.cats, 'a full replay needs course, state and category from the decision');
      const out = eligibleSchemes({ ...a, renewal: !!a.renewal }, TODAY);
      assert.deepEqual(out.fits.map((f) => f.id).sort(), [...r.fits].sort());
      assert.deepEqual(out.stateRoutes.map(({ cat, where }) => ({ cat, where })), r.routes);
      // A scheme on NSP always carries the student's last date, the deadline every portal case turns on.
      for (const f of out.fits) if (f.row.close) assert.match(f.deadline.close, /^\d{4}-\d\d-\d\d$/, f.id);
    } else {
      const routes = WELFARE.filter((cat) => a.cats.includes(cat)).map((cat) => ({ cat, where: portalFor(a.state, cat).where }));
      assert.deepEqual(routes, r.routes);
    }
  });
}

test('Punjab SC (Malkit Kaur) gets the NSP card with a last date and an institute date', () => {
  const out = eligibleSchemes({ course: 'ug', state: 'PB', cats: ['sc'], income: null, renewal: false }, TODAY);
  const pms = out.fits.find((f) => f.id === 'pms_sc');
  assert.ok(pms, 'pms_sc missing');
  assert.equal(pms.deadline.close, '2026-11-15');
  assert.equal(pms.deadline.institute, '2026-11-30');
});

test('aggregates written in the README match cases.json', () => {
  const by = (k) => cases.filter((c) => c.blocked_by === k).length;
  const named = cases.filter((c) => c.blocked_by !== 'not_stated');
  const students = cases.reduce((s, c) => s + c.students, 0);
  const replayed = cases.filter((c) => c.replay).length;
  const div = cases.filter((c) => c.divergence).length;
  const readme = flat(readFileSync(new URL('README.md', dir), 'utf8'));
  for (const s of [
    `${cases.length} decisions`, `${students} students`, `${named.length} of ${cases.length}`,
    `bank or DBT: ${by('bank_dbt')}`, `name or documents: ${by('name_or_documents')}`,
    `institute verification: ${by('institute_verification')}`, `portal or deadline: ${by('portal_or_deadline')}`,
    `not stated: ${by('not_stated')}`, `${replayed} cases`, `${div} divergences`,
  ]) assert.ok(readme.includes(s), s);
});
