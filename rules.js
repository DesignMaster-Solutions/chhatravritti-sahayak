// Pure rule engine. Only the "Verified facts" of BRIEF.md live here; dates come from nsp-data.js.
// No DOM, no clock: `today` ('YYYY-MM-DD', IST) is always passed in. Text lives in i18n.js as keys.
import { NSP, NSP_CHECKED } from './nsp-data.js';

export { NSP_CHECKED };
export const G = 'https://scholarships.gov.in/public/schemeGuidelines/';
export const F = 'https://scholarships.gov.in/public/FAQ/';
export const NODAL = 'https://scholarships.gov.in/nodalofficerList';
export const NSP_HOME = 'https://scholarships.gov.in';
export const NSP_ALL = 'https://scholarships.gov.in/All-Scholarships';

export const COURSES = ['c11', 'iti', 'ug', 'pg', 'phd'];
export const CATS = ['sc', 'st', 'obc', 'ebc', 'dnt', 'minority', 'pwd', 'general'];
export const WELFARE = ['sc', 'st', 'obc', 'ebc', 'dnt'];
const BACKWARD = ['obc', 'ebc', 'dnt'];

// Bands follow the official ceilings: 1.5, 2.5, 3.5, 4.5, 6 and 8 lakh.
export const INCOME_BANDS = [
  { id: 'i1', min: 0, max: 150000 },
  { id: 'i2', min: 150001, max: 250000 },
  { id: 'i3', min: 250001, max: 350000 },
  { id: 'i4', min: 350001, max: 450000 },
  { id: 'i5', min: 450001, max: 600000 },
  { id: 'i6', min: 600001, max: 800000 },
  { id: 'i7', min: 800001, max: Infinity },
];

// code, NSP name (as in "State of X" / "UT of X"), state portal for the welfare categories.
// Portals: official domains seen on 05 Nov 2026 (BRIEF.md). Never guess one.
export const STATES = [
  ['AN', 'Andaman and Nicobar Islands'], ['AP', 'Andhra Pradesh', { all: 'https://jnanabhumi.ap.gov.in' }],
  ['AR', 'Arunachal Pradesh'], ['AS', 'Assam'],
  ['BR', 'Bihar', { sc: 'https://scstpmsonline.bihar.gov.in/scstpms2223/pms/StudentDefault.aspx', st: 'https://scstpmsonline.bihar.gov.in/scstpms2223/pms/StudentDefault.aspx' }],
  ['CH', 'Chandigarh'], ['CG', 'Chattisgarh', { all: 'https://postmatric-scholarship.cg.nic.in' }],
  ['DN', 'The Dadra Nagar Haveli and Daman and Diu'], ['DL', 'Delhi'], ['GA', 'Goa'],
  ['GJ', 'Gujarat', { all: 'https://www.digitalgujarat.gov.in/CitizenNew/ScholarshipServices.aspx' }],
  ['HR', 'Haryana'], ['HP', 'Himachal Pradesh'], ['JK', 'Jammu and Kashmir'],
  ['JH', 'Jharkhand', { all: 'https://ekalyan.cgg.gov.in' }],
  ['KA', 'Karnataka', { all: 'https://ssp.postmatric.karnataka.gov.in' }],
  ['KL', 'Kerala', { all: 'https://egrantz.kerala.gov.in' }], ['LA', 'Ladakh'], ['LD', 'Lakshadweep'],
  ['MP', 'Madhya Pradesh', { all: 'https://hescholarship.mp.gov.in' }],
  ['MH', 'Maharashtra', { all: 'https://mahadbt.maharashtra.gov.in' }], ['MN', 'Manipur'], ['ML', 'Meghalaya'],
  ['MZ', 'Mizoram'], ['NL', 'Nagaland'], ['OD', 'Odisha', { all: 'https://scholarship.odisha.gov.in' }],
  ['PY', 'Puducherry'], ['PB', 'Punjab'], ['RJ', 'Rajasthan', { all: 'https://sjmsnew.rajasthan.gov.in/scholarship/' }],
  ['SK', 'Sikkim'],
  ['TN', 'Tamil Nadu', { sc: 'https://tnadw.tn.gov.in/scholarshipform/en', st: 'https://tnadw.tn.gov.in/scholarshipform/en', obc: 'https://bcw.tn.gov.in/sub_page/8' }],
  ['TS', 'Telangana', { all: 'https://telanganaepass.cgg.gov.in' }], ['TR', 'Tripura'],
  ['UP', 'Uttar Pradesh', { all: 'https://scholarship.up.gov.in' }], ['UK', 'Uttarakhand'],
  ['WB', 'West Bengal', { all: 'https://oasis.wb.gov.in' }],
].map(([code, nsp, portals = {}]) => ({ code, nsp, portals }));

