# Patient assessment, skin protection and handover safety — 24 November 2026

Five existing canonical drafts amended. Targeted evidence reconciliation, not independent clinical validation.

- D07-T04: International Guideline fourth edition device-related pressure injury chapter, official HTML lines 151–167 inspected. Added safe device support, inspection limitations and repositioning without compromising essential device function.
- D09-T01: AHRQ TeamSTEPPS handoff page, official HTML lines 52–78 inspected. Added receiver acknowledgement, ownership of time-sensitive work and unresolved handover escalation. No SBAR simulator added.
- D09-T02: NMC Code section 10, official HTML lines 348–362 inspected. Added event-versus-entry timing, verified observations and unresolved-risk documentation. UK jurisdiction retained; copied-forward workflow is practical nursing synthesis.
- D01-T19: RCP NEWS2 official resource and its indexed COVID-19-specific warning about the limitations of the binary oxygen component. Added device and oxygen requirement trends, and clarified the practical example to prioritize newly reduced alertness. RCUK ABCDE HTML lines 51–67 also inspected for hypercapnia and clinical breathing assessment.
- D07-T01: RCUK ABCDE official HTML inspected; primary assessment, urgent response and reassessment before completing routine examinations. No operational resuscitation algorithm introduced.

Sources:
- https://www.internationalguideline.com/drpi
- https://www.ahrq.gov/teamstepps-program/curriculum/communication/tools/handoff.html
- https://www.nmc.org.uk/standards/code/read-the-code-online/
- https://www.rcp.ac.uk/resources/national-early-warning-score-news-2/
- https://www.resus.org.uk/library/abcde-approach

Two new cite-only source IDs registered; existing RCUK source reused. FDA infusion-pump failure examples entry confirmed present and official HTML verified (https://www.fda.gov/medical-devices/infusion-pumps/examples-reported-infusion-pump-problems). Prior canonical hashes checked; index and history synchronized.

CI at prior head 2f06c01c319fb6d8f616b112ec37b0f339bb00ab failed typecheck in p1-source-reconciliation-batch-04.test.ts at five fixed-index array accesses (TS2345, string | undefined). Corrected the five equipment filenames to a readonly literal tuple, retaining all assertions. Mobile acceptance and Learning experience succeeded at that prior head; isolated Supabase live tests were in progress at inspection. Corrected head requires fresh CI verification.

Existing rights, local protocols and independent approval requirements retained. No publication or deployment.
