# Antibiotic safety — targeted label reconciliation, batch 6

Eight exact registered US DailyMed pages opened and targeted passages inspected on 2026-11-24. Added eight section and eight checklist entries. All additions are partial-support nursing interpretations, not full prescribing, antimicrobial stewardship, international label or pharmacist review. No dose, preparation, exposure target or treatment regimen supplied. No label-version comparison, clinical approval, release or deployment.

- MD-22-piperacillin-tazobactam: methotrexate elimination; https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=methotrexate elimination
- MD-23-meropenem: Probenecid; https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=Probenecid
- MD-24-vancomycin: Concurrent anaesthetic agents; https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=Concurrent anaesthetic agents
- MD-25-ceftriaxone: 41 weeks postmenstrual age; https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=41 weeks postmenstrual age
- MD-26-cefazolin: Probenecid; https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=Probenecid
- MD-27-azithromycin: cholestatic jaundice; https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=cholestatic jaundice
- MD-28-linezolid: mortality imbalance; https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=mortality imbalance
- MD-29-gentamicin: Dehydration; https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=Dehydration

Previous CI: 1687 passed, 2 failed. Magnesium assertion now accepts both directly sourced text and traceable partial-support nursing inferences with the registered label. Bicarbonate restriction asserted by content rather than position. No validator changes. Index/history synchronized and new content checked against the existing no-dosing regexes. Eight new regression tests added; full CI verification pending.

Correction: test-generation null terms and missing audit descriptors repaired 2026-11-24; CI revalidation pending.
