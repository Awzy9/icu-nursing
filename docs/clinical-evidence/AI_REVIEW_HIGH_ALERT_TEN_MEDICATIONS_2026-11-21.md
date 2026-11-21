# High-alert classification: targeted medication evidence audit (10 additional records)

**Date:** 2026-11-21. **Scope:** High-alert metadata and source trace for ten unapproved medication drafts. **No dosing/preparation guidance**, original FDA/manufacturer label content unchanged.

| Medication record | ISMP 2024 high-alert category checked | Scope caution |
|---|---|---|
| MD-04 dobutamine; MD-05 milrinone | IV inotropic agents | Intravenous form; not necessarily all routes and indications |
| MD-09 fentanyl; MD-39 hydromorphone | Opioids, all routes | The error-consequence classification alone is not a rescue protocol |
| MD-11 ketamine | General anaesthetics, inhaled and intravenous | Do not extend the precise 2024 wording automatically to every other formulation |
| MD-16 amiodarone; MD-17 adenosine | IV antiarrhythmics | IV antiarrhythmic risk is high; this review does not determine therapeutic use |
| MD-44 enoxaparin | Antithrombotics, including low molecular weight heparins | Anticoagulants are not interchangeable unit-for-unit; MD-44 has separate detailed safety review |
| MD-45 alteplase | Thrombolytics | Product-specific use (Activase versus Cathflo) stays distinct |
| MD-46 tranexamic acid | Tranexamic acid injection | Only the injectable product is named in the specific ISMP high-alert entry |

All ten previously displayed `high_alert:false`/"not confirmed" despite matching a named ISMP 2024 acute-care class. This change sets `high_alert:true` and updates the explanatory scope note **without adding new medication instructions** or changing approval. Risk categorization is a safety flag, not permission for a dose, route, patient population or clinical decision.

## Evidence and licensing

Primary source: Institute for Safe Medication Practices. **ISMP List of High-Alert Medications in Acute Care Settings**, January 2024. Official PDF, independently inspected as extracted text and page image on 2026-11-21: https://www.ismp.org/system/files/resources/2024-01/ISMP_HighAlert_AcuteCare_List_010924_MS5760.pdf .

The one-page list is **copyrighted** and grants conditional reproduction permission for healthcare organizations' internal noncommercial use only; the proposed commercial nursing app **does not copy its list or text**. We paraphrase only the factual category assignments in the source-trace report and high-alert metadata. No RED ISMP source is added to any medication's structured `sources` array; registered regulator/manufacturer drug-label references remain unchanged.

## Residual gates

- Human pharmacist/clinical review must validate patient suitability, safety instructions, regional high-alert policies, license rights, source currency, and any therapy-specific monitoring.
- All ten medication records stay `status:DRAFT`, `clinically_reviewed:false`, `pharmacist_reviewed:false`. No clinic-wide signoff, no publication, no new mobile build.
- This review does not claim that other medication high-alert flags have all been verified. Conduct the rest of the full medication register systematically.
