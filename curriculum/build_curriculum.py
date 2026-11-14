#!/usr/bin/env python3
"""Generates curriculum/master_curriculum.csv from the structured data below.
Run: python3 curriculum/build_curriculum.py
Objectives are authored only for the 40 P1 release topics; others are 'TBA at topic development'.
Source IDs refer to sources/source_register.csv.
"""
import csv, os

REVIEWER = {
 1:"Critical care nurse educator + respiratory therapist", 2:"Critical care nurse educator + cardiology/intensivist",
 3:"Neuro-ICU nurse educator + neurointensivist", 4:"Critical care nurse educator + nephrologist/CRRT specialist",
 5:"Critical care pharmacist + nurse educator", 6:"Infection prevention specialist + intensivist",
 7:"Critical care nurse educator", 8:"Transfusion medicine specialist + nurse educator",
 9:"Nurse educator + patient safety/quality lead", 10:"Critical care nurse educator + intensivist/resuscitation lead"}
SRC = {1:"S-AARC-PVA;S-AARC-SBT;S-AARC-SUCT;S-AARC-O2;S-AARC-TRACH;S-OPENRN-ADV",
 2:"S-AHA-2025;S-OPENRN-ADV;S-SSC (to register)", 3:"S-SCCM-ABCDEF;S-OPENRN-HA;(neuro guideline to register)",
 4:"S-KDIGO-AKI;S-NICE-AKI;S-OPENRN-HA", 5:"S-OPENRN-PHARM;S-ISMP;S-SCCM-ABCDEF;(PADIS to register)",
 6:"S-CDC-IC;S-NICE-SEPSIS;(SSC to register);S-WHO-PS", 7:"S-OPENRN-FUND;S-OPENRN-SKILLS;S-SCCM-ABCDEF;S-ASPEN;S-CDC-IC",
 8:"S-OPENRN-HA;(transfusion guideline to register);S-ISMP", 9:"S-AHRQ-TS;S-WHO-PS;S-OPENRN-MGMT;S-AACN-CF",
 10:"S-AHA-2025;S-AARC-PVA;S-AHRQ-TS;S-ISMP"}
