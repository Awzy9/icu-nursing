# High-alert recognition: neuromuscular blockers and IV sedatives

**Audit date:** 2026-11-21.  
**Records:** MD-07 midazolam, MD-08 dexmedetomidine, MD-12 rocuronium, MD-13 cisatracurium, MD-43 succinylcholine.  
**Classification correction:** All were marked `high_alert:false` with "not confirmed" notes. The independently checked **2024 ISMP acute-care high-alert list** includes (1) neuromuscular blocking agents, explicitly including rocuronium, and (2) **IV** moderate sedation agents, explicitly including midazolam and dexmedetomidine.

## Change trace
- Marked all five `high_alert:true` while preserving the population and **route** limitation for sedatives. The flag means severe potential harm from medication errors in acute care; it is not a universal clinical administration instruction.
- Added concise verification/monitoring and airway-risk alerts. Original regulator-label source IDs accompany the ISMP classification when alerts include clinical warning interpretation, rather than falsely attributing clinical findings solely to the list.
- Did not change labelled indications, doses, routes, preparation, concentrations, pharmacology or administration steps.
- No new external materials reproduced: ISMP copyright permits internal noncommercial reproduction under conditions; only its short classification facts are **independently paraphrased** here.

## Source verification
**Primary medication-safety source:** ISMP, `2024 List of High-Alert Medications in Acute Care Settings` (January 2024); one-page official PDF checked both as extracted text and page image on 2026-11-21. https://www.ismp.org/system/files/resources/2024-01/ISMP_HighAlert_AcuteCare_List_010924_MS5760.pdf . The table contains headings for neuromuscular blocking agents and moderate sedation agents (IV) and provides example drugs; it is not copied here.

**Drug-specific clinical context:** Original manufacturer/FDA label excerpts previously reviewed and registered for L-MIDAZOLAM, L-DEXMEDETOMIDINE, L-ROCURONIUM, L-CISATRACURIUM and L-SUCCINYLCHOLINE. This pass did not independently refresh each label or read new non-US regulator notices.

## Unresolved gates
- The institution's Pharmacy and Therapeutics Committee, specialist pharmacist, critical care nurse educator and relevant physician must determine exact local high-alert categories, storage, dispensing, warning systems, checks, monitoring, response and approval.
- Sedation-risk category is explicitly **IV**, not an automatic assertion about all formulations or uses.
- The short flags and safety text do **not** represent a full medication claim review. Each record remains **DRAFT**, `clinically_reviewed:false`, `pharmacist_reviewed:false`; no import/publication, mobile build or banner removal.
