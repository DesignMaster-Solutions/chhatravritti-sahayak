import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eligibleSchemes, portalFor, deadlineFor, documentsFor, RULES, NODAL, NSP_HOME } from '../rules.js';
import { NSP } from '../nsp-data.js';

const TODAY = '2026-11-05';
const base = { course: 'ug', state: 'UP', cats: ['general'], income: 100000, renewal: false };
const run = (a, today = TODAY) => eligibleSchemes({ ...base, ...a }, today);
const ids = (a, today) => run(a, today).fits.map((f) => f.id);

// One profile per BRIEF table row that reaches that rule. `ceil` and `lt` are read from RULES so a broken
// ceiling in rules.js shows up as the profile flipping on the edge.
const PROFILES = {
  pms_sc: { state: 'PB', cats: ['sc'] },
  pms_st: { state: 'GA', cats: ['st'] },
  pms_obc: { state: 'DL', cats: ['obc'] },
  uk_obc: { state: 'UK', cats: ['obc'] },
  pms_pwd: { cats: ['pwd'] },
  top_sc: { cats: ['sc'] },
  top_obc_college: { cats: ['obc'] },
  top_obc_school: { course: 'c11', cats: ['obc'] },
  nat_st: { cats: ['st'] },
  top_pwd: { cats: ['pwd'] },
  csss: { renewal: true, csssOk: true },
  pragati: { girl: true, aicte: true },
  saksham: { cats: ['pwd'], aicte: true },
  swanath: { swanath: true, aicte: true },
  ishan: { ner12: true },
  jkl: { state: 'JK', jk12: true },
  nmms: { course: 'c11', renewal: true, nmms: true },
};
const EXPECTED_CEIL = {
  pms_sc: 250000, pms_st: 250000, pms_obc: 250000, uk_obc: 150000, pms_pwd: 250000, top_sc: 800000,
  top_obc_college: 250000, top_obc_school: 250000, nat_st: 600000, top_pwd: 800000, csss: 450000,
  pragati: 800000, saksham: 800000, swanath: 800000, ishan: 450000, jkl: 800000, nmms: 350000,
};

test('every BRIEF rule has a profile and the ceiling written in the BRIEF', () => {
  assert.deepEqual(RULES.map((r) => r.id).sort(), Object.keys(PROFILES).sort());
  for (const r of RULES) assert.equal(r.ceil, EXPECTED_CEIL[r.id], r.id);
  assert.deepEqual(RULES.filter((r) => r.lt).map((r) => r.id).sort(), ['ishan', 'top_obc_school']);
});

for (const [id, p] of Object.entries(PROFILES)) {
  test(`${id}: income at the ceiling is inside, one rupee more is outside`, () => {
    const ceil = EXPECTED_CEIL[id];
    const lt = id === 'ishan' || id === 'top_obc_school';
    const inside = lt ? ceil - 1 : ceil;
    assert.ok(ids({ ...p, income: inside }).includes(id), `${id} at ${inside}`);
    assert.ok(!ids({ ...p, income: inside + 1 }).includes(id), `${id} at ${inside + 1}`);
  });
}

test('Ishan Uday: 4,49,999 fits, 4,50,000 itself is out (below 4.5 lakh)', () => {
  assert.ok(ids({ ner12: true, income: 449999 }).includes('ishan'));
  assert.ok(!ids({ ner12: true, income: 450000 }).includes('ishan'));
});

test('Top Class Schools: 2,49,999 fits, 2,50,000 is out (less than 2.5 lakh)', () => {
  const p = { course: 'c11', cats: ['obc'] };
  assert.ok(ids({ ...p, income: 249999 }).includes('top_obc_school'));
  assert.ok(!ids({ ...p, income: 250000 }).includes('top_obc_school'));
});

test('Uttarakhand OBC uses the state manual limit 1,50,000, not the central 2,50,000', () => {
  const p = { state: 'UK', cats: ['obc'] };
  const at = run({ ...p, income: 150000 }).fits.find((f) => f.id === 'uk_obc');
  assert.ok(at);
  assert.equal(at.ceil, 150000);
  assert.ok(!ids({ ...p, income: 200000 }).includes('uk_obc'));
  assert.ok(!ids({ ...p, income: 200000 }).includes('pms_obc'));
  // Uttarakhand SC keeps 2,50,000.
  assert.ok(ids({ state: 'UK', cats: ['sc'], income: 250000 }).includes('pms_sc'));
});