# (topic, level N/T/E, minutes, p1)
D = {
1:("Respiratory and Airway Management",[
 ("Respiratory anatomy and physiology","N",30,0),("Gas exchange","N",30,0),("Oxygen delivery systems and oxygen therapy","N",35,1),
 ("High-flow nasal oxygen","T",25,0),("Non-invasive ventilation","T",35,0),("Invasive mechanical ventilation fundamentals and modes","T",45,1),
 ("Ventilator parameters: PEEP, FiO2, tidal volume, plateau and driving pressure","T",45,1),("Ventilator waveforms","E",40,0),
 ("Ventilator alarms: recognition and nursing response","T",35,1),("Patient-ventilator asynchrony recognition","E",35,0),
 ("Airway suctioning","N",30,1),("Endotracheal tube care and cuff pressure","N",30,1),("Tracheostomy care","T",35,0),
 ("Humidification","T",20,0),("Prone positioning nursing care","E",35,0),("ARDS nursing care","E",40,0),
 ("Weaning, SBT monitoring and extubation preparation","T",40,1),("Post-extubation monitoring","T",25,0),
 ("Recognition of respiratory deterioration","N",30,1)]),
2:("Cardiovascular and Hemodynamic Care",[
 ("Cardiovascular anatomy and physiology","N",35,0),("ECG fundamentals and rhythm recognition","N",50,1),("Heart rate and rhythm monitoring","N",25,0),
 ("Arterial blood pressure monitoring and arterial line maintenance","T",40,1),("Arterial waveform interpretation","E",35,0),
 ("MAP, CVP fundamentals and limitations","T",30,0),("Hemodynamic monitoring overview","E",40,0),("Shock recognition","N",35,1),
 ("Septic shock nursing care","T",40,1),("Cardiogenic shock nursing care","E",40,0),("Hypovolemic and obstructive shock","T",30,0),
 ("Vasopressor and inotrope monitoring","T",40,1),("Fluid resuscitation monitoring","T",30,0),
 ("Cardiac arrest and post-cardiac-arrest care","T",45,1),("Defibrillation safety","N",25,1),("Temporary pacing","E",35,0),
 ("Recognition of myocardial ischemia","T",30,0)]),
3:("Neurocritical Care",[
 ("Neurological assessment and Glasgow Coma Scale","N",40,1),("Pupillary assessment and level of consciousness","N",25,0),
 ("ICP monitoring and cerebral perfusion pressure","E",40,1),("Intracranial hypertension","E",35,0),("Traumatic brain injury","E",40,0),
 ("Stroke","T",40,0),("Intracranial hemorrhage","E",35,0),("Seizures and status epilepticus","T",35,0),
 ("Sedation monitoring (RASS)","N",30,1),("Delirium screening and prevention","N",35,1),("Neurological deterioration","T",30,0),
 ("Post-craniotomy nursing care","E",30,0),("Brain death concepts and professional responsibilities","E",30,0)]),
4:("Renal and Metabolic Care",[
 ("Renal physiology","N",30,0),("Acute kidney injury","T",40,1),("Urine output monitoring and fluid balance","N",30,1),
 ("Electrolyte monitoring overview","N",25,0),("Sodium disorders","T",35,0),("Potassium disorders","T",35,1),("Calcium and magnesium disorders","T",30,0),
 ("Acid-base disturbances and ABG interpretation","T",50,1),("CRRT fundamentals and equipment","E",45,1),("CRRT monitoring and alarms","E",40,0),
 ("Recognition of CRRT circuit and dialysis complications","E",35,0),("Glucose monitoring","N",25,0),("DKA and HHS nursing care","T",40,0)]),
5:("Critical Care Pharmacology",[
 ("Sedatives","T",35,1),("Analgesics (opioids and adjuncts)","T",35,0),("Vasopressors","T",35,1),("Inotropes","E",30,0),("Neuromuscular blockers","E",30,0),
 ("Antimicrobials: ICU nursing considerations","T",40,0),("Anticoagulants","T",35,0),("Antiplatelets","T",25,0),("Antiarrhythmics","E",35,0),
 ("Antihypertensives","T",25,0),("Insulin","T",30,0),("Electrolyte replacement","T",30,0),("Anticonvulsants","T",25,0),("Reversal agents","T",25,0),("Emergency medications","T",30,0),
 ("High-alert medication and infusion pump safety","N",35,1)]),
6:("Infection and Sepsis",[
 ("Sepsis and septic shock recognition","N",40,1),("Sepsis-related organ dysfunction and lactate monitoring","T",30,0),("Cultures and antibiotic administration safety","T",30,0),
 ("Standard and transmission-based precautions, isolation, PPE","N",35,1),("CLABSI prevention","N",30,1),("CAUTI prevention","N",25,0),
 ("Ventilator-associated event prevention","T",30,1),("Antimicrobial stewardship","E",25,0),("Multidrug-resistant organisms","T",30,0)]),
7:("General ICU Nursing",[
 ("Head-to-toe assessment and documentation","N",45,1),("Vital-sign, temperature and fluid input/output monitoring","N",30,0),("Pain assessment (CPOT, BPS)","N",30,1),
 ("Skin assessment and pressure injury prevention","N",35,1),("Patient positioning, hygiene and mobilization","N",35,0),("Enteral feeding and aspiration prevention","N",35,1),
 ("Nutrition screening and parenteral nutrition basics","T",30,0),("Bowel and catheter care","N",25,0),("Drain management","T",30,0),
 ("Patient transport","T",30,0),("Sleep promotion","N",20,0),("Family communication and engagement","N",25,0)]),
8:("Hematology and Transfusion",[
 ("CBC and hemoglobin/platelet monitoring","N",30,0),("Coagulation tests: INR, aPTT, fibrinogen","T",35,1),("Blood product administration and transfusion reactions","N",40,1),
 ("Massive transfusion concepts","E",30,0),("Bleeding assessment","T",30,0),("Anticoagulant safety and DVT prevention","T",30,0),("TEG and ROTEM fundamentals","E",30,0)]),
9:("Professional Nursing Practice",[
 ("SBAR, clinical handover and escalation of deterioration","N",40,1),("Nursing documentation","N",30,1),("Nursing scope of practice","N",30,1),
 ("Clinical prioritization, time management and shift organization","N",35,0),("Ethical practice, consent and patient rights","T",30,0),
 ("Patient safety, medication error and incident reporting","N",30,0),("Communication with families and multidisciplinary rounds","T",25,0),("Critical thinking and clinical judgment","N",35,0)]),
10:("Critical Care Emergencies",[
 ("Respiratory arrest and acute desaturation","T",30,0),("Difficult airway recognition","E",25,0),("Sudden hypotension and acute arrhythmias","T",35,0),
 ("Anaphylaxis","T",25,0),("Massive bleeding","T",30,0),("Seizure and acute neurological deterioration emergency","T",25,0),("Hypoglycemia and severe hyperkalemia emergencies","T",30,0),
 ("Accidental extubation and ventilator disconnection","T",25,0),("CRRT emergencies","E",25,0),("Emergency patient transport","T",25,0)])}
