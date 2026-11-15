# @icu/schemas

Shared TypeScript types and [zod](https://zod.dev) schemas for the ICU Nurse Knowledge Map: the shapes returned by the Supabase RPCs (question bank, study, cases, skills, medications, equipment state), the draft-content vocabulary, and the pure account-deletion helpers. One definition for the website and the native iOS/Android apps.

* **Pure TypeScript.** The only import is `zod` (a peer dependency); no Next.js, React, Node, DOM, Supabase or `server-only` code. A unit test (`tests/unit/schemas-package.test.ts`) and `npm run typecheck:schemas` (compiled with `lib: ES2022` and `types: []`) enforce this.
* **Subpath imports:** `import { caseAttemptSchema } from "@icu/schemas/cases"`. Modules: `question-bank`, `cases`, `skills`, `medications`, `equipment`, `equipment-state`, `content`, `account-deletion`. The package index exports them as namespaces because several modules define helpers with the same names.
* **Web app:** resolved through `tsconfig.json` `paths` and the Vitest aliases. The old import paths (`@/lib/cases/types` and so on) are one-line re-exports, so nothing else changed.
* **Expo / React Native:** proven in a scratch copy of the prototype (not committed to `mobile/`): `integration/metro.config.example.js` (watch folder plus module mapping) and `integration/tsconfig.paths.example.json`. `npx expo export --platform android` bundled it (694 modules, zod included) and `tsc --noEmit` passed. See `docs/phase12/SHARED_SCHEMAS.md`.
* **Not in the package (deliberately):** Supabase clients, RPC wrappers, secrets, fixtures, any clinical content.
