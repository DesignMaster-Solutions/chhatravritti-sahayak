// UI only: steps, answers and rendering. Every rule, limit, portal and date comes from rules.js.
import { t, fmtDate } from './i18n.js';
import {
  eligibleSchemes, RULES, STATES, COURSES, CATS, INCOME_BANDS, NSP_CHECKED, inr,
  G, F, NODAL, NSP_HOME, NSP_ALL, shareUrl, answersFrom,
} from './rules.js';

const $ = (s) => document.querySelector(s);
const STEPS = ['course', 'state', 'cats', 'income', 'renewal', 'more', 'result'];
const qLang = new URLSearchParams(location.search).get('lang');
const state = { lang: ['en', 'hi'].includes(qLang) ? qLang : navigator.language?.startsWith('hi') ? 'hi' : 'en', step: 0 };
const a = { course: null, state: '', cats: [], income: null, renewal: null, x: {} };
const L = (k, v) => t(state.lang, k, v);
const D = (iso) => fmtDate(state.lang, iso);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const link = (url, label) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`;
const todayIST = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const CSC_FEE = 30; // NSP home notice, 05 Nov 2026: OTR at a CSC, all-inclusive.
const ceilOf = (id) => RULES.find((r) => r.id === id).ceil;

// Anonymous counter: event name and language only (plus the number of schemes shown).
// ?nostats keeps our own tests and demo recordings out of the public impact numbers.
const NOSTATS = new URLSearchParams(location.search).has('nostats');
function track(event, extra = {}) {
  if (NOSTATS) return;
  try { navigator.sendBeacon?.('/api/event', JSON.stringify({ event, lang: state.lang, ...extra })); } catch { /* offline */ }
}

const radio = (name, value, label, checked) => `<label class="opt"><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''}><span>${esc(label)}</span></label>`;
const box = (name, value, label, checked) => `<label class="opt"><input type="checkbox" name="${name}" value="${value}"${checked ? ' checked' : ''}><span>${esc(label)}</span></label>`;
const bandLabel = (b) => (b.min === 0 ? L('band_upto', { max: inr(b.max) })
  : b.max === Infinity ? L('band_above', { min: inr(b.min - 1) }) : L('band_range', { min: inr(b.min), max: inr(b.max) }));

// Optional questions, shown only where they can change the list.
const EXTRAS = [
  ['girl', () => true], ['aicte', () => a.course === 'iti' || a.course === 'ug'], ['orphan', () => true],
  ['swanath', () => a.course === 'iti' || a.course === 'ug'], ['ner12', () => a.course === 'ug' && !a.renewal],
  ['jk12', () => a.state === 'JK' || a.state === 'LA'], ['nmms', () => a.course === 'c11' && a.renewal],
  ['csss', () => a.renewal && (a.course === 'ug' || a.course === 'pg')],
];

function renderForms() {
  $('#course-list').innerHTML = COURSES.map((c) => radio('course', c, L(`course_${c}`), a.course === c)).join('');
  $('#state').innerHTML = `<option value="">${esc(L('state_pick'))}</option>`
    + [...STATES].sort((x, y) => x.nsp.localeCompare(y.nsp)).map((s) => `<option value="${s.code}"${a.state === s.code ? ' selected' : ''}>${esc(s.nsp)}</option>`).join('');
  $('#cat-list').innerHTML = CATS.map((c) => box('cat', c, L(`cat_${c}`), a.cats.includes(c))).join('');
  $('#income-list').innerHTML = INCOME_BANDS.map((b) => radio('income', b.id, bandLabel(b), a.income?.id === b.id)).join('');
  $('#renewal-list').innerHTML = radio('renewal', 'fresh', L('fresh'), a.renewal === false) + radio('renewal', 'renewal', L('renewal'), a.renewal === true);
  $('#more-list').innerHTML = EXTRAS.filter(([, show]) => show()).map(([k]) => box('x', k, L(`x_${k}`), a.x[k])).join('');
}

function applyLang() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = L(el.dataset.t); });
  $('#lang').textContent = L('lang_other');
  $('#lang').lang = state.lang === 'en' ? 'hi' : 'en';
  $('#foot-note').textContent = L('foot_note', { date: D(NSP_CHECKED) });
  renderForms();
  if (STEPS[state.step] === 'result') renderResult();
  show(false);
}

function show(focus = true) {
  const name = STEPS[state.step];
  document.querySelectorAll('.step').forEach((s) => { s.hidden = s.dataset.step !== name; });
  const q = STEPS.length - 1;
  $('#progress').textContent = name === 'result' ? '' : L('step', { n: state.step + 1, total: q });
  $('#nav').hidden = name === 'result';
  $('#back').style.visibility = state.step === 0 ? 'hidden' : 'visible';
  $('#next').textContent = L(name === 'more' ? 'see_result' : 'next');
  $('#msg').textContent = '';
  if (focus) { document.querySelector(`[data-step="${name}"] h1, #result h1`)?.focus(); window.scrollTo(0, 0); }
}

