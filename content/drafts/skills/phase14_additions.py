"""Phase 14: evidence additions to three skill drafts, from sources read this phase (Open RN, CC BY, whole sections read in Chromium; CDC hand hygiene page, landing page only).
Run AFTER the skill builders (idempotent, edits JSON in place). Nothing here is reviewed; wording is paraphrase."""
import glob, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
def load(n): f = glob.glob(os.path.join(HERE, f"SK-{n:02d}-*.json"))[0]; return f, json.load(open(f, encoding="utf-8"))
def add_src(d, sid, read, use):
    if not any(s["id"] == sid for s in d["sources"]): d["sources"].append({"id": sid, "read": read, "use": use})
def add_item(d, sec, text, support, sources):
    s = d["sections"][sec]
    if not any(i["text"] == text for i in s["items"]): s["items"].append({"text": text, "support": support, "sources": sources})
    if s["support"] == "local_protocol" and support != "local_protocol": s["support"] = "partial"
f, d = load(24)
add_src(d, "S-OPENRN-HA-CVA", "full", "Open RN Health Alterations 9.9: neurological assessment and increased-ICP manifestations (stroke text; entry-level)")
add_item(d, "assessment", "A focused neurological assessment includes the level of consciousness, the Glasgow Coma Scale and a pupil evaluation, as well as speech and cognition.", "sourced", ["S-OPENRN-HA-CVA"])
add_item(d, "monitoring", "A decreased level of consciousness is the earliest sign of raised intracranial pressure; restlessness, headache, vomiting, high blood pressure and a slow heart rate can follow, so a downward change from the last assessment is significant.", "sourced", ["S-OPENRN-HA-CVA"])
add_item(d, "escalation", "Report a fall in the level of consciousness, new restlessness or confusion, or pupil change urgently with the previous assessment for comparison; sedatives can mask neurological symptoms, so discuss them with the team before giving them.", "partial", ["S-OPENRN-HA-CVA"])
d["gaps"].append("Phase 14: the added statements come from an entry-level stroke text; ICP and cerebral perfusion values and monitoring-device care remain unsourced.")
json.dump(d, open(f, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
f, d = load(8)
add_src(d, "S-OPENRN-FUND-CH8", "full", "Open RN Nursing Fundamentals 8.3: respiratory monitoring and reassessment")
add_item(d, "monitoring", "Monitor oxygen saturation continuously in sedated patients, and note respiratory rate, effort, lung sounds, secretions and whether suctioning is needed; after any intervention reassess heart rate, respiratory rate, saturation, lung sounds and the patient's own rating of breathlessness.", "sourced", ["S-OPENRN-FUND-CH8"])
add_item(d, "assessment", "Staying with a patient whose oxygenation has fallen promotes safety and reduces fear.", "sourced", ["S-OPENRN-FUND-CH8"])
json.dump(d, open(f, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
f, d = load(21)
add_src(d, "S-CDC-HANDHYG-2024", "partial", "CDC hand hygiene page (landing page only): definition and alcohol-based hand rub fire safety")
add_item(d, "safety", "Hand hygiene means cleaning the hands with soap and water, with an alcohol-based hand rub, or (for surgery) with surgical hand antisepsis.", "partial", ["S-CDC-HANDHYG-2024"])
add_item(d, "safety", "Alcohol-based hand rub contains ethyl alcohol, is a flammable liquid and must be stored and dispensed in line with local fire-safety rules.", "partial", ["S-CDC-HANDHYG-2024"])
d["gaps"].append("Phase 14: when to use soap and water or hand rub, glove use and technique steps are not written because the CDC detail pages and the WHO guideline were not read.")
json.dump(d, open(f, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("skill additions applied")
