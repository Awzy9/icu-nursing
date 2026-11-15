"""Regenerates references and the evidence coverage tables for the 25 skill drafts from the JSON drafts + the source registers.
   python3 build_evidence.py   (run after editing any SK-*.json or the registers)"""
import csv, glob, json, os
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.abspath(os.path.join(H, "../../.."))
reg = {r["source_id"]: r for r in csv.DictReader(open(os.path.join(R, "sources/source_register.csv")))}
new = {r["source_id"]: r for r in csv.DictReader(open(os.path.join(H, "NEW_SOURCES.csv")))}
def info(i):
    if i in reg: r = reg[i]; return dict(title=r["resource_title"], org=r["organization"], url=r["official_url"], version=r["publication_date_or_version"], lic=r["licence_class"], perm=r["permission_required"], acc=r["verification_date"])
    r = new[i]; return dict(title=r["resource_title"], org=r["organization"], url=r["official_url"], version=r["publication_date_or_version"], lic=r["licence_class"], perm=r["permission_required"], acc="2026-11-15")
mat, summ = [], []
for f in sorted(glob.glob(os.path.join(H, "SK-*.json"))):
    d = json.load(open(f))
    d["references"] = []
    for s in d["sources"]:
        i = info(s["id"]); d["references"].append({"id": s["id"], "title": i["title"], "publisher": i["org"], "version": i["version"], "url": i["url"], "accessed": i["acc"], "read": s["read"], "licence_class": i["lic"], "permission_required": i["perm"]})
    json.dump(d, open(f, "w"), indent=1, ensure_ascii=False)
    for k, s in d["sections"].items():
        mat.append([d["skill_id"], d["title"], k, s["support"], len(s["items"]), sum(1 for x in s["items"] if x["support"] == "sourced"), sum(1 for x in s["items"] if x["support"] == "partial"), sum(1 for x in s["items"] if x["support"] == "local_protocol"), ";".join(sorted({x2 for x in s["items"] for x2 in x["sources"]}))])
    ck = d["checklist"]; cnt = lambda t: sum(1 for x in ck if x["support"] == t)
    rd = lambda t: sum(1 for s in d["sources"] if s["read"] == t)
    summ.append([d["skill_id"], d["title"], d["category"], d["evidence_status"], d["license_status"], len(ck), cnt("sourced"), cnt("partial"), cnt("local_protocol"), sum(1 for x in ck if x["critical"]), len(d["sources"]), rd("full"), rd("partial"), rd("not_read"), len(d["gaps"]), len(d["permissions"]), ";".join(d["topic_drafts"])])
w = csv.writer(open(os.path.join(H, "EVIDENCE_MATRIX.csv"), "w", newline="")); w.writerow(["skill_id", "title", "section", "section_support", "items", "sourced", "partial", "local_protocol", "source_ids"]); w.writerows(mat)
w = csv.writer(open(os.path.join(H, "SKILL_SUMMARY.csv"), "w", newline="")); w.writerow(["skill_id", "title", "category", "evidence_status", "license_status", "checklist_items", "items_sourced", "items_partial", "items_local_protocol", "critical_items", "sources", "sources_read_full", "sources_read_partial", "sources_not_read", "gaps", "permission_notes", "topic_drafts"]); w.writerows(summ)
print(len(summ), "skills;", len(mat), "section rows")
