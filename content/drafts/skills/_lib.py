"""Helpers for the Phase 7 clinical skill drafts. Statements are paraphrased from sources recorded in sources/source_register.csv (S-*) or NEW_SOURCES.csv (N-*).
Support levels: sourced = traced to a full-text-read authoritative statement; partial = partially read / non-graded / dated / secondary;
local_protocol = deliberately NOT sourced (refers the learner to manufacturer instructions or local policy). Nothing is written for unsupported areas: they go to `gaps`."""
import json, os
OUT = os.path.dirname(os.path.abspath(__file__))
def it(text, support, *sources): return {"text": text, "support": support, "sources": list(sources)}
def sec(support, *items): return {"support": support, "items": list(items)}
def c(phase, text, critical, support, *sources): return {"phase": phase, "text": text, "critical": critical, "support": support, "sources": list(sources)}
def src(id, read, use): return {"id": id, "read": read, "use": use}
def ref(title, publisher, year, url, licence=None): return {"title": title, "publisher": publisher, "year": year, "url": url, "accessed": "2026-11-14", **({"licence": licence} if licence else {})}
LOCAL = lambda t: it(t, "local_protocol")
def write(n, slug, d):
    d = {"skill_id": f"SK-{n:02d}", "number": n, "status": "DRAFT", "origin": "ai_generated", "clinically_reviewed": False, "clinical_reviewers": [],
         "banner": "DRAFT, NOT clinically reviewed. Not an approved competency assessment and not a validated clinical standard. Never shown to learners.", **d}
    json.dump(d, open(os.path.join(OUT, f"SK-{n:02d}-{slug}.json"), "w"), indent=1, ensure_ascii=False)
