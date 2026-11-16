"""Phase 14 MCQ quality edits (all questions stay unpublished DRAFTs). For each edited question: stem context added where the stem had none, plausible
distractors given the concrete detail a real nurse would meet (not padding), and circular 'Why correct' texts ('This is the SCCM statement.') replaced by
explanations of the reasoning. No new clinical claim is introduced: every explanation restates what the cited source and the question's own rationales already say.
Idempotent (a changed text is simply replaced again). Run from the repository root: python3 content/drafts/mcq_phase14_edits.py"""
import glob, re
E = {}
def q(topic, num, stem=None, opts=None, why=None, whynot=None): E[(topic, num)] = dict(stem=stem, opts=opts or {}, why=why, whynot=whynot or {})
# ---- stems + distractors (flagged by the audit)
q("D06-T04","Q5",stem="At handover on a mixed medical unit, which patient most needs follow-up about precautions?")
q("D06-T05","Q3",stem="A nurse is about to give an intermittent injection through a needleless connector on a patient's central line. Which sequence best reduces contamination?",
  opts={"B":"Wipe the connector once with dry gauze, access it with a sterile syringe, and put the removed cap back on if it looks undamaged.","C":"Put on gloves, flush through the connector to clear it, and disinfect the connector afterwards to remove anything left on the surface.","D":"Disinfect the connector, access it with a clean but non-sterile syringe kept in the bedside drawer, and flush the line later in the shift."})
q("D09-T01","Q5",stem="During an SBAR handover at the change of shift, which omission is most likely to cause harm to the patient?")
q("D09-T02","Q2",stem="A nurse is recording an overnight event after a patient complained of chest pain. Which entry is most appropriate in the record?",
  opts={"A":"\"Patient was agitated and difficult overnight, and the family were demanding and kept pressing the call bell.\"","C":"\"Patient is probably just anxious; no action needed at this time, so nothing further has been recorded.\"","D":"\"Patient was fine all night according to the other nurse who looked after him, so no observations were repeated.\""})
q("D09-T02","Q5",stem="While reviewing a patient's chart at the end of a shift, which finding should prompt follow-up?",
  opts={"A":"A signed and dated correction of a mistaken entry, made with a single line so that the original is still visible.","B":"A progress note that includes the time, measurements and a quotation of what the patient said.","D":"A medication record that gives the reason a prescribed dose was withheld and who was told."})
q("D03-T10","Q5",stem="A nurse is teaching a student about hypoactive delirium in a quiet, withdrawn patient. Which statement is correct?")
q("D02-T04","Q3",stem="A nurse is managing a patient's arterial pressure-monitoring circuit. According to CDC 2011, which practice is not allowed?",
  opts={"A":"A continuous flush with the prescribed flush solution, delivered by the pressurised bag and flush device.","B":"A closed continuous-flush system that reduces the number of entries into the pressure-monitoring circuit.","D":"Scrubbing the diaphragm with an appropriate antiseptic before the system is accessed for a blood sample."})
q("D03-T09","Q5",stem="A nurse is reviewing how sedation is assessed on a ventilated unit. Which statement about monitoring tools is accurate according to SCCM?")
q("D07-T01","Q2",stem="A nurse is carrying out the cardiovascular part of a head-to-toe assessment. Which technique matches the checklist?",
  opts={"A":"Listen over one area of the chest for ten seconds and record the rate, then move on to the respiratory system.","B":"Palpate a single pulse on one limb, then record that the pulses are present and move on to the next system.","C":"Check the pulses on the dominant side only, because the other side will be the same in nearly every patient."})
q("D09-T03","Q5",stem="A student nurse asks why legal reviews of negligence place so much weight on documentation. Which explanation is correct?",
  opts={"A":"Documentation is needed for billing and has no bearing on how care is judged when a case is reviewed in law.","C":"Charts must be as long as possible to show effort, because courts count the number of words that were recorded.","D":"Physicians' notes count as evidence, so nursing documentation is optional once the orders have been entered."})
q("D01-T17","Q3",opts={"B":"Starting SBTs in the evening, when the patient is more settled and the day's sedation has had hours to wear off.","C":"Doing an SBT at a different time every day, so that staff can compare how the patient copes at each time of day."})
q("D05-T03","Q5",stem="A nurse is preparing an intravenous epinephrine infusion. Which nursing check does the epinephrine grid specifically name?",
  opts={"A":"Checking the patient's weight every hour so that the infusion can be adjusted to it.","B":"Weighing the syringe before each use to confirm that the concentration is correct.","D":"Measuring the room temperature while the drug is infusing, because heat alters the drug."})
