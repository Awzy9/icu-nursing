"""Helpers for the Phase 8 clinical medication drafts (nursing reference, NO dosing). Statements are paraphrased from regulator labels recorded in LABEL_SOURCES.csv.
Support levels: sourced = traced to label text read in full for the cited section; partial = secondary/summary or not confirmed on a read source;
local_protocol = deliberately NOT sourced (refers the learner to the prescriber, pharmacy or protocol). No dose, concentration, rate, titration or compatibility content is ever written."""
import json, os
OUT = os.path.dirname(os.path.abspath(__file__))
def it(text, support, *sources): return {"text": text, "support": support, "sources": list(sources)}
def sec(support, *items): return {"support": support, "items": list(items)}
def mon(kind, text, critical, support, *sources): return {"kind": kind, "text": text, "critical": critical, "support": support, "sources": list(sources)}
LOCAL = lambda t: it(t, "local_protocol")
INST_PREP = sec("local_protocol", LOCAL("Institution-specific preparation: follow your pharmacy's preparation standard and the product labelling. This library gives no preparation or concentration instructions."))
INST_DOSE = sec("local_protocol", LOCAL("Institution-specific dosing: follow the prescriber's order and your institution's approved protocol. This library gives no dosing instructions."))
def write(n, slug, d):
    d = {"med_id": f"MD-{n:02d}", "number": n, "status": "DRAFT", "origin": "ai_generated", "clinically_reviewed": False, "pharmacist_reviewed": False, "clinical_reviewers": [],
         "banner": "DRAFT, NOT clinically reviewed and NOT pharmacist reviewed. A nursing reference without dosing; never shown to learners.", **d}
    d["sections"] = {**d["sections"], "institution_preparation": INST_PREP, "institution_dosing": INST_DOSE}
    json.dump(d, open(os.path.join(OUT, f"MD-{n:02d}-{slug}.json"), "w"), indent=1, ensure_ascii=False)
