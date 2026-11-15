"""Phase 14: 12 DRAFT practical-education exercise specifications (SBAR, documentation, monitoring and escalation, infection prevention, equipment practice,
competency self-assessment). Original examples with fictional patients; no doses, thresholds or protocols; never imported or shown to learners."""
import json, os
OUT = os.path.dirname(os.path.abspath(__file__))
BANNER = "DRAFT, NOT clinically reviewed. Original practical exercise with fictional people; never imported, published or shown to learners."
AREAS = ["sbar", "documentation", "monitoring-escalation", "infection-prevention", "equipment-practice", "competency"]
PLAN = [  # number, area, kind, title
 (1, "sbar", "classify", "SBAR call about a patient who is getting worse"),
 (2, "sbar", "classify", "SBAR call to raise a concern about a prescribed medicine"),
 (3, "documentation", "spot", "Find the weaknesses in a bedside note"),
 (4, "documentation", "choice", "Correcting a charting error"),
 (5, "monitoring-escalation", "choice", "A rising early-warning score that has not reached the call-out level"),
 (6, "monitoring-escalation", "spot", "Which habits weaken monitoring and escalation?"),
 (7, "infection-prevention", "classify", "What counts as hand hygiene?"),
 (8, "infection-prevention", "choice", "Storing alcohol-based hand rub safely"),
 (9, "equipment-practice", "sequence", "Checking an infusion pump before and after a change"),
 (10, "equipment-practice", "choice", "A monitor alarm sounds: patient first"),
 (11, "competency", "checklist", "Self-assessment: keeping a clear and safe record"),
 (12, "competency", "checklist", "Self-assessment map of the 25 first-release skills"),
]
def S(i, r, u): return {"id": i, "read": r, "use": u}
def it(id, text, support, sources, **k): return {"id": id, "text": text, "support": support, "sources": sources, **k}
STD_GAPS = ["No published exercise may exist until the review phase: this is a specification only.", "The wording, answers and explanations are the author's reading of the cited sources and have had no clinical or educational review.", "The exercise has not been tested with learners, and its Arabic version has not been written."]
PERM = ["Cited sources are paraphrased only; see the licensing register for each source's reproduction status."]
AH = S("S-AHRQ-TS", "partial", "TeamSTEPPS SBAR page: structure only")
DOC = S("S-OPENRN-FUND-DOC", "full", "Open RN Nursing Fundamentals 2.5: documentation principles and error correction")
NEWS = S("S-RCP-NEWS2", "full", "NEWS2 report: aid to clinical judgement, record the oxygen device, escalation by policy")
C74 = S("S-OPENRN-ADV-C74", "full", "Open RN Advanced Skills 7.4: assess the patient first when the ECG changes")
PUMP = S("S-FDA-PUMP", "full", "FDA infusion pump page: verify, label, use the library, respond to alerts, report")
HH = S("S-CDC-HANDHYG-2024", "partial", "CDC hand hygiene page: definition and fire-safety points")
ISMP = S("S-ISMP-HA", "full", "ISMP high-alert list: used only to say that some medicines need extra care")
ALL = {}
def mk(n, **d):
    num, area, kind, title = PLAN[n - 1]
    base = {"practice_id": f"PX-{num:02d}", "number": num, "title": title, "area": area, "kind": kind, "status": "DRAFT", "origin": "ai_generated", "clinically_reviewed": False,
            "clinical_reviewers": [], "banner": BANNER, "fictional": True, "evidence_status": "partial", "arabic_status": "not_written", "gaps": STD_GAPS, "permissions": PERM}
    base.update(d); ALL[num] = base
    slug = "".join(c if c.isalnum() else "-" for c in title.lower()).strip("-")[:48].strip("-")
    json.dump(base, open(os.path.join(OUT, f"PX-{num:02d}-{slug}.json"), "w"), indent=1, ensure_ascii=False)

