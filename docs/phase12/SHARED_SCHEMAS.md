# Shared schema package for native integration (Phase 12, batch 2)

## What was done
* New workspace-style folder `packages/schemas` (`@icu/schemas`, private, peer dependency `zod`). The eight pure type modules moved there with `git mv`, so history follows: `question-bank` (also holds the study types and `QuestionBankError`), `cases`, `skills`, `medications`, `equipment`, `equipment-state`, `content`, `account-deletion`.
* The original files became one-line re-exports (`export * from "@icu/schemas/<module>"`), so the 90-odd existing imports are untouched and a test proves old and new paths expose the same objects.
* Resolution: `tsconfig.json` `paths` (`@icu/schemas`, `@icu/schemas/*`) and aliases in the three Vitest configs. Next.js, `tsx` scripts, Playwright and Vitest all resolve it. It is deliberately **not** an npm workspace yet: that would change `package-lock.json` and the Vercel install, and nothing needs it. Making it a real workspace later is a mechanical step.
* Portability is enforced: the package may import only `zod` and its own files, may not touch `process.env`, `window`, `document`, `Buffer`, `require`, `"use client"`/`"use server"` or `server-only` (unit test), and compiles under `tsc -p packages/schemas/tsconfig.json` with `lib: ES2022` and no ambient types (`npm run typecheck:schemas`, part of `npm run typecheck` and therefore of CI).
* Contract check: the in-memory engines' outputs (cases, equipment state, skills) are parsed with the package schemas; the SQL RPC outputs are already parsed with the same schemas in the database tests.

## Proof that Expo can consume it (scratch copy; `mobile/` untouched)
A copy of the prototype plus a copy of the package was given the `metro.config.example.js` (watch folder, module mapping, node_modules lookup) and the `tsconfig` paths, an `App.tsx` that imports `@icu/schemas/cases`, `/equipment-state` and `/account-deletion` and calls them, and `zod@^4.1`. Results: `npx expo export --platform android` succeeded (Metro bundled 694 modules; the Hermes bundle contains the schema strings), and `tsc --noEmit` passed once `zod` was mapped to the app's own copy. The Android package identifier and the prototype were not changed.

## How the real app should adopt it (a later step, with the owner's go-ahead)
1. Add `metro.config.js` and the `paths` from `packages/schemas/integration/` to `mobile/`; add `zod` as a dependency of `mobile/`.
2. Wrap each RPC in `mobile/src/api/` and parse the result with the package schema.
3. When the first native feature needs it, decide between this path-based setup and converting to npm workspaces; both keep the schemas as the single source of truth.

## Limits
* RPC wrapper functions and the Supabase client are not in the package (they depend on runtime and secrets).
* The `study` types still live inside `question-bank`; splitting them is cosmetic.
* The web-only helpers that call `server-only` modules were not moved.