// Reads the current screen into `a`; returns an error key or ''.
function read() {
  const name = STEPS[state.step];
  const val = (n) => document.querySelector(`input[name=${n}]:checked`)?.value;
  if (name === 'course') { a.course = val('course') || null; return a.course ? '' : 'pick_one'; }
  if (name === 'state') { a.state = $('#state').value; return a.state ? '' : 'pick_state'; }
  if (name === 'cats') {
    a.cats = [...document.querySelectorAll('input[name=cat]:checked')].map((i) => i.value);
    return a.cats.length ? '' : 'pick_one';
  }
  if (name === 'income') { a.income = INCOME_BANDS.find((b) => b.id === val('income')) || null; return a.income ? '' : 'pick_one'; }
  if (name === 'renewal') { const v = val('renewal'); a.renewal = v ? v === 'renewal' : null; return v ? '' : 'pick_one'; }
  if (name === 'more') {
    a.x = Object.fromEntries([...document.querySelectorAll('input[name=x]:checked')].map((i) => [i.value, true]));
  }
  return '';
}

function go(delta) {
  if (delta > 0) {
    const err = read();
    if (err) { $('#msg').textContent = L(err); return; }
  }
  state.step = Math.max(0, Math.min(STEPS.length - 1, state.step + delta));
  if (STEPS[state.step] === 'more') renderForms();
  if (STEPS[state.step] === 'result') { renderResult(); trackResult(); }
  show();
}

function answers() {
  const ex = (k) => !!a.x[k] && EXTRAS.find(([n]) => n === k)[1]();
  return {
    course: a.course, state: a.state, cats: a.cats, income: a.income, renewal: !!a.renewal,
    girl: ex('girl'), aicte: ex('aicte'), orphan: ex('orphan'), swanath: ex('swanath'), ner12: ex('ner12'),
    jk12: ex('jk12'), nmms: ex('nmms'), csssOk: ex('csss'),
  };
}

let last = null;

const statusText = (d) => (d.status === 'open' ? L('dl_open', { date: D(d.close) })
    : d.status === 'closed' ? L('dl_closed', { date: D(d.close) })
      : d.status === 'notyet' ? (d.open ? L('dl_notyet_from', { date: D(d.open) }) : L('dl_notyet'))
        : L('dl_unknown'));

function deadlineLines(d, full = true) {
  const out = [`<p class="stamp ${d.status}">${esc(statusText(d))}</p>`];
  if (full && d.status !== 'closed') {
    if (d.institute) out.push(`<p class="when">${esc(L('dl_institute', { date: D(d.institute) }))}</p>`);
    if (d.defect) out.push(`<p class="when">${esc(L('dl_defect', { date: D(d.defect) }))}</p>`);
  }
  out.push(`<p class="checked">${esc(L('checked', { date: D(d.checked) }))}</p>`);
  return out.join('');
}

function ruleText(f) {
  const vars = { limit: inr(f.ceil), sc: inr(ceilOf('pms_sc')) };
  return L(`r_${f.id}`, vars);
}

