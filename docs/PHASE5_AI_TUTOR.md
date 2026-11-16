# Phase 5 — learner-facing AI tutor (implemented, mock mode)

**Status: implemented and tested in mock mode. No real/paid AI service is activated. Activating one is a separate, explicitly authorized decision this implementation does not make.**

## What exists

A citation-grounded "ask the tutor" feature at `/tutor` (`src/app/[locale]/tutor/page.tsx`), backed by `src/lib/tutor/`:

- `src/lib/tutor/refusal.ts` — pattern-based refusal detection (patient-specific questions, dosing requests, diagnosis/prescription requests, too-short queries), run **before** any retrieval.
- `src/lib/tutor/index.ts` — `askTutor(query, locale)`: if not refused, calls the exact same retrieval `/search` already uses (`searchEverything`, `src/lib/search/index.ts`) and returns up to 6 citations (title, link, short summary) to already-published/synthetic content.
- `src/lib/tutor/types.ts` — the `TutorAnswer`/`TutorError` shapes.
- `supabase/migrations/0020_tutor_usage.sql` — durable, DB-enforced usage caps (20/hour, 60/day) and an append-only usage log, for real (non-demo) mode.

## The one structural fact that makes this safe

**There is no generative step anywhere in this implementation.** `askTutor` never calls a language model. The "answer" a caller renders is always exactly: fixed, translated template text, plus a list of citations that `searchEverything` returned. `searchEverything` is the same function `/search` already uses in production, which by construction:

- searches only titles and short summaries of already-published content (library topics, skills, medications, equipment, cases, practice labs) or, in demonstration mode, the bundled synthetic fixtures;
- never reads from `content/drafts/`, because the repository/service layer it calls (`getContentRepository()`, `getSkillService()`, `getMedicationService()`, etc.) has no code path into the draft directory at all — the same structural guarantee every other learner-facing page relies on;
- never searches question stems, options or answers.

This means a prompt-injection attack, a jailbreak attempt, or a cleverly-worded patient-specific question can, at worst, retrieve citations to published general-education material. It cannot produce a fabricated clinical recommendation, cannot leak an unpublished draft, and cannot leak another learner's data, because there is no component capable of generating free text from the query at all. `tests/e2e/skills.spec.ts`'s existing "no clinical skill draft appears in ... search" test was extended to assert this for `/tutor` directly (it was already guaranteed, by construction, but this gives a concrete, re-runnable proof).

## Refusal handling

`detectRefusal` (and its unit tests in `tests/unit/tutor.test.ts`) intercepts, before retrieval:
- **Patient-specific questions** ("my patient...", "should I give...", "can I give..."): refused — point the learner to their unit's protocol and the prescriber/senior clinician.
- **Dosing/rate requests** ("what dose...", a quantity unit like mg/kg/hr): refused — doses are a prescriber/pharmacist decision.
- **Diagnosis/prescription requests** ("diagnose", "prescribe", "what's wrong with me"): refused — out of scope for an education tool.
- **Too-short queries**: refused, asking for a longer question.

This is deliberately conservative (biased toward refusing) and is a UX safety net on top of the structural guarantee above, not the only thing standing between a bad question and a bad answer — see "the one structural fact" above.

## Authentication, rate limits and usage caps

- **Authentication:** in real (non-demo) mode, `/tutor` requires sign-in (`requireUser`), same as `/bookmarks`. In demonstration mode (no real Supabase project configured) there is no account system to require, so the page is reachable but usage is tracked per browser session only.
- **Burst rate limit:** an in-process sliding-window guard (`src/lib/rate-limit.ts`, the same helper `cases/actions.ts` already uses) applies in every mode.
- **Durable usage cap:** in real mode, every query (refused or not) is logged via the `tutor_record_query` RPC (migration `0020`), which raises an error at 20 questions/hour or 60/day **inside the database**, so the cap holds even if a client bypasses the Next.js server entirely (e.g. raw PostgREST) — the same design the question-bank and case-attempt rate limits already use (migration `0010`).
- `tutor_usage_remaining()` lets the UI show a learner their own remaining quota before they ask.
- The usage log stores the learner's own sanitized query text and a hit count — **never the answer, never the citation targets** — because the "answer" has nothing clinical in it to begin with (see above), so there is nothing privacy-sensitive to minimize beyond the query itself, and even that is capped at 500 characters and never shown to anyone but the learner who asked it (no table grants to any role; two SECURITY DEFINER functions are the only access path, mirroring `ai_evidence_reviews` from migration `0019`).

## Prompt-injection protections (architecture note for a future real-model integration)

Nothing in this implementation interprets retrieved text as instructions, because nothing in this implementation interprets anything as instructions — there is no model call. This section records the design constraints a future real-LLM integration **must** keep, since "mock mode first" implies a later, separately-authorized step:

1. **Never concatenate retrieved content into a system/instruction channel.** Retrieved titles/summaries must be passed to a model only as clearly-delimited, inert "reference material," with an explicit instruction that anything inside that material is data, never a command — the same principle this codebase already applies to GitHub/Slack/webhook content elsewhere.
2. **Keep the refusal check as a pre-filter, not a post-hoc one.** A patient-specific or dosing question must never reach a model call at all, exactly as it is intercepted today.
3. **Ground every generated sentence in a citation, and refuse to answer anything the retrieval step returned zero hits for**, rather than letting a model answer from its own training data — this is what "citation-grounded" means and is the entire point of Phase 5 over an unconstrained chatbot.
4. **Never pass draft content into the model's context**, even indirectly (e.g., via an admin-only debugging path) — the retrieval layer must stay the single choke point.
5. **Keep the DB-enforced usage/cost caps as the backstop for API spend**, independent of any client-side limit, exactly as implemented now.
6. Any such integration needs **explicit, separate authorization** before it is built, and **further explicit authorization before it is turned on for real traffic** (a paid API key is a cost and a data-handling decision, not an engineering one) — this implementation deliberately stops short of that line.

## Testing

- `tests/unit/tutor.test.ts` — refusal detection (every category) and `askTutor`'s demo-mode retrieval/refusal/no-match paths.
- `tests/db/tutor.test.ts` — authorization (anon refused, no table access, no staff role required), validation, the two DB-enforced caps, per-learner isolation, append-only.
- `tests/e2e/tutor.spec.ts` — the page itself: form, disclaimer, demo notice, citations never pointing at a draft, both refusal categories, honest no-match reporting, Arabic/RTL, accessibility (axe, 0 serious/critical).
- `tests/e2e/skills.spec.ts`'s existing draft-leakage test was extended to probe `/tutor` directly.

## What this is not, and what remains before any real-model activation

- Not a diagnostic or clinical decision-support tool (the refusal patterns and the disclaimer banner say so explicitly).
- Not connected to a paid AI service of any kind.
- Not a replacement for `/search` — it is `/search`'s retrieval, restyled as a single Q&A box with refusal handling and a usage cap, because that is what "mock mode" of a citation-grounded assistant honestly is without a real model behind it.
- Before any real model is added: a provider decision, a cost-cap and billing-alert design, a prompt/context-window security review, red-team testing specifically for prompt injection via the retrieved-content channel, and explicit owner authorization to spend money on it — none of which this phase does.
