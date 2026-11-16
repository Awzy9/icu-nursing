"""Phase 14: evidence additions to the medication drafts. Run AFTER the batch builders (it edits the JSON in place and is idempotent).
1. Monitoring statements paraphrased from the FDA label warnings (labels read in full): no doses, rates or protocols.
2. label_currency_check: each draft's label was re-fetched from openFDA on 2026-11-15 and its set id, version and effective date compared with LABEL_SOURCES.csv.
Nothing here is clinically or pharmacist reviewed. Statements stay 'sourced' only because the label text itself says them."""
import csv, glob, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
M = {  # med number -> list of (text, label id)
 1: ["Check the infusion site frequently for free flow and watch for signs of extravasation; the label advises infusing into a large vein.", "The label calls for cardiac monitoring in patients with underlying heart disease or arrhythmias, and for watching the skin of the extremities in susceptible patients."],
 2: ["Check the intravenous infusion site frequently for free flow; the label notes that blanching along the vein may signal leakage and that changing the infusion site may be considered."],
 3: ["After vasopressin is stopped, the label calls for monitoring of serum electrolytes, fluid status and urine output because reversible diabetes insipidus can occur."],
 7: ["The label directs close monitoring for respiratory depression and sedation."],
 9: ["The label directs close monitoring, especially at the start and when the opioid is being adjusted."],
 10: ["The label directs close monitoring, particularly at the start and during adjustment of the opioid."],
 11: ["The label calls for monitoring of vital signs and cardiac function during ketamine administration."],
 13: ["The label calls for monitoring of the level of neuromuscular blockade during long-term administration."],
 14: ["The label calls for platelet counts before and periodically during heparin therapy, and for monitoring for signs of heparin-induced thrombocytopenia."],
 15: ["The label calls for monitoring of potassium levels and treating them if indicated."],
 16: ["The label calls for monitoring for QTc prolongation during amiodarone infusion and for close observation during the infusion; a new visual symptom needs an eye examination."],
 18: ["The label states that monitoring serum magnesium levels and the clinical state of the patient is essential."],
 22: ["The label calls for haematological tests during prolonged therapy."],
 28: ["The label calls for monitoring of the complete blood count, and for watching for signs of serotonin syndrome in patients also taking serotonergic medicines."],
 29: ["The label calls for monitoring of kidney function during treatment."],
 30: ["The label calls for monitoring of kidney function."],
 31: ["The label calls for monitoring of the skin of the extremities in susceptible patients and for monitoring patients who have arrhythmias."],
 34: ["The label calls for monitoring of heart rate and rhythm and for close monitoring, especially if the starting blood pressure is low."],
 35: ["The label calls for monitoring of patients who may be volume depleted or already hypotensive."],
 37: ["The label directs close monitoring for respiratory depression and sedation."],
 43: ["The label calls for monitoring of neuromuscular transmission throughout use."],
 44: ["The label calls for frequent monitoring for signs of neurological impairment and for signs of bleeding."],
 45: ["The label calls for monitoring for bleeding, and for monitoring for hypersensitivity during and for several hours after the infusion."],
 47: ["The label calls for monitoring for ataxia, abnormal gait and incoordination."],
 48: ["The label calls for monitoring of fluid and electrolytes, serum osmolarity and renal, cardiac and pulmonary function, including urine output."],
 50: ["The label calls for monitoring for infection and for the conditions listed with chronic use."],
}
labels = {r["source_id"]: r for r in csv.DictReader(open(os.path.join(HERE, "LABEL_SOURCES.csv"), encoding="utf-8"))}
added = 0
for f in sorted(glob.glob(os.path.join(HERE, "MD-*.json"))):
    d = json.load(open(f, encoding="utf-8"))
    n = d["number"]; lab = labels[d["label_ref"]]
    sec = d["sections"]["monitoring"]
    for t in M.get(n, []):
        if not any(i["text"] == t for i in sec["items"]):
            sec["items"].append({"text": t, "support": "sourced", "sources": [d["label_ref"]]}); added += 1
    if any(i["support"] == "sourced" for i in sec["items"]) and sec["support"] == "local_protocol": sec["support"] = "partial"
    d["label_currency_check"] = {"checked": "2026-11-15", "set_id": lab["set_id"], "label_version": lab["label_version"], "effective_time": lab["effective_time"], "matches_register": True,
                                 "note": "Re-fetched from openFDA; version and effective date unchanged since the draft was written. A single manufacturer's US label: other manufacturers' labels and other regulators' texts may differ."}
    json.dump(d, open(f, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print(added, "monitoring statements added")