function card(f) {
  const docs = f.docs.keys.length
    ? `<ul class="docs">${f.docs.keys.map((k) => `<li>${esc(L(k))}</li>`).join('')}</ul><p class="src">${esc(L('source'))}: ${link(f.docs.src, L('guideline'))}</p>`
    : `<p>${esc(L('docs_see'))} ${link(f.row.guide || f.src[1], L('guideline'))}</p>`;
  const notes = [...(f.income === 'edge' ? ['income_edge'] : []), ...(f.orphan ? ['orphan_nolimit'] : []),
    ...(f.row.renewalOnly ? ['renewal_only'] : []), ...f.notes];
  return `<article class="card">
    <p class="tag">${esc(L('may_fit'))}</p>
    <h2>${esc(f.row.name)}</h2>
    ${deadlineLines(f.deadline)}
    <h3>${esc(L('rule'))}</h3>
    <p>${esc(ruleText(f))}</p>
    <p class="src">${esc(L('source'))}: ${esc(f.src[0])}, ${link(f.src[1], L('guideline'))}</p>
    ${notes.length ? `<ul class="notes">${notes.map((n) => `<li>${esc(L(n))}</li>`).join('')}</ul>` : ''}
    <h3>${esc(L('where'))}</h3>
    <p>${link(NSP_HOME, L('where_nsp'))}</p>
    <h3>${esc(L('docs'))}</h3>
    ${docs}
  </article>`;
}

function routeCard(r) {
  const general = r.cat === 'general';
  return `<article class="card warn">
    <h2>${esc(general ? L('sr_general_title') : L('sr_title', { cat: L(`cat_${r.cat}`) }))}</h2>
    <p>${esc(L(general ? 'sr_general_text' : 'sr_text'))}</p>
    <p class="big">${r.where === 'state' ? link(r.url, L('sr_portal')) : esc(L('sr_unknown'))}</p>
    ${r.where === 'state' ? '' : `<p>${link(NODAL, L('sr_nodal'))} · ${esc(L('help_nsp'))} <a href="tel:01206619540">0120-6619540</a></p>`}
    <p class="src">${esc(general ? L('sr_general_src', { para: r.src[0] }) : L('sr_central', { limit: inr(r.centralCeil), para: r.src[0] }))} ${link(r.src[1], L(general ? 'sr_general_link' : 'guideline'))}</p>
    ${r.read ? `<p>${esc(L('sr_read', { date: r.read.date }))}</p><ul>${r.read.keys.map((k) => `<li>${esc(L(k))}</li>`).join('')}</ul>
    <p class="src">${r.read.ceil ? esc(L(r.read.ceilKey || 'sr_read_ceil', { limit: inr(r.read.ceil), urban: inr(r.read.ceil2 || 0) })) + ' ' : ''}${r.read.ceilUrl ? link(r.read.ceilUrl, L('sr_read_ceil_link')) + ' · ' : ''}${link(r.read.url, L('sr_read_link'))}</p>
    ${(r.read.more || []).map((k) => `<p>${esc(L(k))}</p>`).join('')}` : ''}
  </article>`;
}

const mini = (u) => `<li><strong>${esc(u.row.name)}</strong>${deadlineLines(u.deadline, false)}<p>${esc(L('un_text'))} ${link(u.row.guide || NSP_ALL, L('guideline'))}</p></li>`;

