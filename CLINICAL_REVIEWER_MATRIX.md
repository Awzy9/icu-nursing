# Clinical Reviewer Matrix

No reviewer names are assigned or invented. Every role below is **vacant until the product owner appoints a named, credentialed person** (name, registration/licence number, specialty, conflict-of-interest declaration). Content cannot reach `CLINICAL_REVIEW → APPROVED` without the roles required in this matrix (workflow in `CLINICAL_GOVERNANCE.md`).

## Roles

| Code | Role | Primary accountability | Minimum qualification (proposed) |
|---|---|---|---|
| NE | Senior ICU nurse educator — **curriculum lead** | Curriculum structure, learning objectives, nursing-scope boundaries, final educational sign-off on every topic | Registered nurse, critical-care education experience (proposed ≥5 yrs ICU + education role), master's preferred |
| BN | Experienced ICU nurse — **bedside competency reviewer** | "Would this work at the bedside?" Practicality, realistic assessments/escalation, skill checklists | RN, ≥3–5 yrs current adult ICU bedside practice |
| PH | Clinical pharmacist — **medication reviewer** | All medication content; blocks any dose/concentration without sign-off | Clinical/critical-care pharmacist |
| RT | Respiratory therapist — **respiratory & ventilator reviewer** | Ventilation, airway, oxygen, weaning content; RT-vs-nurse role boundaries | Registered RT with ICU experience |
| CCP | Critical care physician — **clinical accuracy reviewer** | Pathophysiology, thresholds, guideline alignment, prescriber-vs-nurse boundaries | Intensivist/critical-care specialist |
| NEPH | Nephrology specialist — **renal & CRRT reviewer** | AKI, electrolytes (with CCP), CRRT | Nephrologist (CRRT nurse specialist may co-review) |
| NEURO | Neurology specialist — **neurological reviewer** | Neuro assessment, ICP, seizures, delirium/neuro content | Neurologist/neurointensivist |
| IPC | Infection prevention specialist — **infection control reviewer** | Precautions, device-infection bundles, sepsis infection aspects | Infection-prevention practitioner/ID physician |

Others as needed (not in your required list, proposed): transfusion medicine specialist (D8), dietitian (nutrition), resuscitation lead (arrest/emergencies), Arabic-language clinical reviewer (before localisation).

## Responsibility matrix

R = required reviewer · C = consulted when the topic touches their area · A = final approver of that topic type · — = not involved

| Domain / content | NE | BN | PH | RT | CCP | NEPH | NEURO | IPC |
|---|---|---|---|---|---|---|---|---|
| D1 Respiratory & airway | **A** | R | C | R | R | — | — | C |
| D2 Cardiovascular & hemodynamic | **A** | R | C | C | R | — | — | — |
| D3 Neurocritical care | **A** | R | C | — | R | — | R | — |
| D4 Renal & metabolic | **A** | R | C | — | R | R | — | — |
| D5 Pharmacology | **A** | R | R (blocking) | C | R | C | C | C |
| D6 Infection & sepsis | **A** | R | C | — | R | — | — | R |
| D7 General ICU nursing | **A** | R | C | C | — | — | — | C |
| D8 Hematology & transfusion | **A** | R | C | — | R | — | — | — |
| D9 Professional practice | **A** | R | — | — | C | — | — | — |
| D10 Emergencies | **A** | R | C | C | R | C | C | — |
| Clinical skills & checklists | **A** | R | C | C (airway/vent) | C | C (CRRT) | — | C (devices) |
| Medication library entries | A | R | **R (blocking)** | — | C | — | — | — |
| MCQs | R | R | C (drug Qs) | C | C | — | — | — |
| Simulation scenarios | **A** | R | C | C | R | C | C | C |

"Blocking": the item cannot be approved without that role's recorded sign-off.

## Which topics require multidisciplinary review before publication

