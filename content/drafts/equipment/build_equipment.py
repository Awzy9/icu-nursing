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
# Short parameter explanations drawn from the sources listed below.
EXPLAINED = {
  ("EQ-01", "Heart rhythm trace"): dict(explanation="Continuous 3-lead ECG monitoring allows early recognition and prompt treatment of life-threatening arrhythmias, and the monitoring must be supervised by someone skilled at interpreting and responding to changes (UKKA and Resuscitation Council UK, UK adults).", support="partial", sources=["N-UKKA-HK-2026-07", "N-RCUK-ANAPH-2021"]),
  ("EQ-01", "Oxygen saturation"): dict(explanation="Pulse oximeters can underestimate or overestimate saturation, especially when the reading is borderline; overestimation has been reported in people with dark skin, and probe placement matters (NICE CG103, citing an NHS England patient safety alert).", support="partial", sources=["N-NICE-CG103"]),
}
EXTRA_SOURCES = {
  "N-UKKA-HK-2026-07": dict(read="partial", use="UKKA hyperkalaemia guideline: continuous 3-lead ECG monitoring rationale"),
  "N-RCUK-ANAPH-2021": dict(read="partial", use="Resuscitation Council UK anaphylaxis guideline: monitoring supervised by a skilled person"),
  "N-NICE-CG103": dict(read="partial", use="NICE CG103: pulse oximeter accuracy caution"),
}
PARAMETER_NOTES = {('EQ-01', 'Heart rate'): ('An ECG-derived heart rate estimates how often ventricular complexes are '
                           'detected. A pulse rate derived from another sensor is a separate measurement. '
                           'When they disagree, assess the patient and compare the signal sources.',
                           ['S-PHILIPS-MX-T']),
 ('EQ-01', 'Alarm priority'): ('Priority indicates the urgency assigned to an alarm by the configured '
                               'monitor. It depends on the condition and device configuration. Assess the '
                               'patient at the bedside and check the alarm message and signal quality.',
                               ['S-PHILIPS-MX-T']),
 ('EQ-02', 'Pressure waveform'): ('The trace shows airway pressure over time. Read it alongside the '
                                  'ventilator mode, flow and patient effort. Peak pressure during flow and '
                                  'plateau pressure during a suitable no-flow hold represent different '
                                  'measurements.',
                                  ['S-HAMILTON-C1-SW3', 'S-AARC-PVA']),
 ('EQ-02', 'Flow waveform'): ('The trace shows the direction and rate of gas movement. Check the display '
                              'convention. Expiratory flow still present at the next inspiration suggests '
                              'incomplete exhalation.',
                              ['S-HAMILTON-C1-SW3', 'S-AARC-PVA']),
 ('EQ-02', 'Volume'): ('The volume display represents gas delivered or exhaled, depending on the measurement '
                       'selected. Compare measured exhaled tidal volume with the expected value and consider '
                       'leaks or measurement problems.',
                       ['S-HAMILTON-C1-SW3', 'S-AARC-PVA']),
 ('EQ-02', 'Respiratory rate'): ('Check whether the value is the set frequency or measured total frequency. '
                                 'Total frequency can include patient-triggered breaths when the mode '
                                 'permits them. Compare it with the patient and waveforms.',
                                 ['S-HAMILTON-C1-SW3', 'S-AARC-PVA']),
 ('EQ-02', 'Alarm limits'): ('Alarm limits define monitored thresholds for parameters such as pressure or '
                             'respiratory frequency. Assess the patient and cause of a breach before '
                             'changing limits under the local protocol.',
                             ['S-HAMILTON-C1-SW3', 'S-AARC-PVA']),
 ('EQ-03', 'Arterial pressure value'): ('An arterial transducer provides a continuous pressure signal from '
                                        'which systolic, diastolic and mean pressures are displayed. Check '
                                        'levelling, zeroing and waveform quality if the values do not fit '
                                        'the patient.',
                                        ['S-ARTERIAL-SAUGEL']),
 ('EQ-03', 'Arterial waveform'): ('Systolic upstroke, peak and diastolic decline reflect the pressure '
                                  'signal. A damped or resonant system can distort systolic and diastolic '
                                  'readings. Assess the patient and inspect the system when the trace '
                                  'changes.',
                                  ['S-ARTERIAL-SAUGEL']),
 ('EQ-03', 'Zero and levelling'): ('Zeroing establishes the atmospheric reference. Levelling aligns the '
                                   'transducer with the intended anatomical reference and reduces '
                                   'hydrostatic error. Recheck the level after position changes under local '
                                   'policy.',
                                   ['S-ARTERIAL-SAUGEL']),
 ('EQ-04', 'Programmed rate'): ('The rate is the pump setting that governs how quickly the infusion is '
                                'delivered. Verify it against the order, drug concentration and selected '
                                'channel rather than using the displayed number alone.',
                                ['S-BD-ALARIS-121', 'S-FDA-PUMP']),
 ('EQ-04', 'Volume infused'): ('This is the cumulative volume registered by the pump for the channel or '
                               'counting interval. Check when the counter was cleared and reconcile the '
                               'value with the infusion record and IV site.',
                               ['S-BD-ALARIS-121', 'S-FDA-PUMP']),
 ('EQ-04', 'Occlusion and air alarms'): ('Occlusion alarms indicate pressure consistent with an obstruction; '
                                         'air alarms indicate detected air in the monitored tubing. Assess '
                                         'the patient and the affected infusion, then use the '
                                         'device-specific pathway before resuming.',
                                         ['S-BD-ALARIS-121', 'S-FDA-PUMP']),
 ('EQ-05', 'Rhythm display'): ('The display shows the ECG from the selected signal source. Verify the source '
                               'and signal quality, and interpret the rhythm with the patient assessment and '
                               'arrest algorithm.',
                               ['S-ZOLL-R-SERIES', 'S-ERC-ALS-2025']),
 ('EQ-05', 'Energy setting'): ('The selected energy is the intended shock setting in joules. A trained '
                               'operator selects it using the resuscitation algorithm, defibrillator '
                               'instructions and local protocol.',
                               ['S-ZOLL-R-SERIES', 'S-ERC-ALS-2025']),
 ('EQ-05', 'Charge state'): ('A charged indication means the defibrillator is ready to deliver the selected '
                             'shock. Rhythm indication, a clear safety check and an authorized operator are '
                             'still required before delivery.',
                             ['S-ZOLL-R-SERIES', 'S-ERC-ALS-2025']),
 ('EQ-06', 'Access and return pressures'): ('Access pressure reflects withdrawal into the extracorporeal '
                                            'circuit and return pressure reflects flow back to the patient. '
                                            'Interpret trends with the prescribed blood flow and assess the '
                                            'patient, catheter and tubing before acting.',
                                            ['N-AHS-CRRT-ALARM-2025', 'S-KDIGO-AKI-2012']),
 ('EQ-06', 'Blood flow'): ('This is the circuit blood-pump rate. Verify it against the prescription and '
                           'review interruptions or pressure alarms; adjustment follows the authorized '
                           'pathway.',
                           ['N-AHS-CRRT-ALARM-2025', 'S-KDIGO-AKI-2012']),
 ('EQ-06', 'Delivered dose against prescription'): ('Compare the treatment delivered over time with the '
                                                    'prescription. Downtime can lower delivered therapy even '
                                                    'when the current settings match the prescription. '
                                                    'Document interruptions and report shortfalls.',
                                                    ['N-AHS-CRRT-ALARM-2025', 'S-KDIGO-AKI-2012']),
 ('EQ-06', 'Alarm state'): ('The displayed alert identifies the detected condition and assigned priority. '
                            'Whether the pump stops depends on the alarm and model. Check the patient and '
                            'follow the specific device instructions.',
                            ['N-AHS-CRRT-ALARM-2025', 'S-KDIGO-AKI-2012']),
 ('EQ-07', 'Programmed rate'): ('This is the pump setting for the pace of enteral formula delivery. Verify '
                                'it against the nutrition order and confirm tube position by the approved '
                                'pathway before use.',
                                ['S-KANGAROO-224']),
 ('EQ-07', 'Volume delivered'): ('This is the cumulative volume the pump has registered since its relevant '
                                 'reset. Check the counter interval and document interruptions when '
                                 'comparing prescribed and delivered feed.',
                                 ['S-KANGAROO-224']),
 ('EQ-07', 'Occlusion alarm'): ('A flow or obstruction alarm can indicate a problem in the feeding set. '
                                'Assess the patient and inspect the tubing according to the specific pump '
                                'manual. Confirm that feeding can safely resume under the local pathway.',
                                ['S-KANGAROO-224']),
 ('EQ-08', 'Mode'): ('The selected mode changes how the support surface inflates or cycles its air cells. '
                     'Verify the mode against the care plan and device instructions. Continue skin checks '
                     'and repositioning.',
                     ['S-HILLROM-P290']),
 ('EQ-08', 'Air level or pressure state'): ('An inflation indication describes the support surface state. It '
                                            'does not measure pressure on the patient’s skin. Assess the '
                                            'patient’s position, skin and surface function.',
                                            ['S-HILLROM-P290']),
 ('EQ-08', 'Alarm state'): ('A support-surface alarm identifies a device or therapy problem according to its '
                            'manual. Assess the patient and surface, then follow the model-specific response '
                            'and arrange alternate support if needed.',
                            ['S-HILLROM-P290'])}
