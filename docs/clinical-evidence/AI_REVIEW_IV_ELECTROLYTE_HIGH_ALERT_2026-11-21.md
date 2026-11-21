# Injectable magnesium and IV potassium high-alert classification safety review

**Date:** 2026-11-21
**Records:** MD-18 magnesium sulfate and MD-19 potassium chloride.
**Scope:** Targeted independent source cross-check of HIGH-ALERT flags, potassium presentation mix-ups and medication-safety education. **AI-assisted; not pharmacist or clinical approval. Both remain DRAFT and unpublished.**

## Claims and corrections

| Record | Finding | Action and boundary |
|---|---|---|
| MD-18 | `high_alert:false` and "not confirmed" conflicted with 2024 ISMP's explicit inclusion of **magnesium sulfate injection** among acute-care high-alert medicines. | Set `high_alert:true`; added classification and product/order/monitoring safeguards. ISMP list does not mandate universal double checks or give a dose; local policy remains authoritative. |
| MD-19 | The existing draft describes an already-manufactured, ready-to-use high-concentration premixed potassium infusion, while the ISMP list specifically names **potassium chloride injection concentrate**. Both present significant medication-error risks but differ in preparation. NSW CEC addresses IV potassium broadly as high-risk. | Set `high_alert:true` on IV potassium risk basis; distinguish premix from vial concentrate, warn against inadvertent direct injection/flush of concentrate and prompt pharmacy/clinician verification of presentation and infusion-device settings. Do **not** imply premixed potassium must be diluted, or use a vial-dose protocol for premix bags. |
| MD-19 | Current Hospira potassium chloride concentrate label (revised January 2026) explicitly warns of fatal direct injection; concentrate must be diluted before clinical IV use. | Include **only safety warning**: never treat concentrate as ready-to-use; preparation remains pharmacy-policy-controlled. No quantities, doses or infusion rates included. |

## Primary sources checked

- Institute for Safe Medication Practices. **2024 List of High-Alert Medications in Acute Care Settings** (entire 1-page list visually checked). https://www.ismp.org/system/files/resources/2024-01/ISMP_HighAlert_AcuteCare_List_010924_MS5760.pdf . Copyright ISMP 2024; permits only specified internal noncommercial distribution without separate permission. We **do not reproduce** its table, graphics or text within the commercial education app; classification independently paraphrased and cited.
- NSW Clinical Excellence Commission. **High-risk medicines standard: Potassium (intravenous)** (updated February 2025; checked November 2026). https://cec.health.nsw.gov.au/therapeutics-safety/high-risk/potassium . NSW-specific requirements must not be presented as global administration instructions.
- DailyMed (Hospira). **Potassium Chloride for Injection Concentrate**, revised January 2026. https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?audience=professional&setid=559a0a8c-a8fe-40a5-b196-21f9308780ab . Product-specific label; this is **different** from the previously recorded L-POTASSIUM premixed product.

## Remaining work

- Pharmacy must verify local formularies and determine high-alert safeguards and whether IV potassium products stocked in each jurisdiction have appropriate device/packaging controls. The product list is not a prescribing or procedure manual.
- Complete individual med-monograph clinical evidence audit, label version checks, compatibility and cross-jurisdiction standards.
- **Do not remove draft labels**, set `clinically_reviewed`/`pharmacist_reviewed` to true, generate orders, import/publish the medicine modules, or initiate a mobile release on these findings.
