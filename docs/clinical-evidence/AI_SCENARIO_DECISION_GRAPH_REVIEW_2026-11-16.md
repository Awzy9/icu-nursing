# AI-assisted clinical simulation safety triage — all 20 decision graphs

**Date:** 2026-11-16  
**Repository branch:** `claude/vigilant-mendel-95k63h`  
**Review depth:** All **20** existing `SC-01`…`SC-20` unpublished decision-graph files were opened and inspected for the sequence of patient observations, offered actions, score (`points`), clinical scope, existing source references and obvious unsafe partial-credit conditions. **This is a decision-and-scoring triage, NOT full claim-by-claim clinical validation of every consequence or citation.** Scenario sources and local protocols were not all read. All `clinically_reviewed` fields remain false; there is no publication authorization.

## Evidence sources independently compared for selected high-risk actions

1. Resuscitation Council UK **2021** emergency treatment of anaphylaxis, current official guidance page: IM adrenaline **early** into the anterolateral thigh for anaphylaxis with airway, breathing or circulatory problems; remove the suspected trigger, call for help and use ABCDE. https://www.resus.org.uk/library/additional-guidance/guidance-anaphylaxis/emergency-treatment-anaphylactic-reactions ; https://www.resus.org.uk/library/additional-guidance/guidance-anaphylaxis
2. Australian Red Cross Lifeblood, management of suspected transfusion reactions, **updated October 2025**: stop transfusion, assess ABC, maintain IV access without flushing the existing transfusion line, check identity and contact transfusion service. Restart of *some mild* reactions is a separate authorized assessment; severe reactions are not restarted. https://www.lifeblood.com.au/health-professionals/clinical-practice/adverse-events/management-of-suspected-reactions
3. NICE **NG217** Section 7, generalized convulsive status epilepticus lasting **5 minutes or more** requires resuscitation and immediate emergency management; check for causes including low glucose. https://www.nice.org.uk/guidance/ng217/chapter/treating-status-epilepticus-repeated-or-cluster-seizures-and-prolonged-seizures
4. AARC **2024** Patient–Ventilator Assessment recommendations: prioritize direct bedside assessment where available, assess patient/circuit and artificial-airway security. This is not a full manufacturer-specific ventilator alarm algorithm. https://pmc.ncbi.nlm.nih.gov/articles/PMC11298231/
5. Existing project sources in scenario files were consulted for attribution but **not all underlying original articles, labels or protocols were independently re-read**. The above source comparisons support selected decisions, not automatic validation of all 20 scenarios.

## Ten concrete scoring fixes and one first-response clinical wording fix

Every entry below previously scored **1** for an unsafe/deferred action. Each now scores **0** while retaining correct actions at **2** and preserving links between decision steps.

| Scenario | Previously partial-credit action | Reason to remove credit |
| --- | --- | --- |
| SC-04 — Ventilator alarm | Keep troubleshooting the machine alone while the patient is inadequately ventilated | Delays urgent alternative ventilation and team support |
| SC-06 — Accidental extubation | Leave the bedside to find a doctor | Removes immediate patient airway support |
| SC-08 — Acute seizure | Leave the bedside to find a doctor | Prolonged seizure requires emergency response while remaining with patient |
| SC-11 — Severe hyperkalemia | End monitoring once serum potassium has fallen | Risks missed hypoglycemia and rebound hyperkalemia following treatment |
| SC-13 — Cardiac arrest | Fetch the defibrillator before starting compressions | Delays CPR while awaiting equipment |
| SC-14 — Transfusion reaction | Report only that the patient seemed fine earlier, without a factual reaction timeline | Fails essential clinical reporting and investigation |
| SC-15 — CRRT circuit complication | Turn blood flow to the machine's maximum during access-pressure alarm | Unordered device/therapy alteration, not a safe alarm response |
| SC-16 — Acute hypotension | Keep rechecking pressure for minutes without calling despite worsening shock signs | Delays urgent escalation |
| SC-17 — Delirium/agitation | Leave an unsettled frightened patient unattended to avoid provoking them | Risks injury and unmet immediate care needs |
| SC-19 — Anaphylaxis | Inject adrenaline into deltoid rather than recommended anterolateral thigh | Incorrect recommended injection site for anaphylaxis |