const stateOf = (row) => row.by.replace(/^(State|UT) of /, '');
const has = (re) => (row) => re.test(row.name);
const isSC = has(/\bSC\b/);
const isST = has(/\bST\b/);
const isOBC = has(/\bOBC\b/);
const isEBC = has(/\bEBC\b|Economically Backward Class/i);
const isDNT = has(/\bDNT\b/);
const ROW_CATS = { sc: isSC, st: isST, obc: isOBC, ebc: isEBC, dnt: isDNT };
const sponsored = (r) => r.kind === 'sponsored';
const central = (r) => r.kind === 'central';
const yasasvi = has(/YASASVI/);

// One entry per row of the BRIEF table. `ceil`: income limit, `lt`: strictly below (else "up to").
// `fits(a)` holds the non-income conditions. `src`: [para, guideline file].
export const RULES = [
  { id: 'uk_obc', match: (r) => sponsored(r) && stateOf(r) === 'Uttarakhand' && isOBC(r) && !yasasvi(r),
    ceil: 150000, src: ['Uttarakhand manual on NSP (Hindi)', G + 'Help_manual.pdf'], docs: 'see' },
  { id: 'pms_sc', match: (r) => sponsored(r) && isSC(r), ceil: 250000,
    src: ['para 5.3 and 4.2', G + 'Manipur_state_scheme/manipur_3032_G.pdf'], docs: 'sc_obc' },
  { id: 'pms_st', match: (r) => sponsored(r) && isST(r), ceil: 250000, orphanNoLimit: true,
    src: ['para 3 and 3.3', G + 'PMS%20Scheme%20Guide%20Lines%20-%20Tribal%20Affairs.pdf'], docs: 'see' },
  { id: 'pms_obc', match: (r) => sponsored(r) && yasasvi(r), ceil: 250000, notes: ['n_two_boys', 'n_one_only'],
    src: ['para 5 (x, xi, xiv, xv), 6.1', G + 'Guidlines_3099.pdf'], docs: 'sc_obc' },
  { id: 'pms_pwd', match: (r) => central(r) && /^Post Matric Scholarship For Students With Disabilities/.test(r.name),
    ceil: 250000, fits: (a) => a.cats.includes('pwd') && a.course !== 'phd', notes: ['n_udid', 'n_slots'],
    src: ['Q1, Q2, Q4', G + 'DEPDFAQ.pdf'], docs: 'pwd' },
  { id: 'top_sc', match: (r) => central(r) && /Top Class Education For SC/.test(r.name), ceil: 800000,
    fits: (a) => a.cats.includes('sc') && a.course !== 'c11', notes: ['n_slots'], src: ['para 2a and 2b', G + 'Top_Class_Education_Scheme_2018.pdf'], docs: 'see' },
  { id: 'top_obc_college', match: (r) => central(r) && /YASASVI.*Top Class Education In College/.test(r.name), ceil: 250000,
    fits: (a) => BACKWARD.some((c) => a.cats.includes(c)) && a.course !== 'c11', notes: ['n_every_year', 'n_slots'],
    src: ['para 3(i)', G + 'ApprovedmodifieddraftofTopClassCollege.pdf'], docs: 'see' },
  { id: 'top_obc_school', match: (r) => central(r) && /YASASVI.*Top Class Education In Schools/.test(r.name), ceil: 250000, lt: true,
    fits: (a) => BACKWARD.some((c) => a.cats.includes(c)) && a.course === 'c11', notes: ['n_wait_states'],
    src: ['NSP home notice', G + '3061_G.pdf'], docs: 'see' },
  { id: 'nat_st', match: (r) => central(r) && /National Fellowship And Scholarship For Higher Education Of ST/.test(r.name), ceil: 600000,
    fits: (a) => a.cats.includes('st') && a.course !== 'c11', src: ['para 2.2', G + 'tribalfellowshipguideline.pdf'], docs: 'see' },
  { id: 'top_pwd', match: (r) => central(r) && /Top Class Education For Students With Disabilities/.test(r.name), ceil: 800000,
    fits: (a) => a.cats.includes('pwd') && (a.course === 'ug' || a.course === 'pg'), notes: ['n_slots'], src: ['para 3', G + 'DEPDGuidelines_1.pdf'], docs: 'see' },
  { id: 'csss', match: (r) => central(r) && /\(CSSS\)/.test(r.name), ceil: 450000,
    fits: (a) => a.renewal && a.csssOk && (a.course === 'ug' || a.course === 'pg'),
    src: ['para 4', G + 'CSSS_GUIDLINES_07022024_updated.pdf'], docs: 'csss' },
  { id: 'pragati', match: (r) => central(r) && /Pragati/.test(r.name), ceil: 800000, course: (r) => (/Diploma/.test(r.name) ? 'iti' : 'ug'),
    fits: (a) => a.girl && a.aicte, notes: ['n_two_girls'], rowGuide: true, src: ['AICTE guideline', G + 'AICTE/AICTE_2010_G.pdf'], docs: 'see' },
  { id: 'saksham', match: (r) => central(r) && /Saksham/.test(r.name), ceil: 800000, course: (r) => (/Diploma/.test(r.name) ? 'iti' : 'ug'),
    fits: (a) => a.cats.includes('pwd') && a.aicte, rowGuide: true, src: ['AICTE guideline', G + 'AICTE/AICTE_2012_G.pdf'], docs: 'see' },
  { id: 'swanath', match: (r) => central(r) && /Swanath/.test(r.name), ceil: 800000, course: (r) => (/Diploma/.test(r.name) ? 'iti' : 'ug'),
    fits: (a) => (a.swanath || a.orphan) && a.aicte, notes: ['n_no_other'], src: ['para 2', G + 'AICTE/AICTE_3038_G.pdf'], docs: 'see' },
  { id: 'ishan', match: (r) => central(r) && /Ishan Uday/.test(r.name), ceil: 450000, lt: true,
    fits: (a) => a.ner12 && a.course === 'ug' && !a.renewal, src: ['para 2', G + 'Guidelines_ISHAN%20UDAY_2324.pdf'], docs: 'see' },
  { id: 'jkl', match: (r) => central(r) && /Jammu Kashmir And Ladakh/.test(r.name), ceil: 800000,
    fits: (a) => (a.state === 'JK' || a.state === 'LA') && a.jk12 && a.course !== 'c11',
    src: ['para 6', G + 'AICTE/PM_USPY(SSSJKL)SchemeSpecifications.pdf'], docs: 'see' },
  { id: 'nmms', match: (r) => central(r) && /National Means Cum Merit/.test(r.name), ceil: 350000,
    fits: (a) => a.course === 'c11' && a.renewal && a.nmms, src: ['para 1.1, 1.2', G + 'NMMSSGuidelines.pdf'], docs: 'see' },
];