test('income bands: a band across the limit is "edge", not dropped', () => {
  const f = run({ ner12: true, income: { min: 350001, max: 450000 } }).fits.find((x) => x.id === 'ishan');
  assert.equal(f.income, 'edge');
  assert.ok(!ids({ ner12: true, income: { min: 450001, max: 600000 } }).includes('ishan'));
});

test('CSSS: a fresh student is not offered it and is told why; renewal with marks and attendance is offered', () => {
  const fresh = run({ income: 100000, csssOk: true });
  assert.ok(!fresh.fits.some((f) => f.id === 'csss'));
  assert.ok(fresh.notes.includes('n_csss_fresh'));
  const renew = run({ renewal: true, csssOk: true });
  assert.ok(renew.fits.some((f) => f.id === 'csss'));
  const renewLow = run({ renewal: true, csssOk: false });
  assert.ok(!renewLow.fits.some((f) => f.id === 'csss'));
  assert.ok(renewLow.notes.includes('n_csss_renew'));
});

test('deadline: open, closed and not yet open are computed from the date passed in', () => {
  const row = { open: '2026-06-01', close: '2026-11-30' };
  assert.equal(deadlineFor(row, '2026-05-31').status, 'notyet');
  assert.equal(deadlineFor(row, '2026-06-01').status, 'open');
  assert.equal(deadlineFor(row, '2026-11-30').status, 'open');
  assert.equal(deadlineFor(row, '2026-12-01').status, 'closed');
  assert.equal(deadlineFor({ notOpen: true }, TODAY).status, 'notyet');
  assert.equal(deadlineFor({}, TODAY).status, 'unknown');
  assert.equal(deadlineFor(row, TODAY).checked, '2026-11-05');
  // Real rows: Assam SC closed on 15-10-2026, West Bengal SC not yet opened.
  const assam = run({ state: 'AS', cats: ['sc'] }).fits.find((f) => f.id === 'pms_sc');
  assert.equal(assam.deadline.status, 'closed');
  const wb = NSP.find((r) => /SC -West Bengal/.test(r.name));
  assert.equal(deadlineFor(wb, TODAY).status, 'notyet');
});

test('Punjab SC closes 15-11-2026, Delhi SC 15-02-2027; same day, different states', () => {
  const pb = run({ state: 'PB', cats: ['sc'] }).fits.find((f) => f.id === 'pms_sc');
  const dl = run({ state: 'DL', cats: ['sc'] }).fits.find((f) => f.id === 'pms_sc');
  assert.equal(pb.deadline.close, '2026-11-15');
  assert.equal(dl.deadline.close, '2027-02-15');
  assert.equal(run({ state: 'PB', cats: ['sc'] }, '2026-11-16').fits.find((f) => f.id === 'pms_sc').deadline.status, 'closed');
  assert.equal(run({ state: 'DL', cats: ['sc'] }, '2026-11-16').fits.find((f) => f.id === 'pms_sc').deadline.status, 'open');
});

test('Uttar Pradesh SC: no NSP row, state portal, not verified, never filtered by income', () => {
  const p = portalFor('UP', 'sc');
  assert.equal(p.where, 'state');
  assert.equal(p.url, 'https://scholarship.up.gov.in');
  assert.equal(p.verified, false);
  for (const income of [100000, 250001, 2000000]) {
    const r = run({ state: 'UP', cats: ['sc'], income });
    assert.equal(r.stateRoutes.length, 1, String(income));
    assert.equal(r.stateRoutes[0].cat, 'sc');
    assert.equal(r.stateRoutes[0].centralCeil, 250000);
    assert.ok(!r.fits.some((f) => f.id === 'pms_sc'));
  }
});