**SC-19 extra change:** The *first* step's correct option now includes immediate activation of anaphylaxis protocol and obtaining early IM adrenaline (authorized emergency pathway), rather than only stop/ABCDE/help. No numeric dosage was introduced. This is directly supported by RCUK 2021 guidance.

## Implementation

All affected **10 unpublished scenario JSON files** were updated. Their authoritative scenario-generation Python scripts were updated in parallel (`build_scenarios.py`, `build_scenarios_a.py`, `build_scenarios_c.py`, `build_scenarios_d.py`, `build_scenarios_e.py`). The generated **staff-only** draft index/history were recalculated using the repository's `sha(JSON.stringify(scenario))` algorithm and committed, most recently `75682ca`.

**Integrity checks:** No `clinically_reviewed`, reviewer identity, evidence-status designation, scenario `DRAFT` status or learner-facing publication setting was modified. No dosages, drug selection instructions, device configuration procedures or real clinical protocols were added.

## Other 10 graphs: inspected, but not independently certified

- SC-01 septic shock: initial sepsis escalation, peripheral vasopressor observation and urgent extravasation response, but local peripheral administration protocol required.
- SC-02 cardiogenic shock: aging 2014 ESICM guidance, partly noncommercial nursing text, and incomplete evidence for device support. New 2025 ESICM guideline is **not yet propagated**.
- SC-03 acute respiratory deterioration: recognizes deterioration; numeric oxygen targets intentionally omitted and local protocol needed.
- SC-05 sudden oxygen desaturation: patient-first assessment and urgent help; probe-only delay still receives partial credit and requires design review.
- SC-07 raised intracranial pressure: source/population limitations and medication-specific context need verification.
- SC-09 postoperative bleeding: hypotension/bleeding escalation and product preparation; patient abandonment and anticoagulation considerations require closer review.
- SC-10 hypoglycemia: checking response and repeat monitoring are represented but original UK guidance/local protocol need full verification.
- SC-12 acute arrhythmia: instability recognition and help prioritized; some delay/monitor-only actions still receive partial credit and need adjudication.
- SC-18 aspiration event: inappropriate tube use and auscultation excluded; source versions and enteral-tube placement protocol need validation.
- SC-20 acute neurological deterioration: GCS documentation and escalation; head-injury-specific NICE applicability and observation intervals need specialist review.

### Priority unresolved risks

1. **Do not assume a simulator's numeric score implies graded clinical validation:** all twenty `decision_graph` specs are still AI-authored and require accountable clinical review and simulation branch testing.
2. Determine whether other partial-credit choices, especially **SC-02/03/05/07/09/10/12/13/15/18**, should receive **0**, or be reworded as genuinely safe but incomplete actions. This requires clinical educator assessment and consistent scoring policy; do not mechanically zero every imperfect response.
3. CRRT machine/alarms (SC-15) and ventilator alerts (SC-04) need exact model/version-specific manual and institutional policy; general guidelines do not establish every step.
4. Full 2025 ESICM shock-source reconciliation needed for SC-02 and SC-16; 2014 reference is superseded for general monitoring.
5. Inspect and independently review eleven `XQ-01` to `XQ-11` expansion sets (66 additional questions), including their existing generator/override scripts.
6. Verify GitHub CI on the final commit before declaring build success; metadata hashes were updated without weakening tests.

**Status summary:** `20/20` simulation decision graphs **initially inspected**, `10/20` scenario files **safety-corrected**, `0/20` **professionally approved**, `0` newly published. Separate topic MCQ targeted audits remain `102/306` thus far; scenario decisions are not counted as MCQs in the 306 figure.
