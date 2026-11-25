# P1 correction implementation — batch nine

24 November 2026. Nine core topics amended, 54 answer keys unchanged; nine regression cases added, original hashes verified and index/history synchronized. Targeted HTML source checks:
- 2026 Fifth Universal Definition of MI: https://www.jacc.org/doi/10.1016/j.jacc.2026.07.025 — selected ECG criteria only; full evidence/rights and formal source registration remain outstanding. Added a pending reference to the ECG draft, not a new registered source or claim of full review.
- Official GCS FAQ https://www.glasgowcomascale.org/faq/ — no composite when a component is not testable.
- RCUK ALS 2025 https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-advanced-life-support-guidelines — manual versus mechanical compression distinction.
- AARC 2024 https://pmc.ncbi.nlm.nih.gov/articles/PMC11298231/ — artificial airway position and cuff pressure; local rescue steps require clinical and device review.
- NICE CG174 https://www.nice.org.uk/guidance/cg174/chapter/Recommendations — reassessment and fluid intolerance.
- RCP https://www.rcp.ac.uk/resources/acute-care-toolkit-6-the-medical-patient-at-risk/ — concern overrides score, ICU monitoring plan is local practice.
- DailyMed norepinephrine comparator https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=759807dd-61a8-4f6f-8bf5-f6ee773c81bc — extravasation and abrupt cessation risk; not a new product-specific registration.
- SCCM PADIS https://www.sccm.org/clinical-resources/guidelines/guidelines/guidelines-for-the-prevention-and-management-of-pa — observable behaviour and vital signs limitations.

CI: isolated-live at e6f28f8 failed during Docker setup because port 54322 was already in use; no test result obtained. Main checks were still running when inspected; earlier failed tests predated the repair commit. Full validation pending. No clinical approval, rights clearance, merge or deployment.
