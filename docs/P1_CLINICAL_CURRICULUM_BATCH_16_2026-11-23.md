# ICU Nursing P1 — Batch 16: CI repair and real API publication-gate test
**Date:** 2026-11-23  
**Repository/branch:** Awzy9/icu-nursing, `p1/clinical-content-batch-01-20261123`  
**Pull request:** [#113](https://github.com/Awzy9/icu-nursing/pull/113) — remains draft, unreviewed and unmerged.

## Confirmed failing CI and root cause
GitHub Actions run **45239899847**, job **137921405314** failed at `npm run typecheck`. Job logs showed exactly four TypeScript errors:
- `scripts/build-working-content.ts:70`: TS2559, NodeJS `ProcessEnv` passed directly to a weakly typed `isProductionWorkingRelease()` parameter.
- `src/lib/working/index.ts:13`: same TS2559.
- `tests/unit/p1-publication-gate-batch-15.test.ts:77,80`: TS2322 from spreading possibly `undefined` `fakeIndex.entries[0]`, making required `ReviewIndexEntry` fields optional.

## Fixes made on this draft branch
1. Both application call sites now construct an explicit environment object from `CONTENT_EDITION`, `NEXT_PUBLIC_APP_ENV`, `VERCEL_ENV`. This resolves TS2559 while **preserving fail-closed behavior**.
2. The test uses `fakeIndex.entries[0]!`, which preserves required typed source/hash/reviewer fields. All four prior errors have targeted corrections; **final CI still must confirm**.
3. The preexisting enabled `tests/unit/content-api.test.ts` fixture assumed any `CONTENT_EDITION=working` with unknown app environment was permissible. Since the new release guard rightly denies unspecified production/staging classification, the tests now explicitly set `NEXT_PUBLIC_APP_ENV=staging` and `VERCEL_ENV=preview` and restore environment afterward.
4. Added `tests/unit/p1-production-content-route-batch-16.test.ts`, an actual response-level integration test of **all 11** `/api/content/*` endpoints (catalog, individual entry, version, labs, CRRT, case visuals, exam topics/pick/questions, paths, revision). It verifies **404 + content_edition_disabled** on Vercel production even if someone mislabels `NEXT_PUBLIC_APP_ENV` as staging, missing app-environment fail-closed, and explicitly configured staging preview still works.
5. Original clinical content, `content/working-catalog.json`, evidence draft register and clinical source rights are not modified by this CI repair.

## Scope and approvals
The fail-closed production release guard for the working edition remains on the PR branch only. All **166 entries in the existing staff draft index** have `clinically_reviewed: false` at audit time; the approval register is empty and the interactive datasets have no human publication signoff. The original 40-topic / 20-case course and extension proposals have **not** been approved. Never copy 'green CI' into a human clinical approval field.

## Outstanding
- Check the complete GitHub workflow trio (main CI, learning-experience Playwright, isolated Supabase tests) on the final branch head; inspect errors and repair without compromising local CAPTCHA or real patient safety.
- Review separately managed legacy content routes and staging preview access controls. The current production gate covers only the working edition; it does not assert that all legacy/other systems are clinically reviewed.
- Verify commercial licence rights, specialist nursing/ICU/medical/pharmacy signoffs and independent publisher approval, plus live deployment plan.
- No production release, mobile build, draft-banner removal or merge to `main`.
