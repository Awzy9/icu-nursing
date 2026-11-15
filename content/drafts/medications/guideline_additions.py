"""Phase 9: adds guideline-based nursing monitoring statements (beyond the FDA product label) to selected medication drafts after the batch scripts have written them.
Run after batch01..05.py and before build_summary.py. Each addition cites a guideline actually read; nothing here contains doses, rates or concentrations."""
import json, glob, os
HERE = os.path.dirname(os.path.abspath(__file__))
G = {
 "MD-15": dict(
  sources=[{"id": "N-UKKA-HK-2026-07", "read": "partial", "use": "UKKA acute hyperkalaemia guideline (July 2026): glucose and potassium monitoring after insulin-glucose"},
           {"id": "N-JBDS-HYPO-2020", "read": "partial", "use": "JBDS inpatient hypoglycaemia guideline (January 2020): treat as an emergency, do not omit later insulin without review"}],
  monitoring=[
   {"kind": "laboratory", "text": "After insulin is given with glucose to lower a high potassium, check blood glucose at regular intervals for at least six hours, longer in patients at high risk of late hypoglycaemia (UKKA, UK adults).", "critical": True, "support": "partial", "sources": ["N-UKKA-HK-2026-07"]},
   {"kind": "laboratory", "text": "Follow potassium results closely after treatment for a rebound once the first effect wears off (UKKA, UK adults).", "critical": True, "support": "partial", "sources": ["N-UKKA-HK-2026-07"]},
   {"kind": "escalate", "text": "Treat a low blood glucose as an emergency whatever the level of consciousness; ask the prescriber to review insulin doses instead of omitting later doses on your own (JBDS 2020, UK adults with diabetes).", "critical": True, "support": "partial", "sources": ["N-JBDS-HYPO-2020"]},
  ],
  note=" Guideline-based monitoring statements added in Phase 9 come from UK national guidelines (UKKA July 2026 and JBDS January 2020), read in part only, for adults in UK hospitals; they are marked partial and do not replace the unit's protocol."),
}
for num, add in G.items():
    f = glob.glob(os.path.join(HERE, f"{num}-*.json"))[0]
    d = json.load(open(f))
    have = {s["id"] for s in d["sources"]}
    d["sources"] += [s for s in add["sources"] if s["id"] not in have]
    texts = {m["text"] for m in d["monitoring"]}
    d["monitoring"] += [m for m in add["monitoring"] if m["text"] not in texts]
    if add["note"] not in d["evidence_type_note"]: d["evidence_type_note"] += add["note"]
    d["permissions"] = d["permissions"] + ["UKKA and JBDS guidelines: no reuse statement found in the text read; paraphrase only and verify."] if not any("UKKA" in p for p in d["permissions"]) else d["permissions"]
    json.dump(d, open(f, "w"), indent=1, ensure_ascii=False)
print("guideline additions applied:", ", ".join(G))
