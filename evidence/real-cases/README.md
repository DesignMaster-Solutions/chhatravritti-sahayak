# Real cases: students who lost or waited for their scholarship

Every case here is a real, published decision. I searched indiankanoon.org on 5 November 2026 for High Court
and Information Commission decisions where a student lost, or had delayed, a government post-matric scholarship
because of the institute's verification, the bank account or DBT, a name or document mismatch, the portal or the
deadline. I read each decision in full. The text of each one is saved in `sources/`, and `cases.json` keeps the
facts each decision states. A field the decision does not state is `null`; nothing is estimated, and no income
is ever stated, so no income is entered.

`tests/real-cases.test.mjs` checks every quote word for word against the saved decision, checks that the
warning addressing each cause is on the app's result screen in English and Hindi and says what it must say,
replays the student's answers through `eligibleSchemes` in `rules.js`, and checks the numbers on this page
against `cases.json`.

## The cases

| Case | Forum, date | Students | Student | What stopped the money | Result |
|---|---|---|---|---|---|
| [Jeet Ram institute](https://indiankanoon.org/doc/23658662/) | Allahabad HC, 12 Feb 2020 | 232 of 449 | SC, engineering, UP | certificate, income amount, roll number or **account holder name not matched** | no relief; sent to an appeal none of them had filed |
| [Divya Singh](https://indiankanoon.org/doc/16828818/) | Allahabad HC, 29 Aug 2022 | 1 | MBA, UP, 2015-16 | income certificate shared with her brother, flagged as a **different father's name** | rejection quashed, 7 years later |
| [Abhishek Kumar Mishra](https://indiankanoon.org/doc/94403196/) | Allahabad HC (DB), 20 Feb 2023 | 1 | General, LL.M. 2nd year, UP, 2021-22 | "Blocked due to the result not filed by the student, and **not forwarded by the Institution**" | to be paid |
| [Malkit Kaur](https://indiankanoon.org/doc/63251370/) | Punjab and Haryana HC, 16 Jul 2024 | 1 | SC, LLB, Punjab, 2018 | applied **on paper, not on the portal** (the portal refused anyone over 40) | to be considered, 6 years later |
| [Vaishali Ravi](https://indiankanoon.org/doc/125008292/) | Allahabad HC, 20 Sep 2024 | 1 | SC, BAMS 4th year, UP, 2020-21 | **institution did not forward** her application | rejection quashed |
| [Jasveer Kaur and others](https://indiankanoon.org/doc/44491279/) | Himachal Pradesh HC (DB), 10 May 2023 | 27 of 1342 | OBC, SC, ST, Himachal | documents not online before the portal closed; then **bank account details mismatch** on PFMS | pending for 21 |
| [Amit Yadav](https://indiankanoon.org/doc/50156077/) | Allahabad HC (DB), 12 Apr 2023 | 1 | OBC, B.Tech, UP, 2018-19 | "amount exceed limits set on account by Bank for credit": Rs 50,000 of Rs 54,400 bounced | State appeal dismissed |
| [Sahil Arsh](https://indiankanoon.org/doc/20095049/) | Delhi HC, 7 Jul 2026 | 1 | NSP scheme, 2nd and 3rd year | payments did not come; by the hearing the **online window had closed** | 2024-25 paid during the case |
| [Raju Kumar](https://indiankanoon.org/doc/77200768/) | Central Information Commission, 16 Jul 2026 | 1 | OBC, NIT Nagaland | **institute verified 62 students for 21 slots**; he was outside the 21 | paid before the hearing |
| [Sawan Kumar](https://indiankanoon.org/doc/186382463/) | Punjab and Haryana HC, 16 Apr 2024 | 1 | SC, M.Com, Haryana | not stated; the university **withheld his result for two years** because the scholarship had not come, and he lost a job selection | to be considered for the post |
| [Ashant Dudhe](https://indiankanoon.org/doc/197120480/) | Central Information Commission, 4 Aug 2026 | 1 | engineering, Maharashtra, 2022-23 | not stated; applied Nov 2022, first instalment Aug 2024 | paid before the hearing |

## The numbers

- 11 decisions covering 268 students in 6 States (one decision does not name the State): 9 High Court orders,
  2 Information Commission orders.
- The decision names what stopped the money in 9 of 11: bank or DBT: 2, name or documents: 2,
  institute verification: 3, portal or deadline: 2, not stated: 2.
- Where the decision gives both the academic year and the decision, the wait was 2 to 7 years (2, 2, 4, 4, 5, 6, 7).
- 5 decisions ordered the State to pay or reconsider, 3 students were paid while the case was running, and for
  2 groups (the 232 UP students and 21 of the Himachal students) no money had come by the decision.
- No decision found a student ineligible. Each was stopped by a step around the application, not by the rules of
  the scheme.

## What the app would have said

The result screen shows "3 checks before you submit" (Aadhaar-seeded bank account, same name everywhere,
institute verification) on every result, plus a last date on every NSP scheme card. The test checks, for each
case, that the warning for its cause is rendered and says the right thing:

- **Bank or DBT.** Amit Yadav lost Rs 50,000 to a credit limit on his account; the app says "no credit limit on
  the account". For the Himachal students it says "PFMS rejects wrong bank details".
- **Name or documents.** The app says to keep the name, father's name and roll number exactly as on the mark
  sheet, and to fix it before submitting.
- **Institute verification.** The app says the institute must verify by the institute date and to follow up
  with them before it; on NSP cards it shows that date.
- **Portal or deadline.** For Malkit Kaur the app gives Punjab PMS-SC on the National Scholarship Portal with the
  last date (15 Nov 2026) and the institute date (30 Nov 2026).

The answers the decisions allow were replayed in 6 cases: the test checks the schemes and the portal the app
gives. Where the app and the decision differ, `cases.json` says so; there are 10 divergences. The main ones:

- **No scheme for a General category student in UP** (Abhishek Kumar Mishra). The app reads the NSP lists and
  the welfare categories, not UP's state scheme for General students. The three checks still show.
- **State portals have no dates in the app.** UP SC goes to the state portal, "not verified", with no last date,
  no institute date and no document list, so Vaishali Ravi would get the general institute warning only.
- **Certificates.** The name check covers the mark sheet; it does not say the income certificate must carry the
  same father's name (Divya Singh) or name caste, income and domicile certificates (the 232 UP students).
- **Slots.** The app does not say that some central schemes pay a fixed number of slots per institute (Raju Kumar).
- **Things no warning prevents.** A portal that refused anyone over 40 (Malkit Kaur), and a bank mismatch the
  department itself could not explain on Aadhaar-linked accounts (Himachal).

These gaps are written down here, not fixed: this work did not change the app.

## Limits

This shows that the steps the app warns about are the steps that stop real scholarships, and that the app names
them before the student submits. It is not field use: no student in these cases used the app. Indian Kanoon
carries the cases that reached a High Court or the Commission; most rejections are never challenged, so the
3,13,403 PMS-SC rejections of 2021-22 (PIB 1844993) cannot be broken down from here. Batches decided together
count as one decision. Sahil Arsh's petition names Aadhaar and PFMS problems, but the order makes no finding on
them, so that cause is not counted. Left out after reading in full: cases where the State's own policy excluded
the student (management quota in Telangana, non-CAP admission in Maharashtra, fee caps in UP and Tamil Nadu),
scholarship fraud prosecutions (Haryana, Assam), and cases that give no reason
(Andhra Pradesh Jnanabhumi orders).
