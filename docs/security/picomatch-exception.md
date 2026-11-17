# Temporary production audit exception: picomatch

- Advisory: GHSA-fc5q-39xc-vjpf / CVE-2026-112366 (high, ReDoS from repeated extglob patterns)
- Expires: **2026-12-01**. The CI audit must fail after this date unless the vulnerability is resolved and this exception is removed.
- Dependency chain observed: `next-intl@4.15.1 -> @parcel/watcher@2.6.0 -> picomatch@4.0.7`.
- Background: next-intl's upstream issue https://github.com/amannn/next-intl/issues/2255 describes `@parcel/watcher` as used by the translation extraction feature, yet declared as a regular production dependency.
- Risk: This is a *potentially* unreachable code path for the deployed website, **not a confirmed absence of risk**. A maintainer must establish whether translation extraction or attacker-controlled watcher glob patterns are reachable in deployed server execution before accepting the exception.
- Compensating controls: no attacker-controlled glob patterns should be passed to the watcher; production audit still runs and must fail on every additional high/critical advisory, a changed dependency chain, or expiry.
- Exit: remove `scripts/audit-production.mjs` and restore `npm audit --omit=dev --audit-level=high` as soon as a patched package or upstream dependency change becomes available. Revisit within 14 days of this assessment.
- Before merge: validate the audit script locally and in GitHub Actions, inspect npm audit JSON and deployed import graph, and approve the exception explicitly. No clinical draft content is changed.

This is a tracked short-lived risk acceptance proposal, **not a vulnerability fix**.
