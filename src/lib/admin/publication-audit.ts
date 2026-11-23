import "server-only";
import draftIndex from "@/content/draft-index.json";
import type { ReviewIndex } from "@/lib/working/publication-policy";

// Deliberate server-only boundary: staff draft metadata is never returned by the
// public catalog or clinical-content endpoints. Publication code only checks
// per-entry review, evidence and hash predicates; it does not expose this index.
export function publicationReviewIndex(): ReviewIndex {
  return draftIndex as ReviewIndex;
}
