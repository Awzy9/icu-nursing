import json,glob,csv,os
here=os.path.dirname(os.path.abspath(__file__))
rows=[]
for f in sorted(glob.glob(os.path.join(here,"SC-*.json"))):
    d=json.load(open(f))
    rows.append([d["scenario_id"],d["title"],d["spec_level"],d["evidence_status"],len(d.get("steps",[])),len(d.get("expected_actions",[])),";".join(s["id"] for s in d["sources"]),len(d["required_sources"])])
w=csv.writer(open(os.path.join(here,"SCENARIO_INVENTORY.csv"),"w",newline=""))
w.writerow(["id","title","spec_level","evidence_status","steps","expected_actions","sources","required_sources_outstanding"]);w.writerows(rows)
print(sum(r[2]=="decision_graph" for r in rows),"graphs")