test('a state with no NSP row and no known portal: no portal guessed, nodal officers page', () => {
  const p = portalFor('AR', 'sc');
  assert.equal(p.where, 'unknown');
  assert.equal(p.url, NODAL);
  assert.equal(portalFor('XX', 'sc').where, 'unknown');
  // Tamil Nadu has SC/ST and BC portals in the BRIEF, nothing for EBC or DNT.
  assert.equal(portalFor('TN', 'dnt').where, 'unknown');
  assert.equal(portalFor('PB', 'sc').where, 'nsp');
  assert.equal(portalFor('PB', 'sc').url, NSP_HOME);
});

test('minority-only student: the minority note, no post-matric minority scheme invented', () => {
  const r = run({ cats: ['minority'], income: 100000 });
  assert.ok(r.notes.includes('n_minority'));
  assert.deepEqual(r.stateRoutes, []);
  assert.ok(!r.fits.some((f) => /Minorit/i.test(f.row.name)));
  // Still shows what fits the other answers.
  assert.ok(run({ cats: ['minority'], girl: true, aicte: true }).fits.some((f) => f.id === 'pragati'));
});

test('general student with no extra situation: no scheme', () => {
  const r = run({ cats: ['general'], income: 900000, state: 'UP' });
  assert.deepEqual(r.fits, []);
  assert.deepEqual(r.stateRoutes, []);
});

test('state rows with no BRIEF rule are listed with date and guideline, never with a ceiling', () => {
  const r = run({ state: 'HP', cats: ['general'] });
  assert.ok(r.unread.length > 5);
  for (const u of r.unread) {
    assert.equal(u.ceil, undefined);
    assert.ok(u.deadline.close || u.deadline.status === 'notyet');
  }
  // An OBC student in Himachal does not see the SC-only Medhavi row.
  const obc = run({ state: 'HP', cats: ['obc'] }).unread.map((u) => u.row.name);
  assert.ok(obc.some((n) => /For OBC Students-Himachal/.test(n)));
  assert.ok(!obc.some((n) => /For SC Students-Himachal/.test(n)));
  assert.ok(run({}).otherCentral.every((u) => !RULES.some((x) => x.match(u.row))));
});

test('documents: quoted per scheme, others point to the guideline', () => {
  assert.deepEqual(documentsFor('csss', true).keys, ['d_prev_marks']);
  assert.ok(documentsFor('csss', false).keys.includes('d_xii_marks'));
  assert.ok(documentsFor('pms_sc').keys.includes('d_caste'));
  assert.ok(documentsFor('pms_pwd').keys.includes('d_upload'));
  assert.deepEqual(documentsFor('nat_st').keys, []);
});

test('Ishan Uday and NMMS need their own answers; Top Class Schools only in Class 11-12', () => {
  assert.ok(!ids({ income: 100000 }).includes('ishan'));
  assert.ok(!ids({ ner12: true, renewal: true }).includes('ishan'));
  assert.ok(!ids({ course: 'c11', renewal: false, nmms: true }).includes('nmms'));
  assert.ok(!ids({ course: 'ug', cats: ['obc'] }).includes('top_obc_school'));
  assert.ok(!ids({ state: 'UP', jk12: true }).includes('jkl'));
});

// ---- Text: both languages complete, no promise of money, no amounts, no em dash. ----
import { STRINGS, t } from '../i18n.js';
import { readFileSync, statSync } from 'node:fs';
import { CATS, COURSES } from '../rules.js';

const root = new URL('../', import.meta.url);
const read = (f) => readFileSync(new URL(f, root), 'utf8');

test('en and hi have exactly the same keys, none empty, same placeholders', () => {
  const en = Object.keys(STRINGS.en).sort();
  const hi = Object.keys(STRINGS.hi).sort();
  assert.deepEqual(hi, en);
  const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const k of en) {
    assert.ok(STRINGS.en[k].trim() && STRINGS.hi[k].trim(), k);
    assert.equal(ph(STRINGS.hi[k]), ph(STRINGS.en[k]), k);
  }
});

