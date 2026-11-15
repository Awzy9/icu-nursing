# Vercel preview audit: `icu-nursing-preview` (Phase 11)

Read-only audit through the Vercel API with a token the owner supplied through the secure form. **Nothing on Vercel or in the `staging` branch was changed.** No deployment protection was touched, no environment variable was added or read (values were never requested; only names/targets were listed), nothing was promoted to production.

## 1. What exists
| Item | Finding |
|---|---|
| Project | `icu-nursing-preview` (`prj_aaHLgWd82tYhVcCEzsMLDD3gFgRH`), team scope of the owner's personal account, Next.js, Node 22.x, created today |
| Git link | GitHub `Awzy9/icu-nursing`, **Production Branch = `main`** |
| Domains | `icu-nursing-preview.vercel.app` (verified). There is **no production deployment** (`live: false`) |
| Deployment protection | `ssoProtection: all` (Vercel Authentication on for every deployment, including production). No password protection, no trusted IP list. Fork protection on. **Keep as is** |
| Environment variables | **None defined** on the project |
| Build settings | Framework preset only. Dashboard "Ignored Build Step" is `exit 1` (always build); `vercel.json` in the repo overrides it with `bash scripts/vercel-ignore.sh` (build only branch `staging`). Function region in the dashboard is `iad1`; `vercel.json` requests `bom1` |
| Deployments (15 seen) | 2 READY, both on branch `staging` at commit `8a73f14` (preview target, protected). 1 ERROR on `staging` at `1c93d19`. 12 CANCELED on the feature branch `claude/vigilant-mendel-95k63h` (cancelled by the ignore script, as designed) |
| `staging` branch | Exists on GitHub at `8a73f14` = `1c93d19` + one owner commit changing only `vercel.json` (`npm ci` replaced by `npm install --no-audit --no-fund`) |
| `main` | `245271b`, "Merge Phase 0 blueprint" (PR #2 is not merged) |

## 2. Why the first staging build failed
The ERROR deployment (`1c93d19`) died in `npm ci`: "Missing: @esbuild/* , @parcel/watcher-*, fsevents ... from lock file". The committed `package-lock.json` lacks the optional platform-specific entries that Vercel's npm requires, while GitHub Actions' npm (10.9.9) accepts it. The owner's workaround (`npm install`) made the build pass but is less reproducible than `npm ci`.

**Repair prepared on the development branch (not on staging):** regenerating the lockfile with `npm install --package-lock-only` adds 113 platform entries, drops 2 nested `postcss-selector-parser` copies, and changes only four patch versions (`@eloqnt/config` 0.1.1 to 0.1.2, `@eloqnt/format-json` 0.1.0 to 0.1.1, `@eloqnt/format-po` 0.1.1 to 0.1.2, `electron-to-chromium` 1.5.485 to 1.5.486). `npm ci` was verified to succeed in a clean directory with the new lockfile, and the full test suite was run against it (see the Phase 11 report). With this lockfile `npm ci` should work on Vercel and the `npm install` override is no longer needed.

## 3. Configuration differences to resolve (none applied)
| # | Repository / plan | Vercel project today | Effect | Recommendation |
|---|---|---|---|---|
| 1 | `docs/STAGING.md` assumes Production Branch = `staging` | Production Branch = `main` | Pushes to `staging` become **preview** deployments, not production. Good for safety: no production release exists. `main` never builds (ignore script) | Keep it. Do not change the production branch; treat `staging` as a protected preview |
| 2 | `vercel.json` `installCommand: npm ci` | staging branch overrides it to `npm install` | Staging deploys, but not reproducibly | After the lockfile repair lands on staging, restore `npm ci` |
| 3 | `vercel.json` region `bom1` | project default `iad1` | `vercel.json` wins for functions. No Supabase project is connected, so latency is irrelevant for now | Keep `bom1` for the future Supabase ap-south-1 database |
| 4 | `.env.staging.example` (five public variables) | no environment variables | The preview runs in **demo mode**: no Supabase, no accounts, synthetic fixtures only, `/admin` shows "needs a configured backend". No STAGING banner because `NEXT_PUBLIC_APP_ENV` is unset | This is the safest state for a public-facing preview. If a banner is wanted, set only `NEXT_PUBLIC_APP_ENV=staging` (non-secret). Do not add Supabase keys until the owner decides on a separate staging Supabase project |
| 5 | Dashboard Ignored Build Step `exit 1` | overridden by `vercel.json` | None while `vercel.json` is present | Optionally align the dashboard to the script so the guard survives a `vercel.json` mistake |
| 6 | PR comments | `gitComments.onPullRequest: true` vs `github.silent: true` in `vercel.json` | `silent` suppresses them | None |

## 4. Content safety of the preview
* Without Supabase variables the app serves only the bundled synthetic fixtures (SYN-SKILL, SYN-CASE, SYN-EQ and the demo topics). Learner pages hold no clinical drafts; the leak tests (skills, question bank, cases) pin this.
* The server bundle contains the staff-only draft metadata files (`src/content/draft-*.json`: titles, evidence status, source ids, no body text). They are imported only by `/admin/**` server code, which is unreachable in demo mode and requires a staff session with MFA when a backend is configured. If the owner wants zero draft metadata in public previews, the safest option is to exclude those two files from preview builds (for example via an environment-guarded dynamic import); this has not been done.
* Vercel Authentication (SSO) is on for all deployments, so even the synthetic preview requires a Vercel login.

## 5. Safe synchronization procedure for `staging` (do not execute without approval)
`staging` has history that the development branch does not (`8a73f14`), so a plain push would be rejected, and a force-push would discard the owner's commit. PR #2 is not involved in any option.
1. **Prerequisite on the development branch (done in Phase 11):** lockfile repaired; all CI green on the exact commit chosen.
2. **Option A (recommended): merge the verified development commit into `staging`.** Locally: `git fetch origin; git checkout -B staging-sync origin/staging; git merge --no-ff <DEPLOY_SHA>` (the only conflict expected is `vercel.json`: keep `npm ci`, drop the `npm install` override, keep the owner's formatting if preferred). Run `npm ci && npm run build` locally, then push `staging-sync` to `staging` as a fast-forward. This preserves `8a73f14` in history and never touches `main` or PR #2.
3. **Option B: replace `staging` with `<DEPLOY_SHA>`** (`git push --force-with-lease=staging:8a73f14 origin <DEPLOY_SHA>:refs/heads/staging`). Simpler, but it discards the owner's commit from the branch; owner approval required.
4. After the push Vercel builds only `staging` (ignore script), as a protected preview. Verify: deployment READY, `scripts/smoke.ts` against the preview URL (needs the owner's bypass or a logged-in session because of SSO), the home page shows demo mode, `/admin` shows the backend message, `/en/skills` lists only synthetic samples.
5. Rollback: Vercel "Instant Rollback" to `dpl_HVnFWLpv...` (the last READY staging deployment) or re-point `staging` to `8a73f14`.

## 6. Intended deployment commit
The exact SHA is fixed in the Phase 11 report after the final CI run: it is the tip of `claude/vigilant-mendel-95k63h` whose main CI and isolated Supabase runs are both green. **It has not been deployed.**
