"""Builds the 8 DRAFT equipment-learning modules (EQ-01..EQ-08) by reusing the already-traced safety, monitoring and escalation statements of the
matching skill drafts. Device-neutral; parameter explanations are listed as needing a source because no source read explains them.
Unreviewed drafts, never imported."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); SK = os.path.join(HERE, "..", "skills")
BANNER = "DRAFT, NOT clinically reviewed. Device-neutral educational specification; never imported, published or shown to learners."
MAP = [
 (1,"monitors-alarms","Bedside monitors and alarms","SK-18-ecg-monitoring","loop",["Sensor","Display","Alarm limits","Alarm signal"],["Heart rhythm trace","Heart rate","Oxygen saturation","Alarm priority"]),
 (2,"ventilator-waveforms","Ventilator controls and waveforms","SK-07-ventilator-safety-checks","signal",["Rising part","Peak","Falling part","Baseline"],["Pressure waveform","Flow waveform","Volume","Respiratory rate","Alarm limits"]),
 (3,"arterial-pressure","Arterial pressure monitoring systems","SK-01-arterial-line-care","flow",["Catheter","Tubing and transducer","Zero reference","Display"],["Arterial pressure value","Arterial waveform","Zero and levelling"]),
 (4,"infusion-pumps","Infusion pumps","SK-22-infusion-pump-safety","flow",["Container","Pump","Occlusion sensor","Patient connection"],["Programmed rate","Volume infused","Occlusion and air alarms"]),
 (5,"defibrillators","Defibrillators","SK-19-defibrillator-safety","loop",["Pads or paddles","Rhythm display","Charge and shock controls","Safety check"],["Rhythm display","Energy setting","Charge state"]),
 (6,"crrt-systems","CRRT systems","SK-17-crrt-circuit-monitoring","loop",["Access line","Blood pump and filter","Return line","Pressure sensors"],["Access and return pressures","Blood flow","Delivered dose against prescription","Alarm state"]),
 (7,"enteral-feeding-pumps","Enteral feeding pumps","SK-10-enteral-feeding","flow",["Feed container","Pump","Tube connection","Position check"],["Programmed rate","Volume delivered","Occlusion alarm"]),
 (8,"pressure-relieving-equipment","Pressure-relieving equipment","SK-14-pressure-injury-prevention","loop",["Support surface","Pump or controller","Mode selector","Alarm"],["Mode","Air level or pressure state","Alarm state"]),
]
def pick(sk, sec, n=4):
    s = sk["sections"].get(sec)
    return [dict(text=i["text"], support=i["support"], sources=i["sources"], section=sec) for i in (s["items"] if s else [])][:n]
MFR = {"S-HAMILTON-C1": "Hamilton Medical HAMILTON-C1, operator's manual for software 2.2.x (2020); statements apply to that device and version only", "S-DRAEGER-V500-IFU": "Draeger Evita Infinity V500, instructions for use (version as held in the source register); statements apply to that device only", "N-AHS-CRRT-ALARM-2025": "Alberta Health Services CRRT alarm pathway for one machine family (PrisMax); applies to that family only"}
# Parameter explanations written ONLY where a source read says something about the parameter. Everything else stays null / needs_source.
EXPLAINED = {
  ("EQ-01", "Heart rhythm trace"): dict(explanation="Continuous 3-lead ECG monitoring allows early recognition and prompt treatment of life-threatening arrhythmias, and the monitoring must be supervised by someone skilled at interpreting and responding to changes (UKKA and Resuscitation Council UK, UK adults).", support="partial", sources=["N-UKKA-HK-2026-07", "N-RCUK-ANAPH-2021"]),
  ("EQ-01", "Oxygen saturation"): dict(explanation="Pulse oximeters can underestimate or overestimate saturation, especially when the reading is borderline; overestimation has been reported in people with dark skin, and probe placement matters (NICE CG103, citing an NHS England patient safety alert).", support="partial", sources=["N-NICE-CG103"]),
}
EXTRA_SOURCES = {
  "N-UKKA-HK-2026-07": dict(read="partial", use="UKKA hyperkalaemia guideline: continuous 3-lead ECG monitoring rationale"),
  "N-RCUK-ANAPH-2021": dict(read="partial", use="Resuscitation Council UK anaphylaxis guideline: monitoring supervised by a skilled person"),
  "N-NICE-CG103": dict(read="partial", use="NICE CG103: pulse oximeter accuracy caution"),
}
mods = []
for n, cat, title, skf, kind, parts, params in MAP:
    sk = json.load(open(os.path.join(SK, skf + ".json")))
    used = set(); items = []
    for sec in ("safety", "monitoring", "escalation"):
        got = pick(sk, sec); items += got
        for g in got: used.update(g["sources"])
    srcs = [s for s in sk["sources"] if s["id"] in used]
    d = {"equipment_id": f"EQ-{n:02d}", "number": n, "title": title, "category": cat, "status": "DRAFT", "origin": "ai_generated", "clinically_reviewed": False, "clinical_reviewers": [], "banner": BANNER,
         "device_neutral": not any(i in MFR for i in used), "manufacturer_documents": [dict(source_id=i, device=MFR[i]) for i in sorted(used) if i in MFR], "related_skill": sk["skill_id"], "evidence_status": "partial" if items else "unsupported",
         "diagram": {"kind": kind, "original_graphic": True, "parts": parts, "alt_text_needed": True},
         "parameters": [(dict(name=p, **EXPLAINED[(f"EQ-{n:02d}", p)]) if (f"EQ-{n:02d}", p) in EXPLAINED else {"name": p, "explanation": None, "support": "needs_source"}) for p in params],
         "safety_concepts": [i for i in items if i["section"] == "safety"], "monitoring_concepts": [i for i in items if i["section"] == "monitoring"], "escalation_concepts": [i for i in items if i["section"] == "escalation"],
         "sources": srcs + [dict(id=i, **EXTRA_SOURCES[i]) for e in [x for k, x in EXPLAINED.items() if k[0] == f"EQ-{n:02d}"] for i in e["sources"] if all(i != t["id"] for t in srcs)],
         "required_sources": ["Source explaining each listed monitored parameter in device-neutral terms", "The operator's manual for the specific model and software version the unit uses (identify it by name and version; do not reproduce its screens or alarm tables)", "Unit policy for this equipment"],
         "gaps": ["Parameter explanations are written only where a source read says something about the parameter; the rest stay unexplained (needs_source).", "Safety, monitoring and escalation statements are reused from the matching skill draft and carry that draft's evidence support, not clinical review.", "Any manufacturer-specific behaviour is excluded until a named model and software version, and permission to use its documentation, are available."],
         "permissions": ["Cited sources are paraphrased only; see the licensing register. No proprietary screens, alarm tables or manuals are reproduced."]}
    json.dump(d, open(os.path.join(HERE, f"EQ-{n:02d}-{cat}.json"), "w"), indent=1, ensure_ascii=False)
print(len(mods) or len(MAP), "equipment drafts")