export const ruleFor = (row) => RULES.find((r) => r.match(row)) || null;

// 'yes' | 'no' | 'edge' (the band straddles the limit) | 'unknown' (income not given).
export function incomeFits(income, ceil, lt = false) {
  if (income == null) return 'unknown';
  const { min, max } = typeof income === 'number' ? { min: income, max: income } : income;
  const ok = (x) => (lt ? x < ceil : x <= ceil);
  if (ok(max)) return 'yes';
  if (!ok(min)) return 'no';
  return 'edge';
}

export const inr = (n) => n.toLocaleString('en-IN');

export function deadlineFor(row, today) {
  const d = { open: row.open || null, close: row.close || null, institute: row.institute || null,
    defect: row.defect || null, checked: NSP_CHECKED };
  if (row.notOpen && !row.open) return { ...d, status: 'notyet' };
  if (!row.open || !row.close) return { ...d, status: 'unknown' };
  if (today < row.open) return { ...d, status: 'notyet' };
  if (today > row.close) return { ...d, status: 'closed' };
  return { ...d, status: 'open' };
}

// Where to apply for a welfare (post-matric) category. ST guideline para 5.i: each state builds its own
// platform or opts for NSP. Row on NSP -> NSP; else the state's portal (not verified); else nothing guessed.
export function portalFor(stateCode, cat) {
  const st = STATES.find((s) => s.code === stateCode);
  if (!st) return { where: 'unknown', url: NODAL };
  const rows = NSP.filter((r) => sponsored(r) && stateOf(r) === st.nsp && ROW_CATS[cat]?.(r));
  if (rows.length) return { where: 'nsp', url: NSP_HOME, rows };
  const url = st.portals[cat] || st.portals.all;
  if (url) return { where: 'state', url, verified: false };
  return { where: 'unknown', url: NODAL, verified: false };
}

