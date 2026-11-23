# ICU Nursing P1 — Batch 18: Mobile offline clinical-content withdrawal
**Date:** 2026-11-23  
**PR:** [#113](https://github.com/Awzy9/icu-nursing/pull/113)  
**State:** Unmerged draft. No clinical approvals, production release, TestFlight or Play build submitted.

## Why this was needed
The web/mobile shared content API correctly returns `404 {"error":"content_edition_disabled"}` if the working curriculum has not passed production approvals. The original mobile `fetchCached()` ignored the HTTP error type, treating **every** failed fetch as a possible offline state and returning the last cached content. This could expose previously cached, subsequently withdrawn clinical draft lessons, answer keys, ECG/CRRT/transfusion labs and scenarios, even after a server publication denial.

## Corrections
- `mobile/src/core/remoteContent.ts` now differentiates a site-wide **content_edition_disabled** JSON 404 response and status 401/403/410 from an ordinary broken network/5xx response. Explicit denial does **not** trigger cached fallback.
- Publication denial rotates a **persisted, origin-specific cache generation**. The previous generation's lessons, catalogue, exam pool and lab datasets cannot be read by later offline requests. An in-memory block remains for this session if storage itself fails.
- Cache now uses `icu.content.v2` and exact-host scoping. Legacy unscoped v1 caches are intentionally not reused (safe migration); previously fetched preview content from one origin is not offered as offline content from another host.
- A successful validated fetch can repopulate current-generation cache. Ordinary offline/network and 5xx failures still use the current-generation cache; an individual 404 `not_found` is **not** interpreted as a global publication withdrawal.
- A denied exam-picking response also triggers generation invalidation; exam selections themselves remain uncached.
- Added test cases in `tests/mobile/remote-content.test.ts` for server denial, cross-resource invalidation, recovery, host isolation, 404 not_found distinction and 403 denial.

## Residual limitations
- This does not reach devices that have remained **offline since before the server withdrew access**. Remote server rules cannot instantaneously revoke data stored on a disconnected device. A time-based offline freshness/revalidation policy may be required for stricter clinical publication obligations.
- Content withdrawal currently maps to the existing `{status:"offline"}` response shape to preserve native-screen compatibility. A follow-up UI improvement should distinguish **"clinical content currently unavailable"** from true offline/no-cache, rather than imply the network is down.
- The cache is a best-effort storage layer, not a secured DRM store. There is no claim that user screenshots or older app installs can be revoked.
- No clinical review, copyright permissions or production approval created. **Run mobile tests, iOS/Android bundle inspection, all CI and isolated live suites on the final commit.**

## Production boundaries
The server-side gate in Batches 15–17 remains the source of truth. It requires real human and rights signoff for every published catalog entry and interactive dataset; this mobile change only prevents stale local fallbacks **after the app learns of denial**. Do not merge or deploy solely because this regression test passes.