SB = [{"id": "s", "label": "S: Situation"}, {"id": "b", "label": "B: Background"}, {"id": "a", "label": "A: Assessment"}, {"id": "r", "label": "R: Request"}, {"id": "out", "label": "Leave out"}]
mk(1, objectives=["Give a structured call about a deteriorating patient.", "Keep the background to what the listener needs.", "End with a specific request."], sources=[AH],
 required_sources=["Unit or national guidance on calling for review and the local escalation route", "A source on SBAR use at nursing level in critical care"],
 gaps=STD_GAPS + ["The AHRQ page was only partly read: it is used for the four-part structure and nothing else."],
 setup="A fictional adult, Mr A, two days after surgery, on a fictional ward; the nurse phones the doctor on call.",
 categories=SB, items=[
  it("i1", "I am calling about Mr A in bed 4. Over the last hour his breathing has become faster and he is more drowsy.", "partial", ["S-AHRQ-TS"], category="s", why="It states what is happening now."),
  it("i2", "He is two days after abdominal surgery and was started on treatment for a chest infection yesterday.", "partial", ["S-AHRQ-TS"], category="b", why="It is the history the doctor needs to interpret the change."),
  it("i3", "I think he is getting worse, and I am worried about his breathing.", "partial", ["S-AHRQ-TS"], category="a", why="It is the nurse's own assessment and level of concern."),
  it("i4", "Please come and see him now. Is there anything you want me to do while I wait?", "partial", ["S-AHRQ-TS"], category="r", why="It states what is needed and when, and asks for interim instructions."),
  it("i5", "The ward was short-staffed last night.", "partial", ["S-AHRQ-TS"], category="out", why="It does not help the doctor decide what to do now.")])
mk(2, objectives=["Raise a medicine concern clearly without blame.", "Name the specific concern and ask for a decision."], sources=[AH, ISMP],
 required_sources=["Unit medicine-query procedure", "A professional standard on questioning a prescription"],
 gaps=STD_GAPS + ["The ISMP list is used only to justify choosing a high-alert medicine as the example; no medicine guidance is given.", "The example names no medicine, dose or route."],
 setup="A fictional adult on a fictional ward; a prescribed medicine looks different from what the nurse expected. The nurse calls the prescriber.",
 categories=SB, items=[
  it("i1", "I am calling about Ms B in bed 7. I have an order I would like to check before I give it.", "partial", ["S-AHRQ-TS"], category="s", why="It says why you are calling."),
  it("i2", "She had a procedure this morning, and her previous order was different.", "partial", ["S-AHRQ-TS"], category="b", why="It gives relevant context for the query."),
  it("i3", "The new order does not match what I expected, and I am not confident it is intended.", "partial", ["S-AHRQ-TS"], category="a", why="It states your concern and its basis without blame."),
  it("i4", "Please confirm or change the order, and I will hold it until I hear from you.", "partial", ["S-AHRQ-TS", "S-ISMP-HA"], category="r", why="A specific request, plus a safe interim action."),
  it("i5", "The last doctor never writes clearly.", "partial", ["S-AHRQ-TS"], category="out", why="Blame does not help the decision.")])
mk(3, objectives=["Recognise features that make a record unsafe to rely on."], sources=[DOC], evidence_status="partial",
 required_sources=["The employer's documentation policy and approved abbreviation list", "A national professional standard on record keeping for the jurisdiction"],
 gaps=STD_GAPS + ["The Open RN text is US-oriented; legal wording and retention rules differ by jurisdiction.", "Whether an abbreviation is acceptable is a local list decision."],
 setup="A fictional bedside note written by a fictional nurse.", prompt="Select the lines that weaken the record.", lines=[
  it("l1", "14:20 Told Dr Lee by phone that the patient has a new cough; asked for review; Dr Lee will see the patient by 15:00. A. Nurse, RN, 12 March.", "sourced", ["S-OPENRN-FUND-DOC"], problem=False, why="Dated, timed, signed, factual, says who was told and what happens next."),
  it("l2", "The patient was uncooperative and difficult.", "sourced", ["S-OPENRN-FUND-DOC"], problem=True, why="Documentation should be objective, factual and professional; describe what was seen and said."),
  it("l3", "Pt c/o SOB.", "sourced", ["S-OPENRN-FUND-DOC"], problem=True, why="Abbreviations should be avoided in legal documentation."),
  it("l4", "Dressing change completed at 15:00 (entered at 14:30).", "sourced", ["S-OPENRN-FUND-DOC"], problem=True, why="Do not document in advance of completing a task."),
  it("l5", "Observations done.", "partial", ["S-OPENRN-FUND-DOC"], problem=True, why="Only recording that something was done tells the next reader nothing; record the findings."),
  it("l6", "(an entry with no time and no signature)", "sourced", ["S-OPENRN-FUND-DOC"], problem=True, why="All documentation must include date, time and signature.")])