function renderResult() {
  const today = todayIST();
  last = eligibleSchemes(answers(), today);
  const { fits, stateRoutes, unread, otherCentral, notes } = last;
  const n = fits.length + stateRoutes.length;
  const ul = (keys) => `<ul>${keys.map((k) => `<li>${esc(L(k))}</li>`).join('')}</ul>`;
  $('#result').innerHTML = `
    <h1 tabindex="-1">${esc(L('res_title'))}</h1>
    <p class="lead">${esc(n ? L('res_count', { n }) : L('res_none'))}</p>
    <p class="hint">${esc(L('res_disclaimer'))}</p>
    ${notes.map((k) => `<p class="note">${esc(L(k))}</p>`).join('')}
    ${fits.map(card).join('')}
    ${stateRoutes.map(routeCard).join('')}
    ${unread.length ? `<section class="block"><h2>${esc(L('un_title'))}</h2><ul class="mini">${unread.map(mini).join('')}</ul></section>` : ''}
    <details class="block"><summary>${esc(L('oc_title'))}</summary><ul class="mini">${otherCentral.map(mini).join('')}</ul>
      <p>${link(NSP_ALL, L('see_all'))}</p></details>

    <section class="block"><h2>${esc(L('multi_title'))}</h2><p>${esc(L('multi_text'))}</p>
      <p class="src">${link(F + 'NSP_FAQsORApplicationUsermanul_V2.2.pdf', 'NSP FAQ Q3')}</p></section>

    <section class="block"><h2>${esc(L('otr_title'))}</h2>
      <ul><li>${esc(L('otr_1'))}</li><li>${esc(L('otr_2'))}</li><li>${esc(L('otr_3'))}</li><li>${esc(L('otr_4'))}</li>
      <li>${esc(L('otr_5', { fee: CSC_FEE }))} ${link('https://locator.csccloud.in', L('csc_find'))}</li></ul>
      <p class="src">${link(F + 'OTR%20FAQ%20v1.4.pdf', 'OTR FAQ')}</p></section>

    <section class="block checks"><h2>${esc(L('chk_title'))}</h2>
      <h3>1. ${esc(L('chk1_t'))}</h3>${ul(['chk1_a', 'chk1_b', 'chk1_c', 'chk1_d', 'chk1_e'])}
      <p class="src">${link(G + 'npci_base.pdf', 'NPCI BASE')} · ${link(G + 'FAQ_DOHE_CSSS.pdf', 'CSSS FAQ')} · ${link(F + 'NSP_SOP.pdf', 'NSP SOP')}</p>
      <h3>2. ${esc(L('chk2_t'))}</h3>${ul(['chk2_a', 'chk2_b', 'chk2_c'])}
      <h3>3. ${esc(L('chk3_t'))}</h3>${ul(['chk3_a', 'chk3_b', 'chk3_c', 'chk3_d'])}
      <p class="src">${link(G + 'Top_Class_Education_Scheme_2018.pdf', 'Top Class SC 2b')} · ${link(G + 'ApprovedmodifieddraftofTopClassCollege.pdf', 'Top Class College 3(ii), 6(ii)')} · ${link(G + 'DEPDGuidelines_1.pdf', 'DEPwD slots')}</p>
      <h3>4. ${esc(L('chk4_t'))}</h3>${ul(['chk4_a', 'chk4_b', 'chk4_c'])}
      <p class="src">${link(G + 'Manipur_state_scheme/manipur_3032_G.pdf', 'PMS-SC 5.3, 8.3, 8.4')} · ${link(G + 'Guidlines_3099.pdf', 'PM YASASVI note 1')} · ${link(G + 'Top_Class_Education_Scheme_2018.pdf', 'Top Class SC 2a')}</p>
    </section>

    <section class="block"><h2>${esc(L('after_title'))}</h2>
      <ul><li>${esc(L('after_1'))} ${link('https://pfms.nic.in/SitePages/KnowYourPayment_Dw_NewNew.aspx', 'PFMS')}</li>
      <li>${esc(L('after_2'))}</li>
      <li>${link('https://scholarships.gov.in/payl/loginPage.action', L('after_status'))}</li></ul>
      <h3>${esc(L('help_title'))}</h3>
      <ul><li>${esc(L('help_nsp'))}: <a href="tel:01206619540">0120-6619540</a></li>
      <li>${esc(L('help_pfms'))}: <a href="tel:1800118111">1800 118 111</a></li>
      <li>${link('https://scholarships.gov.in/scholarshipEligibility', L('help_elig'))}</li>
      <li>${link('https://nsp.gov.in/grievanceregistration/', L('help_griev'))}</li></ul></section>

    <div class="actions">
      <button type="button" class="primary" id="copy">${esc(L('copy'))}</button>
      <a class="link" id="share" href="https://wa.me/?text=${encodeURIComponent(checklist())}" target="_blank" rel="noopener">${esc(L('share'))}</a>
    </div>
    <p><a class="link" id="pass" href="https://wa.me/?text=${encodeURIComponent(`${L('pass_text')} ${shareUrl(location.origin, a, state.lang)}`)}" target="_blank" rel="noopener">${esc(L('pass_on'))}</a></p>
    <div class="applied" id="applied">
      <p><strong>${esc(L('applied_q'))}</strong></p>
      <div class="actions"><button type="button" class="pill" data-applied="yes">${esc(L('yes'))}</button><button type="button" class="pill" data-applied="no">${esc(L('no'))}</button></div>
    </div>
    <div class="actions"><button type="button" class="link" id="edit">${esc(L('edit'))}</button><button type="button" class="link" id="restart">${esc(L('start_over'))}</button></div>`;

  $('#copy').onclick = async () => {
    try { await navigator.clipboard.writeText(checklist()); } catch { /* old browser: nothing to copy into */ }
    $('#copy').textContent = L('copied');
    track('copy');
  };
  $('#share').onclick = () => track('share');
  $('#pass').onclick = () => track('share_link');
  document.querySelectorAll('[data-applied]').forEach((b) => {
    b.onclick = () => {
      track(`applied_${b.dataset.applied}`);
      $('#applied').innerHTML = `<p>${esc(L('applied_thanks'))}</p>`;
    };
  });
  $('#edit').onclick = () => { state.step = 0; show(); };
  $('#restart').onclick = () => {
    Object.assign(a, { course: null, state: '', cats: [], income: null, renewal: null, x: {} });
    state.step = 0; renderForms(); show();
  };
}

