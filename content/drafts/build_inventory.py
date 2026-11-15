#!/usr/bin/env python3
"""Builds content/drafts/TOPIC_INVENTORY.csv: the single canonical list of the 40 P1 topics and their draft status.
Counts are derived from the draft files on disk (one canonical topic ID, one batch directory) and the curriculum CSV.
Run from the repo root: python3 content/drafts/build_inventory.py"""
import csv, glob, os, re
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
BLOCKED = {}
cur = {r["topic_id"]: r for r in csv.DictReader(open(os.path.join(ROOT, "curriculum", "master_curriculum.csv"), encoding="utf-8"))}
drafted = {}
for f in sorted(glob.glob(os.path.join(ROOT, "content", "drafts", "batch-*", "*.md"))):
    t = open(f, encoding="utf-8").read()
    tid = re.search(r"^topic_id: (\S+)", t, re.M).group(1)
    batch = os.path.basename(os.path.dirname(f))
    if tid in drafted: raise SystemExit(f"duplicate topic id {tid}: {drafted[tid][0]} and {f}")
    srcs = re.search(r"^sources: \[(.*?)\]", t, re.M).group(1)
    drafted[tid] = (batch, os.path.relpath(f, os.path.join(ROOT, "content", "drafts")), srcs)

# Coverage assessment (AI judgement, provisional, NOT clinical review).
# CORE COVERED = the stated learning objectives are addressed from at least one primary guideline/society document read in full and the remaining gaps are minor.
# PARTIAL = a draft exists but significant parts of the objectives or evidence are missing, dated, summary-level or restricted by population.
# THIN = textbook-level, single-manufacturer or prescribing-level evidence only, or major objective content missing.
# Only CORE COVERED topics are marked comprehensively_covered = "PROVISIONAL YES"; nothing is "YES" until clinical review.
COVERAGE = {
 "D01-T03": ("PARTIAL", "BTS 2017 oxygen guideline not read; device-specific delivery detail thin; target ranges limited to AARC and NICE content"),
 "D01-T06": ("PARTIAL", "Educational review (not a guideline) plus AARC PVA; no ventilator-specific nursing detail, no NIV, paediatric or ARDS-strategy content; series parts 2-4 not read"),
 "D01-T07": ("CORE", "ARDS-focused ESICM 2023 and AARC PVA 2024 read; driving pressure evidence low certainty; non-ARDS targets limited"),
 "D01-T09": ("THIN", "Phase 3: two manufacturer manuals (HAMILTON-C1 2020; Draeger Evita Infinity V500, older) show devices differ; AACN alarm alert summary only; no cross-manufacturer guideline; alarm tables not reproduced; Joint Commission not retrieved"),
 "D01-T11": ("CORE", "AARC suctioning CPG 2022 read; neonatal and paediatric content not used; local technique varies"),
 "D01-T12": ("CORE", "AARC PVA cuff-pressure statements and SHEA read; no national UK guideline; securement technique detail limited"),
 "D01-T17": ("PARTIAL", "Phase 3: extubation preparation and post-extubation care added only from a SECONDARY 2026 best-evidence summary for difficult-to-wean patients; ATS/ACCP 2017, Korean 2024 and difficult-airway guidelines not read; AARC SBT guideline covers SBT only"),
 "D01-T19": ("PARTIAL", "NEWS2 and NICE content; BTS 2017 oxygen guideline not read; no ICU-specific deterioration guideline"),
 "D02-T02": ("THIN", "Textbook plus public AACN summaries only; AACN full alerts need login; AHA ECG monitoring standards not accessible; no alarm limits, lead choice or 12-lead content; strips not included"),
 "D02-T04": ("PARTIAL", "Arterial-line levelling, zeroing, flushing and maintenance technique still unresolved after Phase 3 search (Canberra ICU procedure returned 403; no accessible society guideline); only indications and CDC 2011 infection prevention"),
 "D02-T08": ("PARTIAL", "ESICM 2014 consensus is dated; SSC 2026 read at recommendation level only; SSC 2021 superseded"),
 "D02-T09": ("PARTIAL", "SSC 2026 recommendation page only; no nursing bundle detail; fluid volumes deliberately omitted"),
 "D02-T12": ("PARTIAL", "Phase 3: FDA labels give extravasation and monitoring statements and 2026 studies give peripheral-use incidence; frequency of site checks, nursing recognition signs, first-line extravasation management and line compatibility unsupported"),
 "D02-T14": ("CORE", "ERC 2025 BLS/ALS/post-resuscitation read; algorithms not reproduced (ERC permission enquiry prepared, not sent); UK RCUK 2025 partial"),
 "D02-T15": ("CORE", "ERC 2025 defibrillation safety read; energy settings and device-specific steps not taught; manufacturer documentation not read"),
 "D03-T01": ("CORE", "Official GCS aid and site read; ICU adaptations (intubated patients, pupils) limited"),
 "D03-T03": ("PARTIAL", "BTF 2016 covers adults with severe TBI only; no nursing technique (levelling, waveforms, positioning, pupils, drain care); non-TBI neurocritical guidelines not read; no newer edition checked"),
 "D03-T09": ("PARTIAL", "PADIS pages at recommendation level only; RASS and SAS definitions not taught; permissions unresolved"),
 "D03-T10": ("PARTIAL", "PADIS page and NICE CG103; CAM-ICU and ICDSC tool details not taught or licensed"),
 "D04-T02": ("PARTIAL", "NICE NG148 recommendations; KDIGO staging and detail not used; no ICU-specific AKI nursing guideline"),
 "D04-T03": ("PARTIAL", "NICE and textbook-level fluid balance; measurement technique detail limited"),
 "D04-T06": ("PARTIAL", "Phase 3: ICU potassium-safety safeguards added (2026 expert-panel consensus, CC BY); hypokalaemia recognition thresholds, replacement protocols and monitoring unsupported; hyperkalaemia from UKKA July 2026 with a 6.5 versus 6.0 mmol/L ECG inconsistency"),
 "D04-T08": ("PARTIAL", "Basic four-disorder method (Open RN) and dated AARC 2013; anion gap, mixed disorders, lactate and arterial puncture technique not covered"),
 "D04-T09": ("THIN", "KDIGO 2012 prescribing-level Section 5 only; no machine, circuit, alarm, citrate or equipment content; no manufacturer documentation"),
 "D05-T01": ("PARTIAL", "Phase 3: FDA labels (midazolam, lorazepam, propofol, dexmedetomidine; US, one manufacturer each) add key safety statements; PADIS at recommendation level; ICU infusion practice, nursing titration, withdrawal syndromes and pharmacokinetics unsupported; no doses taught"),
 "D05-T03": ("PARTIAL", "Phase 3: FDA labels (norepinephrine, vasopressin, epinephrine, dopamine, dobutamine, phenylephrine) and peripheral-vasopressor evidence added; angiotensin II, milrinone, compatibility, concentrations, nursing extravasation signs and management unsupported; US labelling only"),
 "D05-T16": ("CORE", "ISMP 2024 list and FDA pump page read; list not reproducible; no drug-specific safeguards; FDA page dated 2018; US sources"),
 "D06-T01": ("PARTIAL", "SSC 2026 recommendation page and two NICE NG253 chapters; SSC 2021 superseded; full publication not read"),
 "D06-T04": ("PARTIAL", "CDC 2007 isolation guideline and WHO hand hygiene 2009 not read; page-level CDC content only"),
 "D06-T05": ("CORE", "SHEA 2022 and CDC 2011 read; CDC guideline dated; insertion technique details limited"),
 "D06-T07": ("CORE", "SHEA 2022 and AARC read; US and UK context differences; oral care evidence moderate"),
 "D07-T01": ("THIN", "Open RN general entry-level checklist only; no ICU head-to-toe assessment source"),
 "D07-T03": ("PARTIAL", "PADIS recommendation level; CPOT structure from a CC BY review; CPOT and BPS definitions and permissions not obtained"),
 "D07-T04": ("PARTIAL", "Abridged 2026 international quick reference guide only; full guideline not read"),
 "D07-T06": ("PARTIAL", "Phase 3: tube-position checks added from NICE CG32 (UK, 2017) and the 2016 NHS England alert summary; non-UK methods, the alert resource set, NPSA 2011-2013 alerts and ASPEN/ESPEN not read"),
 "D08-T02": ("THIN", "One laboratory handbook page, ARUP educational pages and a US textbook; no national guideline; test physiology, specimen-error effects and ICU coagulopathy practice unsupported; reference ranges local"),
 "D08-T03": ("PARTIAL", "Phase 3: NICE NG24 1.13 monitoring added; BSH acute transfusion reaction guideline not accessible so first actions beyond stop-and-report are unsourced; AABB Circular partly read; textbook-level bedside steps"),
 "D09-T01": ("PARTIAL", "AHRQ TeamSTEPPS and SBAR page-level content only"),
 "D09-T02": ("PARTIAL", "Phase 3: UK NMC Code section 10 plus Open RN textbook; no ICU chart standard (infusions, ventilator charts, fluid balance); NMC record-keeping guidance and other regulators not read"),
 "D09-T03": ("PARTIAL", "Phase 3: UK NMC Code (sections 11, 13, 16) and US NCSBN/ANA delegation guidelines plus Open RN and ICN; no task-level ICU scope list; no regulator for other countries"),
}
def covcols(tid):
    lvl, gaps = COVERAGE[tid]
    return [lvl, "PROVISIONAL YES (AI judgement; not clinically reviewed)" if lvl == "CORE" else "NO", gaps]