for key, (explanation, source_ids) in PARAMETER_NOTES.items():
    EXPLAINED[key] = dict(explanation=explanation, support="partial", sources=source_ids)

MFR.update({'S-BD-ALARIS-121': 'BD Alaris System v12.1 Pump Module 8100 manual; applies to this device/version only',
 'S-HAMILTON-C1-SW3': 'HAMILTON-C1 software 3.0.x operator manual; applies to this device/version only',
 'S-HILLROM-P290': 'Hillrom P290 mattress instructions 213960EN(1); applies to this model only',
 'S-KANGAROO-224': 'Kangaroo 224 feeding pump manual; applies to this model only',
 'S-PHILIPS-MX-T': 'Philips IntelliVue MX400–550 release T.0 instructions; applies to this model family only',
 'S-ZOLL-R-SERIES': 'ZOLL R Series Operator Guide; applies to this device family only'})
EXTRA_SOURCES.update({'S-ARTERIAL-SAUGEL': {'read': 'partial',
                       'use': 'How to measure blood pressure using an arterial catheter; parameter and alarm '
                              'sections'},
 'S-BD-ALARIS-121': {'read': 'partial',
                     'use': 'BD Alaris System User Manual v12.1; parameter and alarm sections'},
 'S-HAMILTON-C1-SW3': {'read': 'partial',
                       'use': 'HAMILTON-C1 operator manual software 3.0.x; parameter and alarm sections'},
 'S-HILLROM-P290': {'read': 'partial',
                    'use': 'P290 Mattress Instructions for Use 213960EN(1); parameter and alarm sections'},
 'S-KANGAROO-224': {'read': 'partial',
                    'use': 'Kangaroo 224 Feeding Pump Operating Manual; parameter and alarm sections'},
 'S-PHILIPS-MX-T': {'read': 'partial',
                    'use': 'IntelliVue MX400–550 Instructions for Use release T.0; parameter and alarm '
                           'sections'},
 'S-ZOLL-R-SERIES': {'read': 'partial', 'use': 'R Series Operator Guide; parameter and alarm sections'}})