test('every key the rules and the app ask for exists', () => {
  const need = [
    ...RULES.map((r) => `r_${r.id}`), ...RULES.flatMap((r) => r.notes || []),
    ...CATS.map((c) => `cat_${c}`), ...COURSES.map((c) => `course_${c}`),
    ...['csss', 'pms_sc', 'pms_pwd'].flatMap((id) => [...documentsFor(id, true).keys, ...documentsFor(id, false).keys]),
    'n_minority', 'n_csss_fresh', 'n_csss_renew',
  ];
  const app = read('app.js');
  for (const m of app.matchAll(/L\('(\w+)'/g)) need.push(m[1]);
  for (const m of app.matchAll(/\['(\w+)', \(\) =>/g)) need.push(`x_${m[1]}`);
  for (const m of read('index.html').matchAll(/data-t="(\w+)"/g)) need.push(m[1]);
  for (const k of new Set(need)) assert.ok(k in STRINGS.en, k);
});

test('no text in en or hi promises money or states an amount', () => {
  const PROMISE = /you will get|you'll get|you get Rs|guarantee|eligible for sure|surely eligible|will receive|आपको मिलेगा|आपको मिलेगी|मिलना तय|पक्का मिलेगा|ज़रूर मिलेगा|गारंटी/i;
  const AMOUNT = /(\bRs\.?|₹|\bINR|रुपये|रु\.)\s*\d|\d[\d,]*\s*(rupees|lakh|crore|लाख|करोड़)/i;
  for (const lang of ['en', 'hi']) {
    for (const [k, s] of Object.entries(STRINGS[lang])) {
      assert.doesNotMatch(s, PROMISE, `${lang}.${k}`);
      assert.doesNotMatch(s, AMOUNT, `${lang}.${k}`);
    }
  }
  // Cards say "may fit".
  assert.match(t('en', 'may_fit'), /may fit/i);
  assert.doesNotMatch(read('app.js') + read('index.html'), /eligible for sure|you are eligible/i);
});

test('no em dash and no emoji in any visible text', () => {
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  for (const lang of ['en', 'hi']) {
    for (const [k, s] of Object.entries(STRINGS[lang])) {
      assert.ok(!s.includes('—'), `${lang}.${k}`);
      assert.doesNotMatch(s, EMOJI, `${lang}.${k}`);
    }
  }
  for (const f of ['index.html', 'stats.html', 'app.js']) {
    assert.ok(!read(f).includes('—'), f);
    assert.doesNotMatch(read(f), EMOJI, f);
  }
});

test('app code apart from nsp-data.js is under 100 KB', () => {
  const files = ['index.html', 'app.js', 'rules.js', 'i18n.js', 'styles.css'];
  const total = files.reduce((n, f) => n + statSync(new URL(f, root)).size, 0);
  assert.ok(total < 100 * 1024, `${total} bytes`);
});

test('AICTE Pragati and Saksham cite the PDF of the degree or diploma row', () => {
  const deg = run({ girl: true, aicte: true }).fits.find((f) => f.id === 'pragati');
  const dip = run({ course: 'iti', girl: true, aicte: true }).fits.find((f) => f.id === 'pragati');
  assert.match(deg.src[1], /AICTE_2010_G\.pdf$/);
  assert.match(dip.src[1], /AICTE_2011_G\.pdf$/);
  assert.match(run({ course: 'iti', cats: ['pwd'], aicte: true }).fits.find((f) => f.id === 'saksham').src[1], /AICTE_2013_G\.pdf$/);
});

// Slots: Top Class SC para 2b, Top Class College para 3(ii) and 6(ii), DEPwD guideline footnote (fixed slots for
// pre-matric, post-matric and Top Class). The ST National Fellowship para 2.4 says there is NO slot ceiling.
test('slot-limited schemes carry the slots note on their card; the ST fellowship does not', () => {
  const notes = (id) => RULES.find((r) => r.id === id).notes || [];
  for (const id of ['top_sc', 'top_obc_college', 'top_pwd', 'pms_pwd']) assert.ok(notes(id).includes('n_slots'), id);
  assert.ok(!notes('nat_st').includes('n_slots'));
  const sc = run({ state: 'DL', cats: ['sc'], income: 700000 }).fits.find((f) => f.id === 'top_sc');
  assert.ok(sc.notes.includes('n_slots'));
});
