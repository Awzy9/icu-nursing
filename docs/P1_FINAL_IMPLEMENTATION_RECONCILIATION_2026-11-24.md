# P1 targeted implementation reconciliation — 24 November 2026

Comparison: 832aa72952ff35519fafddd39aa1a1844191f1fd...841a7d871846d711f80d16d247a4c20a244d99b3 (eleven correction batches). This reconciliation checks the actual changed-file list against the 166-entry draft index, not just the reported totals. It does not attest that each audit finding, guideline or clinical claim is closed. Four follow-up amendments in this commit are to already-changed drafts; unique count remains 92. Four additional regression tests (101 cumulative implementation cases). No change to clinical/pharmacist review or release gates.

| Type | Inventory | Changed since baseline | Not changed in implementation window | Structured gap records present |
|---|---:|---:|---:|---:|
| topics | 40 | 40 | 0 | 0 |
| questions | 11 | 11 | 0 | 0 |
| skills | 25 | 4 | 21 | 25 |
| medications | 50 | 27 | 23 | 50 |
| cases | 20 | 3 | 17 | 20 |
| equipment | 8 | 7 | 1 | 8 |
| practice | 12 | 0 | 12 | 12 |
| Total | 166 | 92 | 74 | 115 |

The 74 unchanged drafts may have been corrected before the comparison baseline; unchanged is not a failure or evidence of approval. Zero structured gap counts in topic/MCQ entries do not mean those drafts lack narrative evidence limitations. All 166 remain unreviewed. Index/history consistency checked separately. The earlier main CI check at e6f28f8 passed after the regression repairs, and learning passed at 841a7d8; full latest CI pending. An earlier isolated-live job failed binding local Docker port 54322; do not claim success for that run.

## Specific remaining findings and disposition

| Finding | Disposition |
|---|---|
| Post-ROSC oxygen, MAP and fever targets | Checked RCUK 2025 public recommendation page against current D02-T14; oxygen after reliable measurement, coma-specific fever prevention and individualised pressure targets already present. Clarified that pressure goals do not demonstrate tissue perfusion. Full evidence and licensing remain open. |
| UKKA July 2026 14.1 | Rechecked detailed and abbreviated pages on 24 Nov: 6.0 vs 6.5 mmol/L discrepancy still present. Continuous monitoring criteria (14.2) agree. Retain source conflict and prompt clinical escalation; publisher clarification pending. |
| BTS June 2026 correction | Indexed correction text identifies the omitted negation in small-bore drain noninferiority for pleurodesis. No drain-size efficacy claim added to SK-13; direct publisher fetch 403. No change to clamping and water-seal recommendations. Source rights and drain-selection review remain open. |
| Acute focal neurological findings | Added point-of-care glucose assessment in parallel with emergency stroke escalation to D07-T01. NICE and Canadian recommendation pages support screening; formal new source registration and full review pending. |
| Equipment explanations | Existing test expects 11 explained parameters; remaining unexplained parameters intentionally blocked pending appropriate sources/model-specific review. Do not substitute generic alarm instructions. |
| Other unresolved evidence | Exact product-specific label/formulation coverage, AARC suction catheter sizing discrepancy, KDIGO draft status, 2026 VAP consensus, new MI definition registration, device-specific instructions, guideline rights, independent clinical and pharmacist review. Continue targeted reconciliation; not all findings can be closed from a structural audit. |

### Sources consulted in this reconciliation
- https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/post-resuscitation-care-guidelines (public HTML, oxygenation, haemodynamics, temperature)
- https://guidelines.ukkidney.org/hyperkalaemia/11-1-ii-hyperkalaemia-in-hospital/11-1-2-ii-hyperkalaemia-in-hospital-14-1-14-2/ and https://guidelines.ukkidney.org/hyperkalaemia/6-summary-of-clinical-practice-guideline-for-hyperkalaemia/6-2-section-ii-hospital/ (public HTML, detailed and summary statements)
- https://doi.org/10.1136/thorax-2022-219371corr1 (indexed correction text, direct fetch failed)
- https://www.nice.org.uk/guidance/NG128/chapter/recommendations and https://www.strokebestpractices.ca/recommendations/acute-stroke-management/emergency-department-evaluation-and-management (targeted recommendation excerpts)

## Changed-file reconciliation by category
- topics: D06-T01, D06-T04, D06-T05, D07-T04, D09-T01, D09-T02, D01-T03, D01-T07, D01-T11, D02-T08, D02-T14, D02-T15, D03-T10, D04-T02, D06-T07, D07-T06, D01-T12, D03-T01, D04-T03, D01-T19, D02-T04, D03-T09, D07-T01, D07-T03, D09-T03, D02-T09, D02-T12, D05-T16, D08-T03, D01-T17, D02-T02, D04-T06, D04-T08, D04-T09, D05-T01, D05-T03, D01-T06, D01-T09, D03-T03, D08-T02
- questions: XQ-01, XQ-02, XQ-03, XQ-04, XQ-05, XQ-06, XQ-07, XQ-08, XQ-09, XQ-10, XQ-11
- skills: SK-13, SK-15, SK-18, SK-25
- medications: MD-04, MD-10, MD-11, MD-12, MD-13, MD-14, MD-15, MD-16, MD-17, MD-18, MD-19, MD-20, MD-21, MD-23, MD-25, MD-26, MD-27, MD-32, MD-33, MD-34, MD-36, MD-37, MD-41, MD-42, MD-43, MD-47, MD-48
- cases: SC-01, SC-14, SC-16
- equipment: EQ-01, EQ-02, EQ-03, EQ-04, EQ-05, EQ-07, EQ-08
- practice: none in this window

## Remaining entries outside the implementation comparison
- topics: none
- questions: none
- skills: SK-01, SK-02, SK-03, SK-04, SK-05, SK-06, SK-07, SK-08, SK-09, SK-10, SK-11, SK-12, SK-14, SK-16, SK-17, SK-19, SK-20, SK-21, SK-22, SK-23, SK-24
- medications: MD-01, MD-02, MD-03, MD-05, MD-06, MD-07, MD-08, MD-09, MD-22, MD-24, MD-28, MD-29, MD-30, MD-31, MD-35, MD-38, MD-39, MD-40, MD-44, MD-45, MD-46, MD-49, MD-50
- cases: SC-02, SC-03, SC-04, SC-05, SC-06, SC-07, SC-08, SC-09, SC-10, SC-11, SC-12, SC-13, SC-15, SC-17, SC-18, SC-19, SC-20
- equipment: EQ-06
- practice: PX-01, PX-02, PX-03, PX-04, PX-05, PX-06, PX-07, PX-08, PX-09, PX-10, PX-11, PX-12

Release requires independent review, source permissions and successful validation, not merely this reconciliation. Do not merge or deploy on its basis.