// Central guideline limit per welfare category, shown (never used to filter) when the state runs it.
const CENTRAL_CEIL = { sc: 'pms_sc', st: 'pms_st', obc: 'pms_obc', ebc: 'pms_obc', dnt: 'pms_obc' };

// Documents, quoted per scheme; others point to the guideline. Keys are i18n keys.
export function documentsFor(ruleId, renewal = false) {
  const docs = RULES.find((r) => r.id === ruleId)?.docs || 'see';
  if (docs === 'csss') return { keys: renewal ? ['d_prev_marks'] : ['d_xii_marks', 'd_income', 'd_caste_if', 'd_disab_if'], src: G + 'FAQ_DOHE_CSSS.pdf' };
  if (docs === 'sc_obc') return { keys: ['d_photo', 'd_all_exams', 'd_caste', 'd_income_state', 'd_income_once'], src: G + 'Manipur_state_scheme/manipur_3032_G.pdf' };
  if (docs === 'pwd') return { keys: ['d_photo', 'd_income_rev', 'd_aadhaar', 'd_disab', 'd_last_marks', 'd_fee', 'd_bank', 'd_upload'], src: G + 'DEPDFAQ.pdf' };
  return { keys: [], src: null };
}

const ORDER = { open: 0, notyet: 1, unknown: 2, closed: 3 };

/**
 * a = { course, state, cats[], income ({min,max} | number | null), renewal, girl, aicte, swanath, orphan,
 *       ner12, jk12, csssOk, nmms }
 * Returns { fits, stateRoutes, unread, otherCentral, notes }. No amounts anywhere: only the income limit.
 */
export function eligibleSchemes(a, today) {
  const st = STATES.find((s) => s.code === a.state);
  const fits = [];
  const unread = [];
  const seen = new Set();
  const add = (row, rule) => {
    if (seen.has(row.name)) return;
    seen.add(row.name);
    const orphan = rule.orphanNoLimit && a.orphan;
    const income = orphan ? 'yes' : incomeFits(a.income, rule.ceil, rule.lt);
    if (income === 'no') return;
    fits.push({ id: rule.id, row, ceil: rule.ceil, lt: !!rule.lt, income, orphan: !!orphan,
      src: rule.rowGuide && row.guide ? [rule.src[0], row.guide] : rule.src, // degree and diploma have their own AICTE PDF
      notes: rule.notes || [], deadline: deadlineFor(row, today), docs: documentsFor(rule.id, a.renewal) });
  };

  // Post-matric welfare schemes of the student's state.
  const stateRoutes = [];
  for (const cat of WELFARE.filter((c) => a.cats.includes(c))) {
    const p = portalFor(a.state, cat);
    if (p.where === 'nsp') {
      for (const row of p.rows) {
        const rule = ruleFor(row);
        if (rule) add(row, rule);
      }
    } else {
      const r = RULES.find((x) => x.id === CENTRAL_CEIL[cat]);
      stateRoutes.push({ cat, ...p, centralCeil: r.ceil, src: r.src });
    }
  }

  // Central schemes.
  for (const row of NSP.filter(central)) {
    const rule = ruleFor(row);
    if (!rule?.fits || !rule.fits(a)) continue;
    if (rule.course && rule.course(row) !== a.course) continue;
    add(row, rule);
  }

  // Every other sponsored or state row of this state: date and guideline only, rules not read by us.
  // Rows that name a welfare category the student did not pick are left out (an SC row for an OBC student).
  const otherCat = (row) => WELFARE.some((c) => ROW_CATS[c](row)) && !WELFARE.some((c) => a.cats.includes(c) && ROW_CATS[c](row));
  if (st) {
    for (const row of NSP.filter((r) => !central(r) && stateOf(r) === st.nsp)) {
      if (seen.has(row.name) || ruleFor(row) || otherCat(row)) continue;
      unread.push({ row, deadline: deadlineFor(row, today) });
    }
  }
  // Central rows outside the BRIEF table: date and guideline only, for everyone.
  const otherCentral = NSP.filter((r) => central(r) && !ruleFor(r)).map((row) => ({ row, deadline: deadlineFor(row, today) }));

  const notes = [];
  if (a.cats.includes('minority')) notes.push('n_minority');
  if (!a.renewal && (a.course === 'ug' || a.course === 'pg')) notes.push('n_csss_fresh');
  if (a.renewal && !a.csssOk && (a.course === 'ug' || a.course === 'pg')) notes.push('n_csss_renew');

  fits.sort((x, y) => ORDER[x.deadline.status] - ORDER[y.deadline.status]);
  return { fits, stateRoutes, unread, otherCentral, notes };
}