mk(4, objectives=["Correct a paper charting error without hiding it."], sources=[DOC],
 required_sources=["The employer's policy on corrections, including electronic records"], gaps=STD_GAPS + ["Electronic correction methods differ by system; only the principle is stated."],
 setup="A fictional nurse notices a mistaken entry on a paper chart.", stem="What is the correct way to deal with the mistaken entry?", options=[
  it("a", "Draw a single line through it, write 'mistaken entry' above with your initials, and then write the correct entry.", "sourced", ["S-OPENRN-FUND-DOC"], correct=True, feedback="Errors are corrected with a single line, the words 'mistaken entry' and initials; they are not erased."),
  it("b", "Cover it with correction fluid and write over it.", "sourced", ["S-OPENRN-FUND-DOC"], correct=False, feedback="Errors should never be erased, scribbled out or covered with white-out."),
  it("c", "Scribble it out so it cannot be read.", "sourced", ["S-OPENRN-FUND-DOC"], correct=False, feedback="The original entry must remain readable so the record can be reviewed."),
  it("d", "Leave it and hope no one notices.", "partial", ["S-OPENRN-FUND-DOC"], correct=False, feedback="A known error is corrected so later readers are not misled.")])
mk(5, objectives=["Treat an early-warning score as an aid to judgement and act on a worsening trend."], sources=[NEWS],
 required_sources=["The unit's early-warning and escalation policy", "A source on trend-based escalation in critical care"],
 gaps=STD_GAPS + ["NEWS2 is a UK tool and ICU units may use other tools and continuous monitoring.", "No numeric thresholds are written; they come from the local policy and the official chart."],
 setup="A fictional adult on a fictional ward; three sets of observations over six hours show a rising score, none at the call-out level.",
 stem="What is the best action?", options=[
  it("a", "Use clinical judgement: share the trend and your concern with the responsible clinician according to the unit's policy, and repeat observations as the policy directs.", "partial", ["S-RCP-NEWS2"], correct=True, feedback="Early-warning scores aid, and do not replace, clinical assessment; a worsening trend deserves escalation."),
  it("b", "Wait until the score reaches the call-out level because the policy has not been triggered.", "partial", ["S-RCP-NEWS2"], correct=False, feedback="Waiting for a trigger can lose valuable time when the trend is clearly worsening."),
  it("c", "Change the score by re-measuring until the number looks better.", "partial", ["S-RCP-NEWS2"], correct=False, feedback="Observations are recorded as measured; manipulating them hides deterioration."),
  it("d", "Ignore the trend because each single score looks acceptable.", "partial", ["S-RCP-NEWS2"], correct=False, feedback="A series of acceptable-looking scores can hide a steady decline.")])
mk(6, objectives=["Recognise habits that hide deterioration."], sources=[NEWS, C74],
 required_sources=["The unit's alarm and escalation policy", "A critical-care source on alarm management, read in full"],
 gaps=STD_GAPS + ["Alarm-management sources read so far are partial or restricted; statements here are limited to patient-first assessment."],
 setup="A fictional shift on a fictional unit.", prompt="Select the habits that weaken monitoring.", lines=[
  it("l1", "Silencing an alarm and moving on without looking at the patient.", "partial", ["S-OPENRN-ADV-C74"], problem=True, why="An alarm is a prompt to assess the patient."),
  it("l2", "Recording the oxygen device or flow along with the saturation.", "partial", ["S-RCP-NEWS2"], problem=False, why="The device and flow are part of interpreting a saturation."),
  it("l3", "Widening alarm limits so they ring less often.", "partial", ["S-OPENRN-ADV-C74"], problem=True, why="Limits are set by order or policy; widening them to stop noise hides change."),
  it("l4", "Telling the responsible clinician about a worsening trend even if no single score is high.", "partial", ["S-RCP-NEWS2"], problem=False, why="Trends matter; scores aid judgement."),
  it("l5", "Assuming an odd reading is artefact without checking the patient.", "partial", ["S-OPENRN-ADV-C74"], problem=True, why="Check the patient before deciding.")])
mk(7, objectives=["Know what hand hygiene means."], sources=[HH], required_sources=["WHO or national hand hygiene guidance read in full", "The unit's hand hygiene policy"],
 gaps=STD_GAPS + ["Only the definition is used: when to use soap and water or hand rub, and the steps, are deliberately not written because the detail pages were not read."],
 setup="A fictional shift on a fictional ward.", categories=[{"id": "yes", "label": "Hand hygiene"}, {"id": "no", "label": "Not hand hygiene"}], items=[
  it("i1", "Washing hands with water and soap", "partial", ["S-CDC-HANDHYG-2024"], category="yes", why="One of the listed methods."),
  it("i2", "Cleaning hands with an alcohol-based hand rub", "partial", ["S-CDC-HANDHYG-2024"], category="yes", why="One of the listed methods."),
  it("i3", "Surgical hand antisepsis", "partial", ["S-CDC-HANDHYG-2024"], category="yes", why="One of the listed methods."),
  it("i4", "Wiping hands on a clean towel without soap or rub", "partial", ["S-CDC-HANDHYG-2024"], category="no", why="It is not one of the listed methods of cleaning hands.")])