function trackResult() {
  track('check');
  track('schemes', { n: last.fits.length + last.stateRoutes.length });
}

// Plain text for the clipboard and WhatsApp: name, deadline, where, documents, the 4 checks.
function checklist() {
  const { fits, stateRoutes } = last;
  const lines = [`*${L('list_head')}*`, ''];
  for (const f of fits) {
    const d = f.deadline;
    lines.push(`- ${f.row.name}`);
    lines.push(`  ${statusText(d)}`);
    if (d.institute && d.status !== 'closed') lines.push(`  ${L('dl_institute', { date: D(d.institute) })}`);
    lines.push(`  ${L('where')}: ${NSP_HOME}`);
    for (const k of f.docs.keys) lines.push(`  [ ] ${L(k)}`);
    if (!f.docs.keys.length) lines.push(`  ${L('docs')}: ${f.row.guide || f.src[1]}`);
  }
  for (const r of stateRoutes) lines.push(`- ${L('sr_title', { cat: L(`cat_${r.cat}`) })}: ${r.where === 'state' ? r.url : NODAL}`);
  lines.push('', L('checked', { date: D(NSP_CHECKED) }), '', `*${L('chk_title')}*`,
    `[ ] ${L('chk1_t')}`, `[ ] ${L('chk2_t')}`, `[ ] ${L('chk3_t')}`, `[ ] ${L('chk4_t')}`, '', L('list_link', { url: location.origin }));
  return lines.join('\n');
}

// Radios move on by themselves: one tap per question on a phone.
document.addEventListener('change', (e) => {
  if (e.target.type === 'radio') setTimeout(() => go(1), 150);
});
$('#state').addEventListener('change', () => { if ($('#state').value) go(1); });
$('#next').onclick = () => go(1);
$('#back').onclick = () => go(-1);
$('#lang').onclick = () => { read(); state.lang = state.lang === 'en' ? 'hi' : 'en'; applyLang(); };

// A shared link opens on its result (not counted as a check).
const shared = answersFrom(location.search);
if (shared) { Object.assign(a, shared); state.step = STEPS.length - 1; }
applyLang();

// Opens offline after the first visit (sw.js): rules, dates and documents need no network.
navigator.serviceWorker?.register('sw.js').catch(() => {});
