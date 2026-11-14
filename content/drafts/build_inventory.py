#!/usr/bin/env python3
"""Builds content/drafts/TOPIC_INVENTORY.csv: the single canonical list of the 40 P1 topics and their draft status.
Counts are derived from the draft files on disk (one canonical topic ID, one batch directory) and the curriculum CSV.
Run from the repo root: python3 content/drafts/build_inventory.py"""
import csv, glob, os, re
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
BLOCKED = {
 "D03-T09": ("BLOCKED", "SCCM PADIS 2018/2025 full text blocked (journals.lww.com Cloudflare 403); SCCM pages give abstract only"),
 "D09-T03": ("BLOCKED", "Open RN scope chapter (NBK610819) behind NCBI reCAPTCHA; ICN definition page too general alone"),
 "D07-T01": ("BLOCKED", "Open RN assessment chapters (NBK593210) behind NCBI reCAPTCHA; EPUAP guide covers skin assessment only"),
 "D02-T14": ("BLOCKED (partial evidence)", "ERC 2025 ALS full text read, but full ERC BLS and Post-Resuscitation Care guidelines not obtained (publisher Cloudflare 403); RCUK pages give summaries/algorithm PDFs only. Topic must not be drafted as complete until BLS and post-resuscitation full texts are read"),
}
cur = {r["topic_id"]: r for r in csv.DictReader(open(os.path.join(ROOT, "curriculum", "master_curriculum.csv"), encoding="utf-8"))}
drafted = {}
for f in sorted(glob.glob(os.path.join(ROOT, "content", "drafts", "batch-*", "*.md"))):
    t = open(f, encoding="utf-8").read()
    tid = re.search(r"^topic_id: (\S+)", t, re.M).group(1)
    batch = os.path.basename(os.path.dirname(f))
    if tid in drafted: raise SystemExit(f"duplicate topic id {tid}: {drafted[tid][0]} and {f}")
    srcs = re.search(r"^sources: \[(.*?)\]", t, re.M).group(1)
    drafted[tid] = (batch, os.path.relpath(f, os.path.join(ROOT, "content", "drafts")), srcs)
rows = []
for tid, r in cur.items():
    if not r["priority"].startswith("P1"): continue
    if tid in drafted:
        b, f, s = drafted[tid]; rows.append([tid, r["topic"], r["priority"], "DRAFTED (AI, not reviewed)", b, f, s, "no", ""])
    elif tid in BLOCKED:
        st, why = BLOCKED[tid]; rows.append([tid, r["topic"], r["priority"], st, "", "", "", "no", why])
    else:
        rows.append([tid, r["topic"], r["priority"], "NOT ATTEMPTED", "", "", "", "no", ""])
with open(os.path.join(os.path.dirname(__file__), "TOPIC_INVENTORY.csv"), "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh); w.writerow(["topic_id", "topic", "priority", "status", "batch", "draft_file", "sources", "clinically_reviewed", "blocker_or_note"]); w.writerows(rows)
from collections import Counter
print(len(rows), "P1 topics;", dict(Counter(r[3] for r in rows)), "; by batch", dict(Counter(r[4] for r in rows if r[4])))
