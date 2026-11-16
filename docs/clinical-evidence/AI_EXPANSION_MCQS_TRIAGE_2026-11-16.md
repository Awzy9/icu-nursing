# AI-assisted question expansion review — 11 sets, four targeted safety corrections

**Date:** 2026-11-16. **Repository:** Awzy9/icu-nursing, unpublished clinical drafts.  
**Scope actually completed:** Opened all **11 expansion Markdown files** (`XQ-01` through `XQ-11`, 66 questions), examined their questions/answer key inventory and source lists for obvious evidence, age, scope and safety risks; inspected the complete stem/options/key/feedback of **four selected high-risk questions**, and corrected them. **This is not exhaustive claim-by-claim verification of the other 62 questions.** No clinician approved this work; all expansion sets stay `clinically_reviewed: false`, unpublished.

## Four clinical corrections implemented

| Draft / question | Previously stated | Safety/evidence correction | Key |
|---|---|---|---|
| **XQ-07 Q6**, CRRT heparin-associated thrombocytopenia | A platelet drop and suspicion implied automatic HIT confirmation and unilateral stopping without clear authority. | Now states the treating team considers HIT **likely**, requires immediate notification and local HIT pathway including ALL heparin exposures, flushes and locks, and separates clinical treatment from nursing assessment. KDIGO 2012 **5.3.4** specifically addresses **HIT** (1A); a platelet fall by itself is not diagnostic. | **B retained** |
| **XQ-08 Q2**, norepinephrine line occlusion with falling pressure | Correct response only said “restore infusion urgently and escalate”, without a line-safety safeguard. | Now requires immediate patient assessment and help, checking occlusion, ensuring a **patent safe route** for the prescribed infusion under local protocol, **not** force-flushing or improvising a bolus. Norepinephrine label's abrupt-discontinuation warning does not supply a complete line troubleshooting procedure. | **A retained** |
| **XQ-09 Q6**, fentanyl rigidity impeding ventilation | The original response only requested help; explanation focused on a prescribed neuromuscular blocking agent without the immediate airway action. | Now emphasizes **airway/resuscitation help, ABC assessment, ventilation support under trained emergency protocol**, and distinguishes clinician-directed paralysis/medications from the first bedside action. | **D retained** |
| **XQ-11 Q2 and Q6**, arterial line necessity and limb ischemia | Cited CDC infection-prevention guideline as though it mandated prescriber-only removal and itself specified a limb-ischemia escalation algorithm. | Q2 now uses trained local authorized team rather than physician-only wording. Q6 explicitly labels suspected limb ischemia escalation as a **clinical safety inference** requiring local vascular-access policy; CDC's guideline concerns **infection prevention**, not a vascular-ischemia algorithm. **Reference list corrected** from irrelevant DailyMed URL to CDC/BTS/ICS/KDIGO documents actually named in questions. | **B retained for Q2 and Q6** |

**Files modified:** `content/drafts/mcq-expansion/XQ-07-crrt-alarms.md`, `XQ-08-vasoactive-safety.md`, `XQ-09-sedative-opioid-safety.md`, `XQ-11-scope-escalation.md`, plus `build_mcqs.py` so future generation preserves these text changes. Indexed unpublished metadata/history synchronized on commit `19c9064`. The source date printed by the deterministic generator remains 2026-11-15; the additional AI comparison occurred 2026-11-16.

## External sources actually compared

- KDIGO 2012 AKI Guideline, recommendation 5.3.4/5.3.4.1 in Section 5: https://kdigo.org/wp-content/uploads/2016/10/KDIGO-2012-AKI-Guideline-English.pdf (indexed recommendation statements checked; **not** a full re-read of the publication).
- Fentanyl citrate injection current US label, revised 2026, §5.5: https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=bfa8018a-4cbc-434b-e09e-782872b0340a (muscle rigidity and airway-respiratory effects; exact local product label must be verified before use).
- CDC Intravascular Catheter-Related Infections, Summary Recommendations, arterial-catheter section: https://www.cdc.gov/infection-control/hcp/intravascular-catheter-related-infections/summary-recommendations.html (remove no-longer-needed catheters; **no universal clinical scope rule** or limb-ischemia protocol in this citation).
- Existing project norepinephrine label reference `L-NOREPINEPHRINE`: prior project label access is noted but its **exact label was not independently re-opened this batch**, so the occluded-line action is appropriately presented as a clinical safety inference and local-protocol dependent.

## Other 7 sets — source and quality gaps noted, not deeply verified

| Set | Evidence and follow-up |
|---|---|
| XQ-01 CAUTI | CDC/HICPAC 2009 catheter guideline; inspect current CDC updates and local catheter-removal protocol. |
| XQ-02 Peripheral IV | CDC 2011/2017 catheter source; confirm site inspection, interval, asepsis and extravasation concepts against updated device practices. |
| XQ-03 Central venous line | CDC 2011 and some explanations cite SHEA 2022 although source front matter lists only CDC; reconcile source ID attribution and newer dressings/safety evidence. |
| XQ-04 Critical-care transport | ICS 2026; validate source recommendation numbers and staffing/equipment details against full guidance and regional policies. |
| XQ-05 Chest drains | BTS 2023; check clamping, suction and water-seal product-specific protocol before simulation. |
| XQ-06 Mobilization | Hodgson 2014 expert consensus; reassess against newer ICU mobilization evidence and contraindications before treating numerical criteria as current. |
| XQ-10 Nasogastric positioning | NICE CG32 and NHS 2016 alert, UK-specific; validate tube pH and confirmation criteria against current national/local guidance. |

**Limitations:** Multiple distractors remain implausibly extreme or unbalanced; not all keys and rationals have been independently verified in this batch. Questions based on US labeling, old consensus documents or device-specific instructions require per-source and per-jurisdiction verification. None may be marked formally reviewed or published as a result of this audit.

## Progress boundaries

- **20/20 scenarios** had an initial decision/scoring inspection (see separate scenario report); **10/20 scenario files** were corrected for clinical scoring and safety.
- **11/11 expansion sets** were opened and triaged at source/question-inventory level; **4 individual expansion questions** received substantive item-level corrections in this batch (XQ-11 contains two corrected questions; hence **5 question items** updated across four sets).
- Prior **102/306** topic questions received targeted evidence review; expansion items are a separate additional subset of the **306** total. No complete full-topic clinical certification or professional signoff.
- **0** professional approvals, **0** newly published clinical cases, topics or questions; no production deployment or PR merge.
- CI must be verified on final commit; audit history does not prove build or clinical validation.
