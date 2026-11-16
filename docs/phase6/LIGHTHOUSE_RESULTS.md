# Lighthouse audit (Phase 6, release-1 acceptance criterion #5)

Run 2026-11-16 against a production build (`next build && next start`, Supabase/Turnstile env vars blanked so the app runs in the same demonstration mode CI tests against), using `npx lighthouse` (v13.6.0) headless Chromium, both desktop and the tool's default mobile emulation.

**Target (`PRODUCT_REQUIREMENTS.md` release-1 criterion 5): Lighthouse mobile Performance ≥ 85, Accessibility ≥ 95; axe 0 critical issues.**

| Page | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/en` (home, mobile emulation) | 100 | 100 | 100 | 63 |
| `/en` (home, desktop) | 100 | 100 | 100 | 63 |
| `/en/library` (desktop) | 100 | 100 | 100 (was 96 before the favicon fix below) | 63 |

**Result: Performance and Accessibility both exceed the release-1 target by a wide margin on every page sampled.**

## SEO score (63) is intentional, not a defect

The single failing SEO audit on every page is `is-crawlable: Page is blocked from indexing`. This is correct, deliberate behaviour: `src/lib/env.ts`'s `indexable` flag is `true` only when `NEXT_PUBLIC_APP_ENV === "production"`, and every other environment (development, staging, this demonstration build) emits a `noindex` robots meta tag, matching `PRODUCT_REQUIREMENTS.md`'s own non-functional requirement ("SEO for public pages" applies to the real production deployment, not to a pre-launch build) and `tests/e2e/public.spec.ts`'s existing "non-production deployments tell crawlers to stay away" test. The SEO score will read differently once run against an actual `NEXT_PUBLIC_APP_ENV=production` deployment; it was not re-run against one here because no such deployment exists yet (see `PHASE0_REVIEW.md` §7 for what that needs).

## One genuine finding, fixed

`errors-in-console` (a Best Practices audit) failed on the first run: the browser's automatic `GET /favicon.ico` request 404'd, because no favicon existed anywhere in the repository (`src/app/favicon.ico` was missing; no `public/favicon.ico` either). Added `src/app/favicon.ico` (a simple navy "IK" lettermark matching the existing header badge in `src/components/layout/site-header.tsx`, generated locally with Pillow, no external asset or brand decision implied — a placeholder, not a final brand mark). Re-ran Lighthouse: Best Practices went from 96 to 100, confirming the fix.

## What this audit does not cover

- It was run once, locally, against a demonstration-mode build on one machine. It is not continuous (no Lighthouse CI wired into `ci.yml`) and not run against a real production deployment's actual network conditions, CDN, or real Supabase-backed data volumes.
- It covers three pages (home, library, and home again on two form factors). Not every route was sampled.
- Core Web Vitals field data (real-user measurement) does not exist yet; this is a lab run only.

## Recommendation

Release-1 acceptance criterion #5 ("Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95") is met on every page sampled, with a large margin. Wiring an automated Lighthouse CI budget into `ci.yml` (so a future regression is caught automatically, not just checked once by hand) would be a reasonable follow-up, but was not added here since the existing `tests/e2e/quality.spec.ts` "performance budgets" test and this one-off audit already satisfy the stated acceptance criterion, and adding new CI infrastructure for its own sake was not asked for.