Rule: **multidisciplinary review (≥3 roles including BN) is mandatory** when a topic involves (a) medications or infusions, (b) resuscitation or emergencies, (c) life-support devices or invasive lines, or (d) guideline thresholds that trigger escalation. The `multidisciplinary_review_required` and `required_reviewer_roles` columns in `curriculum/master_curriculum.csv` apply this rule per topic.

Of the 40 first-release topics, **26 require multidisciplinary review**, 14 need NE + one specialty reviewer:

| Required (26) | Roles |
|---|---|
| Oxygen delivery; invasive MV and modes; ventilator parameters; ventilator alarms; suctioning; ETT/cuff pressure | NE, BN, RT, CCP |
| Weaning/SBT/extubation prep | NE, BN, RT, CCP |
| Shock recognition; septic shock care; arterial line; cardiac arrest/post-arrest; defibrillation safety | NE, BN, CCP (+PH for septic shock) |
| Vasopressor/inotrope monitoring; vasopressors; sedatives | NE, BN, PH, CCP |
| Sedation monitoring (RASS) | NE, BN, PH, CCP |
| Delirium screening and prevention | NE, BN, PH, CCP, NEURO |
| ICP/CPP | NE, BN, NEURO, CCP |
| AKI; CRRT fundamentals | NE, BN, NEPH, CCP |
| Potassium disorders | NE, BN, PH, CCP, NEPH |
| High-alert medication and infusion pump safety | NE, BN, PH |
| Sepsis recognition | NE, BN, CCP, IPC |
| CLABSI prevention; VAE prevention | NE, BN, IPC (+RT for VAE) |
| Transfusion and reactions | NE, BN, CCP (+ transfusion medicine) |

Other P1 topics (14) — NE + domain reviewer: e.g., GCS, ECG, ABG, urine output, coagulation tests, head-to-toe, pain assessment (+PH), pressure injury, enteral feeding (+dietitian), SBAR, documentation, scope of practice, standard precautions (IPC), respiratory deterioration (+RT).

## Reviewer workflow rules

1. Reviewers are assigned by the NE (curriculum lead); a reviewer may not review content they authored.
2. Each review records: roles/credentials, decision (approve / changes requested / reject), comments, date, version reviewed, conflict-of-interest statement.
3. Disagreements between nurse and physician/pharmacist reviewers are resolved by evidence (source cited in the review), escalated to the NE and, for medication, the PH has final say on whether a dose appears.
4. Re-review triggers: new guideline edition (e.g., KDIGO final), device/policy change, an error report, or 12 months (6 months for D5, D10, resuscitation).
5. Reviewer capacity is the release bottleneck: plan about **40 topics × 2–4 reviewers** and set weekly review quotas before committing a launch date.
6. Names, credentials and the date of each review are shown to learners only with the reviewer's consent; otherwise the role is shown.

## Open decisions (product owner)

- Who fills each role (paid, volunteer, institutional partner)? Reviewer fees and indemnity cover.
- Jurisdiction(s) whose scope-of-practice rules the content follows first (e.g., Saudi vs international).
- Whether physician review may be by a single intensivist across D1–D4, D6, D8, D10.

## Implementation mapping (Phase 1)

- Role codes `NE, BN, PH, RT, CCP, NEPH, NEURO, IPC, OTHER` are the values of `reviewer_specialties.specialty` and `topics.required_review_roles`.
- A user needs the `clinical_reviewer` platform role **and** the matching specialty (granted by an administrator at `/admin/users`) to be assigned to a review.
- A topic's required roles are copied into each submitted version; approval requires an approving review for every listed role, by distinct reviewers (setting `require_distinct_reviewers`, default on). AI-assisted/generated content additionally needs ≥ 2 distinct approving humans.
- The curriculum CSV's `required_reviewer_roles` column is the proposal for each topic; a human curriculum lead sets the final roles in the CMS.
- Names, credentials and conflict-of-interest declarations are **not** stored by the software yet (Phase 2): keep them in a controlled register until then.
