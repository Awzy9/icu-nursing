# ICU Nursing — Post-merge clinical release readiness and review queue
**Snapshot date:** 23 November 2026  
**Source:** `src/content/draft-index.json`, Git blob SHA `6d5b9e69ceb6e4c088ad051010ab0410fcfd8e11`, merged `main` commit `a8afec87b625dcd29b235aa05f673e6467a450e8`  
**Release:** NOT approved. Review planning only — no clinician, copyright or publisher attestation.

## Immediate release incident
Merged PR [#113](https://github.com/Awzy9/icu-nursing/pull/113) passed all four pre-merge workflows, but Vercel production deployment `dpl_4Nnosq8mULucwZmr9tnRyoZ9eSF4` failed at the intentional publication gate. Vercel production is configured with `CONTENT_EDITION=working` while the 206 generated working entries and 12 interactive datasets have **no eligible release approvals**. The existing production deployment remains the prior commit. See [release blocker #114](https://github.com/Awzy9/icu-nursing/issues/114) for the production procedure and acceptance criteria.

The production Vercel project's `NEXT_PUBLIC_SUPABASE_URL` points to the **icu-nursing-dev** Supabase project. A read-only query on 23 November 2026 found **0 total topics and 0 published-version topics** in that project's `public.topics`. Therefore, merely switching production to database-only mode would not preserve the present 40-topic learner experience and is not an acceptable automatic workaround. No production environment changes made.

## Inventory — unreviewed work
- **166** distinct records in the staff draft index; **zero** have `clinically_reviewed:true`.
- **128** are `partial` evidence status; **38** are `stated_in_text`. These are source/coverage metadata labels, **not** clinical-validation outcomes.
- **442** total declared gap points (sum of `gaps` across all entries, not a count of independent unsafe findings).
- **0** validator-issues arrays populated. This means the automated *schema/content* checks found no recorded issues, **not** that the medical content is clinically correct.
- **572** cited source references across the 166 entries (repeated references, not distinct source documents): **162 RED, 343 YELLOW, 55 GREEN, 12 UNVERIFIED**. Licence class is a reuse-review indicator, not proof of permission.
- **89** entries cite at least one RED source, and **11** entries cite at least one UNVERIFIED source. One practice record, `PX-12`, has zero indexed sources; decide whether its self-assessment framing needs references, then document the rationale.
- The new proposal-only clinical modules under `content/proposals/p1-11` through `p1-14` are **not included in these 166 indexed records** and must receive separate review before any import.

| Indexed content type | Entries | Not clinically reviewed | At least one RED source | At least one UNVERIFIED source |
|---|---:|---:|---:|---:|
| topics | 40 | 40 | 36 | 2 |
| cases | 20 | 20 | 18 | 0 |
| skills | 25 | 25 | 22 | 3 |
| medications | 50 | 50 | 0 | 5 |
| questions | 11 | 11 | 4 | 1 |
| equipment | 8 | 8 | 7 | 0 |
| practice | 12 | 12 | 2 | 0 |
| **Total** | **166** | **166** | **89** | **11** |

## P0 nursing-safety review queue — do not publish before signoff
The following priorities are sorted by the **number of declared gaps** in the current index, not by demonstrated clinical hazard. A qualified ICU nurse educator should also assess risk-of-harm separately. Prioritize shock, sudden deterioration, medication safety, ventilation/airway, haemorrhage and transfusion regardless of gap count.

| Order | Draft key | Type | Module | Declared gaps |
|---|---|---|---|---:|
| 1 | `SC-11` | cases | Severe hyperkalemia | 8 |
| 2 | `MD-20` | medications | Calcium gluconate | 7 |
| 3 | `SC-09` | cases | Postoperative bleeding | 7 |
| 4 | `MD-18` | medications | Magnesium sulfate | 6 |
| 5 | `SC-01` | cases | Septic shock | 6 |
| 6 | `SC-05` | cases | Sudden oxygen desaturation | 6 |
| 7 | `SC-14` | cases | Transfusion reaction | 6 |
| 8 | `SC-16` | cases | Acute hypotension | 6 |
| 9 | `SC-17` | cases | Delirium and agitation | 6 |
| 10 | `SK-13` | skills | Chest drain monitoring | 5 |
| 11 | `SK-17` | skills | CRRT circuit monitoring | 5 |
| 12 | `MD-24` | medications | Vancomycin | 5 |
| 13 | `MD-28` | medications | Linezolid | 5 |
| 14 | `MD-44` | medications | Enoxaparin | 5 |
| 15 | `SC-02` | cases | Cardiogenic shock | 5 |
| 16 | `SC-04` | cases | Ventilator alarm | 5 |
| 17 | `SC-07` | cases | Raised intracranial pressure | 5 |
| 18 | `SC-08` | cases | Acute seizure | 5 |
| 19 | `SC-10` | cases | Hypoglycemia | 5 |
| 20 | `SC-12` | cases | Acute arrhythmia | 5 |
| 21 | `SC-15` | cases | CRRT circuit complication | 5 |
| 22 | `SC-18` | cases | Aspiration event | 5 |
| 23 | `SC-19` | cases | Anaphylaxis | 5 |
| 24 | `SC-20` | cases | Acute neurological deterioration | 5 |
| 25 | `PX-02` | practice | SBAR call to raise a concern about a prescribed medicine | 5 |

## Clinical domains requiring independent reviewers
1. **Shock, sepsis, resuscitation:** ICU nurse educator + intensivist; assess scenarios `SC-01`, `SC-02`, `SC-09`, `SC-16` and topics `D02-T08`, `D02-T09`. Verify immediate patient-first actions and avoid nurse-independent prescriptions.
2. **Airway and mechanical ventilation:** ICU nurse educator + respiratory therapist/intensivist; `D01-T06`, `D01-T07`, `D01-T09`, `D01-T11`, `D01-T17`, `SK-06`, `SK-07`, `SC-04`, `SC-05`.
3. **Potassium, renal support and infusion:** ICU nurse educator + nephrology + pharmacist; `D04-T06`, `D04-T09`, `SC-11`, `SK-17`, `MD-19`, `MD-20`, `SK-22`. Reconcile the UKKA ECG-threshold discrepancy recorded in Batch 10; do not fabricate a uniform threshold.
4. **Transfusion, haemorrhage, coagulation:** transfusion medicine + haematology + nurse educator; `SC-14`, `SK-09`, `D08-T03`, `D08-T02`, `SC-09` and proposal-only GI/ACLF/trauma modules. Distinguish TACO/TRALI and cirrhosis vs TIC vs DIC.
5. **High-alert medications:** ICU pharmacist and nurse educator; the 50 medication records currently carry YELLOW source citations; verify indication, route, monitoring, local administration constraints, product labelling and commercial reuse. Never equate a YELLOW licence classification with a licence grant.
6. **Neurology/delirium and chest drainage:** neurocritical/ICU nursing + relevant speciality; `SC-07`, `SC-08`, `SC-17`, `SK-13`, `SK-23`. Ensure emergency escalations and bedside scope.
7. **Question bank and interactive labs:** educational measurement reviewer + clinical reviewer; review answer keys/distractors and **all 12** interactive clinical datasets, source images, provenance and translated variants.

## Required approval record for EACH published revision
- [ ] Source and guideline versions verified (including updated guidelines, errata and unavailable full text); original clinical claims traced to reliable primary evidence, with limitation documented.
- [ ] Qualified named human reviewer personally signs off clinical accuracy, workflow scope, scenario choices, answer/rationale and localization; not an AI-generated attestation.
- [ ] Separate rights/licence owner documents written permission or a valid commercial licence/exception for each reused source asset/content; RED/YELLOW/UNVERIFIED sources are not presumed clear.
- [ ] Independent publisher checks the exact **generated entry SHA-256** and underlying **source draft hash**, with `clinically_reviewed:true` and no unresolved issues in the canonical index.
- [ ] Interactive ECG/CRRT/infusion/transfusion/other datasets reviewed against their byte hashes, with access controls and specialist signoff.
- [ ] Isolated staging verification for website, native APIs, offline-cache withdrawal and all four GitHub workflows; independently test the *production-target build* before promotion.
- [ ] Only then adjust Vercel production content mode / approvals and deploy. Never bypass the guard, silently remove all learning content, or treat GitHub merge as clinical publication.

**No named clinicians, licences, publication permissions, reviewer identity or approval dates were invented. This is a review worklist, not a regulatory or clinical certificate.**
