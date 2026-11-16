"""Regenerates MEDICATION_SUMMARY.csv from the MD-*.json drafts."""
import csv, glob, json, os
H = os.path.dirname(os.path.abspath(__file__)); out = []
for f in sorted(glob.glob(os.path.join(H, "MD-*.json"))):
    d = json.load(open(f)); items = [i for s in d["sections"].values() for i in s["items"]]
    c = lambda t: sum(1 for i in items if i["support"] == t); m = d["monitoring"]
    out.append([d["med_id"], d["name"], d["category"], d["high_alert"], d["label_ref"], c("sourced"), c("partial"), c("local_protocol"), len(m), sum(1 for x in m if x["critical"]), len(d["gaps"])])
w = csv.writer(open(os.path.join(H, "MEDICATION_SUMMARY.csv"), "w", newline="")); w.writerow(["med_id", "name", "category", "high_alert", "label", "statements_sourced", "statements_partial", "statements_local", "monitoring_items", "critical_items", "gaps"]); w.writerows(out)
print(len(out), [sum(int(r[i]) for r in out) for i in (5, 6, 7, 8, 9)], "high-alert:", sum(1 for r in out if r[3]))
