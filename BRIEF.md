# Chhatravritti Sahayak — brief (Code for a Billion 2026, track Education)

Goal: a free, open-source agent that tells a student from a poor family in India which government
scholarships for Class 11 and above they can apply for this year, where (the National Scholarship
Portal or their state's portal), by when, with which documents, and the mistakes that get an
application rejected or the money stuck after approval, in English and Hindi, on a cheap phone.
Built for students, parents and the teachers or college clerks who fill these forms for them.

Why this one: on 05/11/2026 the hub has two real Education entries (issue #40, career guidance on
the Holistic Progress Card; issue #6, an accessible web view for learners) and one empty template
(#2). Nothing covers the money that keeps a poor student in school. "Dropout prevention" is named
in the Education area on codeforindia.org/hackathon. Timing: third-party sites report that the
2026-27 post-matric window on the National Scholarship Portal was extended to 30 November 2026
(VERIFY on scholarships.gov.in), so students are filling these forms right now.

## Facts we may use (cite each one in the README; nothing else is a fact)

All of these come from secondary pages read on 05/11/2026. VERIFY EACH ONE in the official
source (scholarships.gov.in notices and FAQs, the scheme guidelines of the Ministry of Social
Justice and Empowerment, Ministry of Tribal Affairs, Ministry of Minority Affairs, Department of
Empowerment of Persons with Disabilities, Department of Higher Education, PIB releases) and cite
that, not the secondary page. What cannot be found in an official source does not go in the app.

- NSP 2026-27: registration opened 1 June 2026; pre-matric closed 31 October 2026; post-matric
  reportedly extended to 30 November 2026; a defective-application correction window is
  reported for 15 November 2026. Some schemes and states have their own dates.
- Post-Matric Scholarship for Scheduled Caste students: family income ceiling Rs 2.5 lakh a year;
  the Union Cabinet approved Rs 59,048 crore in December 2020 for about 4 crore SC students over
  five years (PIB). In many states this scheme is applied for on the STATE portal, not on NSP.
- Post-matric schemes for OBC/EBC/DNT (PM YASASVI), ST students, students with disabilities and
  minority communities, and the Central Sector Scheme of Scholarships for College and University
  Students (merit in Class 12 + income ceiling): income ceilings and who applies where differ by
  scheme. Quote each ceiling only from that scheme's guideline.
- Common reasons money does not arrive: bank account not seeded with Aadhaar for DBT, details
  not matching between Aadhaar, certificates and the form, institute verification not done in
  time (institute, district and state nodal officers). Quote the official FAQ for each.

Not allowed: promising a scholarship, stating an amount the student "will get", an income ceiling
or a deadline without its official source and the date it was read, state rules guessed from
another state, any paid API, any tracking beyond the anonymous counter below. For a state whose
rules were not verified, the agent says so and links the official state portal only.

## Build (same pattern as Ghar Ki Hawa, Nyaya Sahayak and Fasal Nuksan Sahayak in ~/Backups/impressora)

- Static web app (index.html + app.js + i18n en/hi), no framework, < 100 KB, works on 3G; one
  Cloudflare Worker for the anonymous counter.
- Flow, one step per screen: course now (Class 11-12, ITI/diploma, UG, PG, PhD) -> state of
  domicile -> category (SC, ST, OBC, EBC, DNT, minority community, person with disability,
  general; more than one allowed) -> annual family income (bands that match the official
  ceilings) -> marks in the last exam (only when a merit scheme needs it) -> fresh or renewal.
- Result card: the schemes that fit, each with the rule quoted and its source; WHERE to apply
  (NSP or the named state portal, official link); the deadline with the date it was checked;
  the documents list; the 3 checks before submitting (Aadhaar-seeded bank account and how to check
  it, names matching across documents, institute verification); "Copy checklist" and a WhatsApp
  share; a "Did you apply?" yes/no box for the counter.
- rules.js = pure functions (eligibleSchemes, portalFor, deadlineFor, documentsFor) with
  `node --test` tests: each income ceiling edge (ceiling inside, ceiling + 1 outside), a category
  with no scheme, a state with no verified data (must answer "not verified, use the state
  portal"), the text never promising money, Hindi and English keys complete. See each test fail
  once against a broken rule before trusting it (mutation check, like Ghar Ki Hawa).
- /stats page and /api/stats JSON like the others: checks, schemes shown, checklists copied or
  shared, "Did you apply?" yes/no, by language and day; no personal data. This is the Proven
  impact evidence.
- README: setup, sources for every rule, ceiling and date, how AgentFoundry was used, MIT license.

## AgentFoundry requirement (eligibility)

Build inside the AgentFoundry IDE (/Applications, login info@designmastersolutions.com, vault
`agentfoundry:dms`): open this folder in AF and run Claude Code from the AF integrated terminal
against this brief, as Nyaya Sahayak (Impressora R144) and Ghar Ki Hawa were built. Decline the AF
migration wizard (it offers to import paid OpenAI/Gemini keys). R144 notes: keep the screen awake
with `caffeinate -u`; type into the IDE only with `osascript activate` + keystroke in the same call.
The IDE is shared with the Fasal Nuksan Sahayak build (terminal 2948b368): use your own AF window
for this folder and never type into theirs.

## Submission (issue form `submission.yml` in karlmehta/code-for-a-billion)

Title "[Submission] Chhatravritti Sahayak (Design Master Solutions)", track Education, team Alan De
Bortolo (@alandebortolo), repo + live URL + a short demo video, problem statement, what you built
(and how AF was used), scale and severity with the sources above, deployment and impact data with
the /stats link. Deadline: deployed and filed before 15/11/2026; target 11/11/2026. Winners
05/12/2026.

## Judging (JUDGING.md, 25% each)

Size of the problem, Severity, Quality of the solution, Proven impact (also the tie-breaker).
Prizes per track on codeforindia.org/hackathon (read on 05/11/2026): 1st Rs 1,50,000,
2nd Rs 1,00,000, 3rd Rs 50,000 "per track / category"; the hub README (August) and the welcome
e-mail say an overall podium instead. Discussion #52 asks which one applies. The FAQ sets no limit
on projects per participant.
