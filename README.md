# Chhatravritti Sahayak

Free, open-source helper for students from poor families in India. A student in Class 11 or 12,
ITI or diploma, college or university answers six short questions and sees which government
scholarships on the National Scholarship Portal (NSP) **may fit** them this year, where to apply
(NSP or their state's own portal), by when, with which documents, and the three checks that keep
an approved scholarship from getting stuck before it reaches the bank account. English and Hindi,
built for a cheap phone on a slow connection. For students, parents, and the teachers or college
clerks who fill these forms for them.

It never says "eligible for sure" and never shows a scholarship amount: only the income limit and
the rule as written in the official guideline, with the paragraph and a link to the PDF.

Entry for Code for a Billion 2026, track Education.

Live: https://chhatravritti-sahayak.designmaster.workers.dev · usage numbers: https://chhatravritti-sahayak.designmaster.workers.dev/stats · demo video: `video/demo.mp4` (81 s)

## What it does

One question per screen: course now (Class 11-12, ITI/diploma, UG, PG, PhD) → state or UT of
domicile → category (SC, ST, OBC, EBC, DNT, minority community, person with a disability of 40%
or more, general; more than one allowed) → family income last year (bands that follow the
official limits: 1.5, 2.5, 3.5, 4.5, 6 and 8 lakh) → fresh or renewal → a short optional step
(girl, AICTE technical course, orphan, Swanath situations, Class XII in the North East, Class XII
in J&K or Ladakh, NMMS selection, CSSS renewal with 50% marks and 75% attendance). Each optional
question is only asked where it can change the list.

The result shows:

- **Cards for the schemes that may fit**, each with the rule quoted from the guideline, its
  paragraph and PDF link, where to apply, the deadline of that row on NSP as open / closed / not yet
  open (computed against today's date in IST, never hardcoded), the institute verification and
  defect correction dates, "Checked on 05 Nov 2026 on scholarships.gov.in", and the documents
  quoted per scheme (or a link to the guideline where we did not read a list).
- **State-run post-matric schemes**: when NSP has no row for your state and category, the card says
  "NSP does not list this scheme for your state; the state runs it; dates and rules NOT verified by
  us, the state may use a different income limit", links the state portal if we saw its official
  domain, or the NSP nodal officers list and helpdesk if we did not. It is never filtered by income:
  the central limit is shown only as "central guideline".
- **Other NSP rows for your state** (and other central rows) with their date and guideline link and
  "rules not read by us, open the guideline". Never a limit.
- One Time Registration before applying, the three checks (Aadhaar-seeded bank account, same name
  everywhere, institute verification), what to do after approval, helplines.
- "Copy checklist", "Send on WhatsApp" and a "Did you apply?" yes / not yet box.

A minority student is told that the 2026-27 NSP lists show no post-matric or merit-cum-means scheme
of the Ministry of Minority Affairs, as listed on 05 Nov 2026, and still sees what fits their other
answers.

## Run it

Requirements: Node.js 20+.

```sh
npm test              # same as: node --test (rules, strings, Worker)
npx wrangler dev      # app + API at http://localhost:8787
python3 -m http.server 8765   # or just the static app, without the counter
```

Add `?nostats` to the URL to keep tests and demo recordings out of the public numbers.

Deploy (Cloudflare Workers, static assets plus one Durable Object for the counter):
`npx wrangler deploy`. Live on Cloudflare Workers since 05 Nov 2026.

Refresh the dates: `python3 tools/nsp_snapshot.py` reads the three "Schemes on NSP" lists on
scholarships.gov.in and rewrites `nsp-data.js`; change `CHECKED` in it, the app shows that date
next to every deadline. Do not edit `nsp-data.js` by hand.

## Files

| File | What |
|---|---|
| `rules.js` | Pure functions `eligibleSchemes`, `portalFor`, `deadlineFor`, `documentsFor`; `today` is a parameter. Only the verified facts of `BRIEF.md`. |
| `nsp-data.js` | Generated: every 2026-27 NSP row from Class 11 up, with student, defect, institute and state dates and guideline links. |
| `i18n.js` | English and Hindi, same keys. No rupee figure is written in a string: limits arrive as variables. |
| `app.js`, `index.html`, `styles.css` | The app. No framework, about 78 KB of code apart from `nsp-data.js`. |
| `worker.js`, `wrangler.toml`, `stats.html` | Anonymous counter and the public `/stats.html` page. |
| `tests/` | `node --test`: every income limit inside and one rupee outside, portals, dates, text checks, Worker. |

## Tests

`tests/rules.test.mjs` covers, among others: each income limit at the limit (inside) and one rupee
more (outside), with "below 4.5 lakh" for Ishan Uday (4,50,000 itself is out) and "less than
2.5 lakh" for PM YASASVI Top Class Schools; the Uttarakhand OBC limit of 1,50,000; CSSS not offered
to a fresh student (and the note why) and offered on renewal; closed, open and not-yet-open by the
date passed in; Punjab SC (15-11-2026) against Delhi SC (15-02-2027); Uttar Pradesh SC going to the
state portal, "not verified", for any income; Arunachal Pradesh SC with no portal guessed;
minority-only and a general student with no scheme; no English or Hindi string promising money or
stating an amount; English and Hindi keys complete; no em dash or emoji; app code under 100 KB.
Each test was seen failing against a deliberately broken rule (changed limit, `<` turned into `<=`,
CSSS offered to fresh students, close date off by one, a guessed portal, the income filter removed)
before it was trusted.

## Real cases

11 published High Court and Information Commission decisions (268 students, 6 States) where a student lost or
waited 2 to 7 years for a post-matric scholarship. 9 name what stopped the money: a bank account with a credit
limit or details PFMS would not match, a father's name or account holder name that did not match, an institute
that did not forward or over-verified, a paper application or a closed online window. Each of those is one of
the app's 3 checks or its last date. `tests/real-cases.test.mjs` checks each quote word for word, that the
matching warning is on the result screen in English and Hindi, and replays the student's answers through
`rules.js`; it was seen failing against 5 mutants (a warning taken off the screen, its wording changed, Punjab
SC moved off NSP, a word changed in a quote). Table, numbers, the 10 places the app reads a case differently,
and limits: [`evidence/real-cases`](evidence/real-cases/README.md).

## Sources (all read on 05 Nov 2026)

G = https://scholarships.gov.in/public/schemeGuidelines/ · F = https://scholarships.gov.in/public/FAQ/

**Dates**: the three "Schemes on NSP" lists, https://scholarships.gov.in/All-Scholarships, read by
`tools/nsp_snapshot.py` into `nsp-data.js`.

**Rules and income limits**

| Scheme | Rule used | Source |
|---|---|---|
| Post-matric SC (centrally sponsored) | up to Rs 2,50,000; Class XI to PG | para 5.3 and 4.2, [G/Manipur_state_scheme/manipur_3032_G.pdf](https://scholarships.gov.in/public/schemeGuidelines/Manipur_state_scheme/manipur_3032_G.pdf) |
| Post-matric ST (centrally sponsored) | up to Rs 2,50,000; not for an orphan supported by a guardian | para 3 and 3.3, [G/PMS Scheme Guide Lines - Tribal Affairs.pdf](https://scholarships.gov.in/public/schemeGuidelines/PMS%20Scheme%20Guide%20Lines%20-%20Tribal%20Affairs.pdf) |
| PM YASASVI post-matric OBC/EBC/DNT | up to Rs 2.50 lakh; two boys per parents; one scholarship | para 5 (x, xi, xiv, xv), 6.1, [G/Guidlines_3099.pdf](https://scholarships.gov.in/public/schemeGuidelines/Guidlines_3099.pdf) |
| Uttarakhand OBC (exception) | OBC Rs 1,50,000; SC/ST Rs 2,50,000 | [G/Help_manual.pdf](https://scholarships.gov.in/public/schemeGuidelines/Help_manual.pdf) (Hindi, legacy font) |
| Post-matric Students with Disabilities | 40% or more; up to Rs 2.50 lakh; UDID consent first | Q1, Q2, Q4, [G/DEPDFAQ.pdf](https://scholarships.gov.in/public/schemeGuidelines/DEPDFAQ.pdf) |
| Top Class SC | up to Rs 8.00 lakh; notified institutes | para 2a, [G/Top_Class_Education_Scheme_2018.pdf](https://scholarships.gov.in/public/schemeGuidelines/Top_Class_Education_Scheme_2018.pdf) |
| PM YASASVI Top Class College | up to Rs 2.50 lakh; apply every year | para 3(i), [G/ApprovedmodifieddraftofTopClassCollege.pdf](https://scholarships.gov.in/public/schemeGuidelines/ApprovedmodifieddraftofTopClassCollege.pdf) |
| National Scholarship ST | up to Rs 6.0 lakh | para 2.2, [G/tribalfellowshipguideline.pdf](https://scholarships.gov.in/public/schemeGuidelines/tribalfellowshipguideline.pdf) |
| Top Class Students with Disabilities | up to Rs 8 lakh; UG and PG | para 3, [G/DEPDGuidelines_1.pdf](https://scholarships.gov.in/public/schemeGuidelines/DEPDGuidelines_1.pdf) |
| PM-USP CSSS | renewal only in 2026-27; up to Rs 4.5 lakh; renewal 50% marks, 75% attendance | para 4, [G/CSSS_GUIDLINES_07022024_updated.pdf](https://scholarships.gov.in/public/schemeGuidelines/CSSS_GUIDLINES_07022024_updated.pdf) |
| AICTE Pragati | girl; AICTE degree or diploma; up to Rs 8 lakh | [G/AICTE/AICTE_2010_G.pdf](https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2010_G.pdf), [AICTE_2011_G.pdf](https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2011_G.pdf) |
| AICTE Saksham | 40% or more; up to Rs 8 lakh | [G/AICTE/AICTE_2012_G.pdf](https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2012_G.pdf), [AICTE_2013_G.pdf](https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2013_G.pdf) |
| AICTE Swanath | orphan or listed situations; up to Rs 8 lakh | para 2, [G/AICTE/AICTE_3038_G.pdf](https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_3038_G.pdf) |
| Ishan Uday (UGC) | Class XII in the North East; first year UG; below Rs 4.50 lakh | para 2, [G/Guidelines_ISHAN UDAY_2324.pdf](https://scholarships.gov.in/public/schemeGuidelines/Guidelines_ISHAN%20UDAY_2324.pdf) |
| PM USP J&K and Ladakh | domicile; Class XII from JKBOSE or CBSE there; up to Rs 8.00 lakh | para 6, [G/AICTE/PM_USPY(SSSJKL)SchemeSpecifications.pdf](https://scholarships.gov.in/public/schemeGuidelines/AICTE/PM_USPY(SSSJKL)SchemeSpecifications.pdf) |
| PM YASASVI Top Class Schools | less than Rs 2.5 lakh; Rajasthan, Keralam, Karnataka must wait | [G/3061_G.pdf](https://scholarships.gov.in/public/schemeGuidelines/3061_G.pdf) and the NSP home notice |
| NMMS | selected in the Class VIII exam; up to Rs 3,50,000; XI-XII renewals | para 1.1, 1.2, [G/NMMSSGuidelines.pdf](https://scholarships.gov.in/public/schemeGuidelines/NMMSSGuidelines.pdf) |

Every other NSP row is shown with its date and guideline link only, as "rules not read by us".

**Where to apply**: ST guideline para 5.i (each state builds its own platform or opts for NSP).
State portals, official domains seen on 05 Nov 2026: Uttar Pradesh https://scholarship.up.gov.in ·
Bihar (SC/ST) https://scstpmsonline.bihar.gov.in/scstpms2223/pms/StudentDefault.aspx · Chhattisgarh
https://postmatric-scholarship.cg.nic.in · Madhya Pradesh https://hescholarship.mp.gov.in ·
Rajasthan https://sjmsnew.rajasthan.gov.in/scholarship/ · Karnataka https://ssp.postmatric.karnataka.gov.in ·
Telangana https://telanganaepass.cgg.gov.in · Andhra Pradesh https://jnanabhumi.ap.gov.in · West Bengal
https://oasis.wb.gov.in · Gujarat https://www.digitalgujarat.gov.in/CitizenNew/ScholarshipServices.aspx ·
Jharkhand https://ekalyan.cgg.gov.in · Kerala https://egrantz.kerala.gov.in · Odisha
https://scholarship.odisha.gov.in · Maharashtra https://mahadbt.maharashtra.gov.in · Tamil Nadu SC/ST
https://tnadw.tn.gov.in/scholarshipform/en and BC https://bcw.tn.gov.in/sub_page/8. Any other
state: the NSP nodal officers list https://scholarships.gov.in/nodalofficerList and the helpdesk.

**What we could not open from outside India**: most Indian state sites refuse connections from
outside the country. We could not open the portals of Uttar Pradesh, Bihar, Chhattisgarh, Madhya
Pradesh, Rajasthan, Karnataka, Telangana, Andhra Pradesh, West Bengal, Gujarat, Jharkhand and Tamil
Nadu from our machine, so the app links them as "not verified by us" and never states their dates
or income limits.

**Applying for more than one**: [F/NSP_FAQsORApplicationUsermanul_V2.2.pdf](https://scholarships.gov.in/public/FAQ/NSP_FAQsORApplicationUsermanul_V2.2.pdf) Q3 and the NSP home page.

**One Time Registration**: [F/OTR FAQ v1.4.pdf](https://scholarships.gov.in/public/FAQ/OTR%20FAQ%20v1.4.pdf) Q5, Q20, Q27; NSP home notices (OTR app, AadhaarFaceRD, error 904, locked biometrics, the CSC fee); CSC locator https://locator.csccloud.in.

**Documents**: [G/FAQ_DOHE_CSSS.pdf](https://scholarships.gov.in/public/schemeGuidelines/FAQ_DOHE_CSSS.pdf) (CSSS), SC para 8.3 in manipur_3032_G and YASASVI para 8.3 (SC and OBC/EBC/DNT), DEPDFAQ Q13 (disability).

**The three checks and after approval**: CSSS FAQ Q6-9 and Q15; [G/npci_base.pdf](https://scholarships.gov.in/public/schemeGuidelines/npci_base.pdf); DEPDFAQ Q18 and Q23; [F/NSP_SOP.pdf](https://scholarships.gov.in/public/FAQ/NSP_SOP.pdf) 3a, 3e-3i, 3k; NSP FAQ Q6, Q8, Q12, Q13; PFMS Know Your Payment https://pfms.nic.in/SitePages/KnowYourPayment_Dw_NewNew.aspx; NSP status https://scholarships.gov.in/payl/loginPage.action; NSP helpdesk 0120-6619540; PFMS 1800 118 111; NSP eligibility check https://scholarships.gov.in/scholarshipEligibility; grievance https://nsp.gov.in/grievanceregistration/.

## Why it matters (scale)

- Post-matric scholarship for SC students: the Cabinet approved Rs 59,048 crore for more than 4
  crore SC students over 5 years (PIB PRID 1682967, 23 Dec 2020). Nearly 48 lakh SC students a
  year; 48,04,208 beneficiaries and Rs 5,562.23 crore of central assistance in 2024-25 (PIB PRID
  2287841, 22 Jul 2026).
- Post-matric scholarship for SC students, 2021-22, as told to Parliament on 26 Jul 2022: **64,01,641
  applied and 42,53,886 had received it**; 3,13,403 applications had been rejected by State Governments,
  and "the details of rejected scholarship is not maintained on National Scholarship Portal" (Ministry of
  Social Justice & Empowerment, PIB PRID 1844993,
  <https://www.pib.gov.in/PressReleasePage.aspx?PRID=1844993>). The Ministry does not keep the reasons there, so
  the app shows the checks that the guidelines, FAQs and SOP tie to the money before the student applies.
- Retention at secondary level was 51.9% in 2025-26 and the dropout rate 7.0% (UDISE+ 2025-26,
  PIB PRID 2282141). We found no source that links a number of dropouts to scholarship money, so
  we claim none.

## Privacy and usage numbers

No account, no cookies, no answers sent anywhere: the list is computed on the phone. The Worker
counts only the event name (`check`, `schemes` with how many were shown, `copy`, `share`,
`applied_yes`, `applied_no`), the language and the day. Live numbers: `/stats.html`, raw JSON at
`/api/stats`.

## Hindi

The Hindi text was written by an AI agent (Claude Code) from the English strings and has not yet
been reviewed by a native speaker. Corrections are welcome as issues or pull requests.

## How it was built

In the **AgentFoundry IDE**: this folder was opened in AgentFoundry and **Claude Code** was run from
the AgentFoundry integrated terminal against `BRIEF.md`. Before that, the facts the app may state
were read in the official guidelines and FAQs on scholarships.gov.in and written into the brief's
"Verified facts", and `tools/nsp_snapshot.py` captured the 2026-27 NSP lists into `nsp-data.js`.
A first Claude Code run wrote `rules.js` and stopped on a usage limit; a second run reviewed it
against the brief, kept it, tightened two points (no Tamil Nadu portal guessed for DNT, AICTE
degree and diploma rows cite their own PDF), then wrote the tests first (`node --test`), the
bilingual strings, the Worker and stats page (same shape as Ghar Ki Hawa), the UI and this README,
committing each step with conventional commits. The tests were mutation-checked, and the flow was
clicked through in a real Chrome at desktop width and at 360 px, in English and Hindi, and after
the deploy on a real Android phone (Redmi Note 14 Pro, 375 px) and a desktop browser.

## License

MIT, see [LICENSE](LICENSE).