q("D03-T03","Q5",stem="A nurse on a neurocritical care unit reads that the guideline advises caution about CPP above 70 mm Hg. Why?",
  opts={"A":"High CPP improves outcomes, so no caution is needed when a clinician pushes the pressure up with fluids or drugs.","B":"High CPP is thought to be more dangerous in older patients, and carries no risk in younger adults.","D":"High CPP is harmful if the patient has no ICP monitor in place, because it cannot then be measured."})
q("D06-T04","Q2",stem="A nurse is about to care for a patient on a busy unit. Which approach to choosing PPE for a task is most consistent with standard precautions?")
q("D07-T04","Q5",stem="A nurse is assessing a patient with darker skin for pressure injury. Which approach is most appropriate?")
q("D01-T11","Q2",stem="A nurse is caring for an intubated adult patient. Which finding best indicates a need for suctioning?")
q("D01-T12","Q4",stem="A nurse is caring for an intubated patient on a ventilator. Which approach best reduces pressure injury from the tube and its securement?")
q("D02-T04","Q2",stem="A nurse is monitoring a patient with a radial arterial line. Which finding is the most urgent concern?")
q("D07-T01","Q5",stem="A nurse is documenting the respiratory assessment of a patient on oxygen. Which entry best documents the oxygen device?")
q("D04-T08","Q1",stem="A nurse reviews a patient's arterial blood gas: pH 7.28, PaCO₂ 58 mm Hg and HCO₃ 25 mEq/L. What does the textbook's method identify?")
q("D04-T09","Q4",stem="On a unit running CRRT, the prescription is not being delivered because the therapy has been interrupted several times. What is the best action?")
# questions that ask what a source says test recall of the source, so they are tagged 'understanding' rather than application, judgment, monitoring or similar
TAG = {k: "understanding" for k in [("D01-T03","Q4"),("D01-T07","Q4"),("D02-T08","Q5"),("D04-T02","Q5"),("D01-T12","Q1"),("D03-T01","Q2"),("D01-T19","Q5"),("D07-T01","Q1"),("D07-T01","Q6"),("D09-T03","Q3"),("D01-T17","Q3"),("D05-T01","Q1"),("D05-T03","Q2")]}
# ---- explanations that only named the source
W = {
("D02-T14","Q2"):"The BLS text describes compressions at a depth and rate that allow full recoil between compressions, and says that on a mattress the rescuer compresses deeper to compensate for the soft surface. The other options are too shallow, too slow, too fast or lean on the chest.",
("D07-T06","Q5"):"Choosing the route and type of nutrition, for example gastric, post-pyloric or parenteral, is a decision for the prescriber or dietitian with the team. The nurse carries it out, monitors and reports within that plan, as the other options show.",
("D04-T02","Q2"):"NICE detects AKI from changes against a baseline or a rate of change, and a sustained fall in urine output is one of the listed criteria. The distractors rely on colour or weight, which are not criteria.",
("D02-T08","Q2"):"The consensus names the skin, kidneys and brain as windows because perfusion can be judged at the bedside from skin findings, urine output and mental state without special equipment; other organs are less accessible.",
("D02-T08","Q3"):"Cool mottled skin, new confusion and falling urine output show poor perfusion in all three bedside windows at once, which suggests shock and needs urgent escalation. The other patients are stable.",
("D02-T08","Q5"):"The consensus advises measuring lactate when shock is suspected, notes that it is usually raised, and recommends repeated values to follow the response. It also stresses that no single variable proves or excludes shock.",
("D05-T16","Q5"):"The ISMP list introduction says independent double checks are not always the best safeguard and may be impractical for every high-alert medicine, so organisations should consider other safeguards, such as standardisation and limiting access, chosen by local policy.",
("D09-T02","Q3"):"A single line, the words 'mistaken entry' and the writer's initials keep the original readable and show who corrected it, which supports an honest, auditable record. Obscuring or removing entries suggests concealment.",
("D01-T06","Q3"):"Plateau pressure is read during an end-inspiratory pause with no flow, when it approximates alveolar pressure if the patient is passive. Coughing or active effort invalidates the pause, and the gap between peak and plateau reflects resistance.",
("D07-T01","Q4"):"The checklist presents itself as a routine, general, daily assessment for an entry-level nurse. It does not replace focused or specialty assessments, which follow unit guidelines, and it is not an ICU-specific standard.",
("D07-T03","Q2"):"SCCM identifies the BPS, BPS-NI and CPOT as the behavioural tools with the best validity and reliability in patients who cannot self-report but show observable behaviours. Vital signs are not valid indicators of pain, and the numeric rating scale needs self-report.",
("D02-T02","Q6"):"Deciding which drug, cardioversion or pacing to use for a new dysrhythmia is a treatment decision for the prescriber or team. Applying electrodes, documenting and calling for help are nursing actions.",
("D04-T09","Q3"):"KDIGO recommends a chest radiograph soon after placing an internal jugular or subclavian dialysis catheter and before first use, to confirm position and exclude complications. The distractors describe measures KDIGO suggests against, or recommends in addition.",
("D04-T09","Q5"):"KDIGO suggests not using topical antibiotics at the insertion site and not using antibiotic locks to prevent infection of non-tunnelled dialysis catheters. Each distractor misstates one of these suggestions.",
("D04-T09","Q6"):"Choosing the anticoagulation strategy for CRRT, such as regional citrate or heparin, is a prescribing decision. Reporting, documenting and checking the site are nursing responsibilities.",
("D01-T17","Q5"):"The guideline's evidence summary found the RSBI had moderate sensitivity but poor specificity for extubation success, and that requiring it delayed liberation in a trial, so it suggests the RSBI is not needed to decide readiness for an SBT.",
("D04-T06","Q6"):"Selecting the calcium salt, the insulin and glucose amounts and any binder is drug and dose selection, a prescriber decision with pharmacist input. Timed monitoring, ECG and reporting are nursing actions.",
("D05-T03","Q4"):"For dobutamine the textbook grid calls for continuous monitoring of ECG, blood pressure, cardiac output and urine output through the therapy, because the drug can cause marked rises in heart rate and pressure. Weekly tests or temperature alone would miss an acute change.",
("D05-T03","Q6"):"Choosing a vasopressor and deciding to add a second agent is prescribing, with pharmacist input. Checking, observing, recording and reporting are nursing tasks.",
("D05-T01","Q2"):"The boxed warning in the textbook says that using benzodiazepines and opioids together can cause profound sedation, respiratory depression, coma and death. The effects add up rather than offset one another, and the warning is a caution for patients generally.",
("D05-T01","Q3"):"The PADIS 2018 pages suggest propofol or dexmedetomidine rather than benzodiazepines for sedating mechanically ventilated adults (conditional recommendation, low certainty), in line with a general preference for light sedation.",
("D05-T01","Q5"):"The 2025 focused update suggests dexmedetomidine over propofol when light sedation or reducing delirium is the priority (conditional, moderate certainty). The other options describe statements that do not appear on the page.",
("D05-T01","Q6"):"Choosing the sedative agent, dose and sedation target is prescribing with pharmacist input. The nurse monitors, checks and calls for help.",
("D04-T03","Q5"):"Low urine output, a rising heart rate, cool peripheries and new confusion together point to poor perfusion, which needs urgent escalation. The other patients have normal findings or tasks that can wait.",
("D04-T03","Q6"):"Choosing the fluid and its rate and deciding on a diuretic are prescribing decisions. The nurse observes, records and reports the response.",
("D03-T03","Q5"):"The guideline's Level III statement cautions that aggressive attempts to push CPP above 70 with fluids and pressors may risk adult respiratory failure. It is a caution about harm at higher values, not about age or monitor presence.",
("D09-T03","Q5"):"The chapter gives the rule of thumb that an undocumented assessment or action is treated as not done, which is why accurate records matter in a legal review. Length is not required, and nursing notes form part of the record.",
("D03-T09","Q2"):"SCCM states that daily sedation interruption and nurse-protocolised targeted sedation can achieve and maintain light sedation in intubated adults. They do not guarantee shorter stays, replace validated scales or amount to a legal requirement.",
("D03-T09","Q5"):"SCCM's statement is that bispectral index can help titrate sedation in deep sedation or neuromuscular blockade, and when no scale can be used. It supplements scales and does not replace them, and vital signs are not a valid sedation measure.",
("D04-T09","Q2"):"KDIGO recommends stopping all heparin when HIT is suspected and using a direct thrombin or Factor Xa inhibitor instead (1A). Continuing or increasing heparin, including in the circuit, would worsen HIT.",
("D04-T08","Q5"):"The AARC 2013 guideline recommends against using a peripheral venous PO2 as a substitute for arterial PaO2 (grade 1A, recommendation 14.7). The recommendation is not limited to children, and the arterial sample remains the reference.",
("D01-T17","Q3"):"The AARC authors suggest a standardised approach to assessing for, and if appropriate completing, an SBT before noon each day, coordinated with other care including sedation interruption (conditional recommendation, very low certainty).",
("D02-T04","Q3"):"CDC 2011 advises against giving dextrose-containing solutions or parenteral nutrition fluids through the pressure-monitoring circuit (Category IA). The continuous flush, a closed system and scrubbing the diaphragm are part of recommended practice.",
("D07-T01","Q2"):"The checklist directs comparing pulses on both sides and taking an apical pulse for one minute across the five auscultation areas. The other options are too brief, too limited or ignore asymmetry, which is a key finding.",
("D05-T03","Q5"):"The textbook's epinephrine grid names monitoring the IV site for extravasation when the drug is given intravenously. Hourly weights, weighing the syringe and room temperature are not monitoring items in the grid.",
("D06-T05","Q3"):"Hand hygiene, then scrubbing the connector with the approved antiseptic and letting it dry before every access with a sterile device, is the recommended sequence. Dry gauze is not disinfection, disinfecting after access is too late, and non-sterile devices must not enter the system.",
("D06-T04","Q5"):"A patient with new respiratory symptoms and a higher-risk admission source should have interim precautions and review. The other patients already have visible, documented controls that are working.",
("D09-T01","Q5"):"A severe allergy and a pending result directly affect immediate treatment safety, so omitting them risks harm. The other omissions carry little immediate safety risk.",
("D09-T02","Q2"):"The entry is objective and time-stamped, with a quotation, measurements and the action taken, so another clinician can rely on it. The others use subjective labels, opinion or someone else's report presented as the writer's own.",
("D09-T02","Q5"):"A five-hour gap in observations while the blood pressure is falling suggests missed monitoring or recording and needs follow-up. Correcting an error, a detailed note and a recorded reason for a withheld dose are good practice.",
("D03-T10","Q5"):"NICE advises particular vigilance because hypoactive delirium, in which the patient is quiet and withdrawn, is often missed. It is not harmless, is not limited to dementia and does not call for automatic sedation.",
}
for k in TAG: E.setdefault(k, dict(stem=None, opts={}, why=None, whynot={}))
for (t, n), w in W.items(): E.setdefault((t, n), dict(stem=None, opts={}, why=None, whynot={}))["why"] = w
files = glob.glob("content/drafts/batch-*/*.md") + glob.glob("content/drafts/mcq-expansion/XQ-*.md")
done = set()
for f in files:
    t = open(f, encoding="utf-8").read(); topic = re.search(r"^(?:topic_id|set_id): (\S+)", t, re.M).group(1)
    if "## 17. MCQs" not in t: continue
    head, rest = t.split("## 17. MCQs", 1); body, tail = (rest.split("## 18.", 1) + [""])[:2] if "## 18." in rest else (rest, None)
    blocks = re.split(r"^(\*\*(?=Q\d))", body, flags=re.M)
    out = [blocks[0]]; i = 1
    while i < len(blocks):
        sep, b = blocks[i], blocks[i + 1]; i += 2
        num = re.match(r"(Q\d+)", b).group(1); e = E.get((topic, num))
        if e:
            if e["stem"]: b, c = re.subn(r"^(Q\d+ \([^)]*\)\.\*\*)\s*.*$", lambda m: f"{m.group(1)} {e['stem']}", b, count=1, flags=re.M); assert c == 1
            for L, txt in e["opts"].items(): b, c = re.subn(rf"^{L}\. .*$", lambda m: f"{L}. {txt}", b, count=1, flags=re.M); assert c == 1, (topic, num, L)
            if (topic, num) in TAG: b, c = re.subn(r"^(Q\d+) \([^)]*\)\.\*\*", lambda m: f"{m.group(1)} ({TAG[(topic, num)]}).**", b, count=1, flags=re.M); assert c == 1
            if e["why"]: b, c = re.subn(r"^\*\*Why correct:\*\* .*$", lambda m: f"**Why correct:** {e['why']}", b, count=1, flags=re.M); assert c == 1
            done.add((topic, num))
        out += [sep, b]
    new = head + "## 17. MCQs" + "".join(out) + ("## 18." + tail if tail is not None else "")
    if new != t: open(f, "w", encoding="utf-8").write(new)
missing = set(E) - done
assert not missing, missing
print(len(done), "questions edited")