# Objectives for P1 topics (keyed by topic text); verb-led, nursing-scoped.
OBJ = {
"Oxygen delivery systems and oxygen therapy":"Compare low- and high-flow devices and expected FiO2 ranges; assess response to oxygen; recognise when to escalate; document delivery device and SpO2 targets per order.",
"Invasive mechanical ventilation fundamentals and modes":"Describe the purpose of common modes; perform a nursing ventilator safety check; identify what is outside nursing scope (settings changes without protocol/order).",
"Ventilator parameters: PEEP, FiO2, tidal volume, plateau and driving pressure":"Define key parameters; recognise abnormal trends; explain lung-protective ventilation rationale; report changes to RT/physician.",
"Ventilator alarms: recognition and nursing response":"Identify common alarm causes (high pressure, low volume, disconnection); apply a patient-first response (DOPE-style check); escalate appropriately.",
"Airway suctioning":"State indications; describe safe technique and complications; monitor patient before, during and after; document secretions.",
"Endotracheal tube care and cuff pressure":"Perform and document ETT position/security checks; describe cuff-pressure assessment per local protocol; recognise displacement.",
"Weaning, SBT monitoring and extubation preparation":"Describe SAT/SBT safety screens and nursing monitoring; recognise SBT failure signs; prepare patient and equipment for extubation.",
"Recognition of respiratory deterioration":"Identify early signs (RR, work of breathing, SpO2 trend, mental status); use an early-warning score; escalate using SBAR.",
"ECG fundamentals and rhythm recognition":"Identify normal sinus rhythm and common ICU arrhythmias; recognise life-threatening rhythms; state immediate nursing actions and escalation.",
"Arterial blood pressure monitoring and arterial line maintenance":"Level and zero a transducer; recognise damped waveform and site complications; maintain line safely; document.",
"Shock recognition":"Differentiate shock types by presentation; identify early perfusion markers (MAP, lactate, urine output, cap refill, mentation); escalate promptly.",
"Septic shock nursing care":"Apply nursing role in the local sepsis pathway; monitor response to fluids/vasopressors per orders; recognise persistent shock.",
"Vasopressor and inotrope monitoring":"Monitor MAP targets, infusion-site and access safety, and adverse effects; use pump safety checks; escalate per protocol (no dose instructions published without pharmacist review).",
"Cardiac arrest and post-cardiac-arrest care":"Recognise arrest; describe the nurse's role in a resuscitation team; describe post-arrest monitoring priorities; document events.",
"Defibrillation safety":"State safe-operation steps (clear, oxygen safety, pad placement) at education level; clarify authorised-role requirements.",
"Neurological assessment and Glasgow Coma Scale":"Score GCS accurately; assess pupils and motor response; identify deterioration triggers; communicate findings.",
"ICP monitoring and cerebral perfusion pressure":"Explain ICP/CPP relationship; monitor trends and nursing measures to avoid ICP rises; escalate sustained elevation.",
"Sedation monitoring (RASS)":"Score RASS; relate to sedation targets; recognise over/under-sedation; support SAT.",
"Delirium screening and prevention":"Perform CAM-ICU-style screening (independently explained); apply non-pharmacological prevention; escalate positive screens.",
"Acute kidney injury":"Identify AKI by urine output/creatinine trends; recognise risk factors and nephrotoxins; monitor and escalate; state KDIGO guideline version used.",
"Urine output monitoring and fluid balance":"Calculate hourly output and net balance; recognise oliguria; link to perfusion; document accurately.",
"Potassium disorders":"Recognise hypo/hyperkalaemia signs including ECG changes; monitor during replacement; escalate severe values; apply safe-handling of concentrated electrolytes.",
"Acid-base disturbances and ABG interpretation":"Interpret pH, PaCO2, HCO3 with a stepwise method; identify compensation; link to clinical picture; escalate critical values.",
"CRRT fundamentals and equipment":"Explain CRRT principles and circuit components; describe nursing monitoring responsibilities; identify competency/supervision requirements.",
"Sedatives":"Describe classes and ICU use; monitor sedation depth and haemodynamic effects; safety of infusion handling; (no dosing published without review).",
"Vasopressors":"Describe classes and mechanisms; monitor MAP, perfusion and extravasation; safety checks; (no concentrations without review).",
"High-alert medication and infusion pump safety":"Identify ISMP high-alert categories; apply independent double-check and pump programming safety; report errors.",
"Sepsis and septic shock recognition":"Recognise sepsis using screening tools; describe timely escalation and pathway steps; document times.",
"Standard and transmission-based precautions, isolation, PPE":"Select correct precautions for contact/droplet/airborne; don/doff PPE sequence; hand hygiene moments.",
"CLABSI prevention":"Apply insertion/maintenance bundle elements; perform site assessment; recognise infection signs; escalate.",
"Ventilator-associated event prevention":"Apply bundle elements (HOB, oral care, SAT/SBT, hygiene); recognise VAE triggers; report.",
"Head-to-toe assessment and documentation":"Perform systematic ICU assessment; identify abnormal findings by system; document concisely.",
"Pain assessment (CPOT, BPS)":"Choose appropriate tool for communicative vs non-communicative patients; score and reassess; escalate uncontrolled pain.",
"Skin assessment and pressure injury prevention":"Stage pressure injuries; apply prevention measures; identify device-related injury; document.",
"Enteral feeding and aspiration prevention":"Verify tube position per protocol; monitor tolerance; apply aspiration-prevention measures; recognise complications.",
"Coagulation tests: INR, aPTT, fibrinogen":"Explain what each test measures; link abnormal results to bleeding/clotting risk; relevant nursing actions.",
"Blood product administration and transfusion reactions":"Apply pre-transfusion checks and monitoring; recognise reactions; stop-and-escalate steps per local policy.",
"SBAR, clinical handover and escalation of deterioration":"Structure SBAR/handover; use closed-loop communication; escalate with clear request and read-back.",
"Nursing documentation":"Document objectively, timely and completely; avoid common documentation errors; legal considerations.",
"Nursing scope of practice":"Distinguish nursing actions from prescriber decisions; recognise jurisdiction/institution variation; act within competence.",
}
rows=[]; n=0; p1=0
for d,(dn,topics) in D.items():
    for i,(t,lvl,mins,p) in enumerate(topics,1):
        n+=1; p1+=p
        rows.append({"topic_id":f"D{d:02d}-T{i:02d}","domain_no":d,"domain":dn,"topic":t,
          "learning_objectives":OBJ.get(t,"TBA at topic development") ,
          "learner_level":{"N":"Novice/new ICU nurse","T":"Transitioning/1-5 yrs","E":"Experienced/advanced"}[lvl],
          "est_learning_minutes":mins,"reference_sources":SRC[d],"priority":"P1 (first release)" if p else "P2/P3 (later)",
          "clinical_reviewer_specialty":REVIEWER[d],"development_status":"Not started"})
missing=[t for t in OBJ if t not in {r['topic'] for r in rows}]
assert not missing, missing
assert p1==40, p1
out=os.path.join(os.path.dirname(__file__),"master_curriculum.csv")
with open(out,"w",newline="",encoding="utf-8") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
print(f"{n} topics, {p1} P1 -> {out}")