mk(8, objectives=["Know that alcohol-based hand rub is flammable and must be stored safely."], sources=[HH], required_sources=["The facility's fire-safety policy"],
 gaps=STD_GAPS + ["Dispenser placement and storage limits depend on local fire law and are not written."],
 setup="A fictional ward store room.", stem="Why must alcohol-based hand rub be stored with care?", options=[
  it("a", "Because it contains ethyl alcohol, which evaporates into an ignitable vapour and is a flammable liquid.", "partial", ["S-CDC-HANDHYG-2024"], correct=True, feedback="It is a flammable liquid; store it safely and follow local fire-safety rules."),
  it("b", "Because it goes off quickly in the heat.", "partial", ["S-CDC-HANDHYG-2024"], correct=False, feedback="The risk named is fire, not spoilage."),
  it("c", "Because it makes the floor slippery.", "partial", ["S-CDC-HANDHYG-2024"], correct=False, feedback="The risk named is fire."),])
mk(9, objectives=["Know the checks that keep an infusion pump safe when something changes."], sources=[PUMP, ISMP],
 required_sources=["The unit's pump procedure and drug-library policy", "Manufacturer instructions for the pump in use"],
 gaps=STD_GAPS + ["The order of the steps is the author's choice; the source lists the checks without a strict sequence."],
 setup="A fictional pump on a fictional ward; no drug or rate is named.", steps=[
  it("s1", "Label the pump channel and the tubing with the name of the fluid or drug if the pump does not show it", "sourced", ["S-FDA-PUMP"], why="Labels at the port of entry help others identify what is running."),
  it("s2", "Check the programming against the order", "sourced", ["S-FDA-PUMP"], why="The settings must match what was prescribed."),
  it("s3", "Use the drug library if one exists", "sourced", ["S-FDA-PUMP"], why="The library adds safety limits."),
  it("s4", "Respond carefully to any alert rather than silencing it", "sourced", ["S-FDA-PUMP"], why="Alerts need action."),
  it("s5", "Stop and report an alert you cannot resolve or a mismatch with the order", "partial", ["S-FDA-PUMP", "S-ISMP-HA"], why="Report suspected over- or under-infusion.")])
mk(10, objectives=["Put the patient before the machine when an alarm sounds."], sources=[C74], required_sources=["Unit alarm policy"],
 gaps=STD_GAPS + ["Only the patient-first principle is written."],
 setup="A fictional monitored adult on a fictional unit; the monitor shows a new abnormal rhythm.", stem="What do you do first?", options=[
  it("a", "Go to the patient, assess for signs of reduced cardiac output and call for help if needed.", "sourced", ["S-OPENRN-ADV-C74"], correct=True, feedback="When the ECG shows a new abnormal finding, assess the patient immediately."),
  it("b", "Silence the alarm and look at the printout later.", "partial", ["S-OPENRN-ADV-C74"], correct=False, feedback="Silencing is not a response."),
  it("c", "Change the monitor settings to stop the alarm.", "partial", ["S-OPENRN-ADV-C74"], correct=False, feedback="Alarm settings follow order or policy."),
  ])
mk(11, objectives=["Rate your own record-keeping habits honestly."], self_assessment_only=True, sources=[DOC], required_sources=["Your employer's documentation policy"],
 gaps=STD_GAPS + ["This is a self-reflection tool, not an assessment: no scores, no verification, no certificate."],
 setup="A personal list; the learner rates themselves, and the ratings stay on their device.", items=[
  it("c1", "I record the date, time and my signature on every entry.", "sourced", ["S-OPENRN-FUND-DOC"]),
  it("c2", "I write what I saw, heard and did, not opinions.", "sourced", ["S-OPENRN-FUND-DOC"]),
  it("c3", "I never record something as done before it is done.", "sourced", ["S-OPENRN-FUND-DOC"]),
  it("c4", "I correct mistakes openly and never erase.", "sourced", ["S-OPENRN-FUND-DOC"]),
  it("c5", "I avoid abbreviations that are not on my employer's list.", "partial", ["S-OPENRN-FUND-DOC"])])
mk(12, objectives=["Plan practice across the 25 first-release skills."], self_assessment_only=True, sources=[], required_sources=["An employer-approved competency framework (the AACN framework could not be read)"],
 gaps=STD_GAPS + ["The skills list is the platform's own; no competency standard is implied.", "The AACN competence framework page returned an error and is not used."],
 setup="A personal map of the 25 skills (SK-01 to SK-25) with four self-rating levels.", skills=[f"SK-{i:02d}" for i in range(1, 26)], levels=["not_started", "learning", "with_support", "independent"])
print(len(ALL), "practice drafts")
