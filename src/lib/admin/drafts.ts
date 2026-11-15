import "server-only";
import index from "@/content/draft-index.json";
import history from "@/content/draft-history.json";
import type { DraftHistory, DraftIndex, IndexEntry, IndexSource } from "../../../scripts/build-draft-index";

/** Staff-only view of the unpublished drafts' METADATA. Only admin code may import this module (enforced by a unit test). */
export const DRAFTS = index as unknown as DraftIndex;
export const HISTORY = history as unknown as DraftHistory;
export * from "./drafts-core";
export type { IndexEntry, IndexSource };