EXTRA_SOURCES.update({
    "S-AARC-PVA": dict(read="partial", use="Ventilator assessment recommendations"),
    "S-FDA-PUMP": dict(read="partial", use="Infusion pump checks"),
    "S-ERC-ALS-2025": dict(read="partial", use="Manual defibrillation"),
    "N-AHS-CRRT-ALARM-2025": dict(read="partial", use="Device-specific CRRT alarm pathway"),
    "S-KDIGO-AKI-2012": dict(read="partial", use="Monitoring delivered renal replacement therapy"),
})

mods = []
for n, cat, title, skf, kind, parts, params in MAP:
    sk = json.load(open(os.path.join(SK, skf + ".json")))
    used = set(); items = []
    for sec in ("safety", "monitoring", "escalation"):
        got = pick(sk, sec); items += got
        for g in got: used.update(g["sources"])
    parameter_sources = list(dict.fromkeys(
        sid for name in params for sid in EXPLAINED[(f"EQ-{n:02d}", name)]["sources"]
    ))
    used.update(parameter_sources)
    srcs = [s for s in sk["sources"] if s["id"] in used]
    listed = {source["id"] for source in srcs}
    srcs += [dict(id=sid, **EXTRA_SOURCES[sid]) for sid in parameter_sources if sid not in listed]
    d = {"equipment_id": f"EQ-{n:02d}", "number": n, "title": title, "category": cat, "status": "DRAFT", "origin": "ai_generated", "clinically_reviewed": False, "clinical_reviewers": [], "banner": BANNER,
         "device_neutral": not any(i in MFR for i in used), "manufacturer_documents": [dict(source_id=i, device=MFR[i]) for i in sorted(used) if i in MFR], "related_skill": sk["skill_id"], "evidence_status": "partial" if items else "unsupported",
         "diagram": {"kind": kind, "original_graphic": True, "parts": parts, "alt_text_needed": True},
         "parameters": [(dict(name=p, **EXPLAINED[(f"EQ-{n:02d}", p)]) if (f"EQ-{n:02d}", p) in EXPLAINED else {"name": p, "explanation": None, "support": "needs_source"}) for p in params],
         "safety_concepts": [i for i in items if i["section"] == "safety"], "monitoring_concepts": [i for i in items if i["section"] == "monitoring"], "escalation_concepts": [i for i in items if i["section"] == "escalation"],
         "sources": srcs,
         "required_sources": ["The operator's manual for the model and software version used locally", "Unit policy for this equipment"],
         "gaps": ["Parameter notes explain general concepts and identify cited example models. Alarm behavior, button sequences and settings depend on the local model and policy.", "Safety, monitoring and escalation statements are reused from the matching skill draft and retain their evidence status."],
         "permissions": ["Cited sources are paraphrased only; see the licensing register. No proprietary screens, alarm tables or manuals are reproduced."]}
    json.dump(d, open(os.path.join(HERE, f"EQ-{n:02d}-{cat}.json"), "w"), indent=1, ensure_ascii=False)
print(len(mods) or len(MAP), "equipment drafts")