rows = []
for tid, r in cur.items():
    if not r["priority"].startswith("P1"): continue
    if tid in drafted:
        b, f, s = drafted[tid]; rows.append([tid, r["topic"], r["priority"], "DRAFTED (AI, not reviewed)", b, f, s, "no", "", *covcols(tid)])
    elif tid in BLOCKED:
        st, why = BLOCKED[tid]; rows.append([tid, r["topic"], r["priority"], st, "", "", "", "no", why, "NOT DRAFTED", "NO", "No draft exists"])
    else:
        rows.append([tid, r["topic"], r["priority"], "NOT ATTEMPTED", "", "", "", "no", "", "NOT DRAFTED", "NO", "No draft exists"])
with open(os.path.join(os.path.dirname(__file__), "TOPIC_INVENTORY.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh); w.writerow(["topic_id", "topic", "priority", "status", "batch", "draft_file", "sources", "clinically_reviewed", "blocker_or_note", "coverage_level", "comprehensively_covered", "key_coverage_gaps"]); w.writerows(rows)
from collections import Counter
print("coverage levels", dict(Counter(r[9] for r in rows)))
print(len(rows), "P1 topics;", dict(Counter(r[3] for r in rows)), "; by batch", dict(Counter(r[4] for r in rows if r[4])))
