from _lib import *
JUR = "US FDA label only. EMA, MHRA and SFDA labels were not read; indications, warnings and presentations differ by country and by manufacturer."
FDA_PUMP = "S-FDA-PUMP"
EVIDENCE_TYPE = "The evidence here is a regulator product label (prescribing information written for prescribers and pharmacists). It is not a bedside nursing practice guideline: the nursing actions are inferences from label warnings, marked partial, and the unit's protocol governs practice."
def med(n, slug, name, cls, cat, hi, hi_note, summary, label, sections, monitoring, gaps):
    L = f"L-{label}"
    write(n, slug, dict(name=name, drug_class=cls, category=cat, high_alert=hi, high_alert_note=hi_note, summary=summary, batch=(n - 1) // 10 + 1, evidence_type_note=EVIDENCE_TYPE,
        evidence_status="partial", license_status="unassessed", label_source="FDA", label_ref=L, jurisdiction_note=JUR,
        sources=[{"id": L, "read": "full", "use": "regulator label sections (boxed warning, indications, warnings, adverse reactions) read in full text"}, {"id": FDA_PUMP, "read": "full", "use": "FDA infusion pump page (high-risk infusion examples)"}, {"id": "S-AHRQ-TS", "read": "partial", "use": "AHRQ TeamSTEPPS SBAR page"}],
        sections=sections, monitoring=monitoring, gaps=gaps,
        permissions=["US label text is the manufacturer's: paraphrase and cite; do not reproduce.", "FDA infusion pump page: verify reuse terms."]))
S = lambda *a: it(*a)

def quick(n, slug, name, cls, cat, hi, hi_note, summary, label, gp, resp, safety, adv, esc, mons, gaps, monitoring_text="Monitoring frequency and alarm limits follow the unit's protocol for this medicine.", doc="Record the product and order checks, monitoring results, adverse events and escalation per unit standard."):
    """Compact entry builder: every statement is paraphrased from the cited label; resp/escalation are partial inferences."""
    L = f"L-{label}"
    S = lambda texts, sup: [it(t, sup, L) for t in texts]
    sections = {
        "general_pharmacology": sec("partial", *S(gp, "sourced")),
        "nursing_responsibilities": sec("partial", *S(resp, "partial")),
        "monitoring": sec("local_protocol", LOCAL(monitoring_text)),
        "safety_alerts": sec("full", *S(safety, "sourced")),
        "adverse_effects": sec("partial", *S(adv, "sourced")),
        "escalation": sec("partial", *S(esc, "partial")),
        "documentation": sec("local_protocol", LOCAL(doc)),
    }
    monitoring = [mon(k, t, c, s, *([L] if s != "local_protocol" else [])) for k, t, c, s in mons]
    med(n, slug, name, cls, cat, hi, hi_note, summary, label, sections, monitoring, gaps)
