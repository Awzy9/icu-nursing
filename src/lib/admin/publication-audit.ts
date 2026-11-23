import draftIndex from "@/content/draft-index.json";
import type { ReviewIndex } from "@/lib/working/publication-policy";

// Server-side/build-tool-only helper: avoid the Next.js server-only sentinel here
// because the standalone tsx content builder invokes the same publication gate.
// Only server routes, server components, and build scripts import this module.
// Staff draft metadata is never returned by the
// public catalog or clinical-content endpoints. Publication code only checks
// per-entry review, evidence and hash predicates; it does not expose this index.
export function publicationReviewIndex(): ReviewIndex {
  return draftIndex as ReviewIndex;
}
