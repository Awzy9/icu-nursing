# Targeted high-alert IV medication classification: labetalol, esmolol and lorazepam

**Checked:** 2026-11-21  
**Items:** MD-33 labetalol IV; MD-34 esmolol IV; MD-37 lorazepam injection.  
**Review type:** AI-assisted comparison against a named medication-safety source, not an independent human clinical/pharmacist review.

## Findings and correction

The draft entries were flagged `high_alert:false` with "not confirmed" despite matching **ISMP's January 2024 List of High-Alert Medications in Acute Care Settings**.

- **MD-33 labetalol:** IV adrenergic antagonists are listed; labetalol is explicitly named as an example.
- **MD-34 esmolol:** IV adrenergic antagonist class applies to esmolol, a short-acting IV beta blocker. It need not be individually listed by name to be within this class.
- **MD-37 lorazepam:** ISMP names **IV lorazepam** in the class of IV moderate-sedation agents. The drug's US label also covers status epilepticus; the risk classification does **not** narrow or expand its approved indications.

**Correction:** Each record now has `high_alert:true` and an explanation of the *route-specific* class match. Original label-sourced medication content, dosing guard and approvals unchanged. Drug-class flags are not a dosing protocol or an instruction to treat every formulation identically.

## Source and licensing

ISMP. *List of High-Alert Medications in Acute Care Settings*, January 2024. Official 1-page PDF, extracted text and page image checked on 2026-11-21: https://www.ismp.org/system/files/resources/2024-01/ISMP_HighAlert_AcuteCare_List_010924_MS5760.pdf .

© ISMP 2024; internal healthcare-provider noncommercial reproduction allowed only under conditions. Do not reproduce the protected table/text/graphics in the commercial app; only independently paraphrased classification facts and link are included here. No copyrighted ISMP source ID is placed in medication source arrays.

## Unresolved

Institution-specific risk controls, prescribing/administration and emergency procedures require local pharmacy and specialist review. All three records stay DRAFT, `clinically_reviewed:false`, `pharmacist_reviewed:false`. Do not remove clinical draft notices or publish these records based on this AI-assisted check.
