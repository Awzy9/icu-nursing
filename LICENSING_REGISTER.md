# Licensing Register

Classification (as defined in the project brief):

- **GREEN** — clearly open licence permitting commercial reuse when conditions are followed.
- **YELLOW** — free to access; commercial reuse/adaptation needs review or permission.
- **RED** — proprietary, paid, copyrighted or unclear. Research and citation only unless permission is obtained.

**Rule:** until a source's licence has been verified against the publisher's own page, it is treated one level more restrictive than claimed. Free access ≠ permission to redistribute.

Last checked: 2026-11-14. Machine-readable detail: `sources/source_register.csv`.

| Source | Class | Basis | What may be done | What must NOT be done | Action |
|---|---|---|---|---|---|
| Open RN (6 books) | **YELLOW → GREEN after verification** | Brief states CC BY 4.0; I could not read the NCBI page (browser challenge) | After verification: adapt with attribution + modification notice | Reuse third-party images/figures without checking their own licence; imply endorsement | Verify licence text on each book's NCBI page; log image-level exceptions |
| OpenStax nursing | YELLOW | Licence is per book | Per book | Bulk reuse before checking | Check each book |
| AACN (framework, ECCO, KAT, Synergy) | **RED** | Proprietary; some paid/member-only | Read public descriptions; cite | Scrape, copy, adapt ECCO, KAT or the framework text | Build original competency framework |
| SCCM ICU Liberation | **RED for commercial use** | SCCM page: free for hospital staff training; other use needs advance request (iculiberation@sccm.org) | Cite underlying peer-reviewed evidence; write original text | Copy tools, illustrations, training content into the paid product | Send permission request (needs your approval) |
| AARC CPGs | **RED** | Journal/AARC copyright (open-access status unverified) | Cite, paraphrase, original diagrams | Copy tables/figures/text | Check each CPG's reuse terms |
| AHA 2025 CPR/ECC | **RED** | AHA copyright | Cite, original diagrams | Reproduce algorithms/figures/training graphics | Review AHA permissions policy |
| AHRQ TeamSTEPPS 3.0 | YELLOW | US federal material, third-party items possible; automated fetch blocked | Original exercises based on principles; attribute | Reuse downloadables before per-item check | Verify per download |
| CDC | YELLOW | US federal; images may carry third-party rights | Cite; paraphrase | Reuse images/training slides unchecked | Verify per page; record dates |
| KDIGO | **RED** | KDIGO copyright (unverified); 2026 AKI/AKD update is a **draft** per search results | Cite/paraphrase final published versions | Present draft as final; copy tables | Re-check at build time |
| ASPEN | **RED** | Proprietary; paid resources | Cite public guidance | Use paid education | — |
| ISMP | **RED** | Proprietary | Cite; ask permission to reproduce high-alert lists | Copy lists/figures | Permission request |
| NICE | YELLOW | NICE Notice of Rights / OGL (unverified) | Cite; reuse after reading notice | Imply NICE endorsement | Verify |
| WHO | YELLOW/RED | Many WHO publications are CC BY-NC-SA (non-commercial) — **unverified** | Cite only | Commercial reuse of NC material | Verify per publication |
| H5P (software) | GREEN (software, verify) | h5p.org/licensing reachable; terms not read | Use if licence fits | Assume content licences follow software licence | Read licence page |
| React Flow, Next.js, Supabase, Tailwind, shadcn/ui, Lucide, Expo | GREEN (software; to be confirmed at install) | Open-source licences; pages reachable | Use | — | Record exact licence per package in `THIRD_PARTY_LICENSES` at Phase 1 |

## Permission requests (draft, not sent)

1. **SCCM** — iculiberation@sccm.org: ask whether independently authored educational material referencing the ABCDEF bundle, and linking to SCCM resources, is acceptable in a paid platform; ask about use of any SCCM tools.
2. **AHA / ISMP / KDIGO / AARC** — ask only if needed for specific tables or figures; default is original diagrams.

## Provenance rule for every content item

Each topic/question/scenario stores: source IDs, a note of *what was independently written*, author, reviewer, licence class of each source, and the date sources were last checked (`content_versions` + `topic_references`).
