import type { ContentRepository } from "./types";

// Implemented in Batch 3 (requires the content schema migration).
const notReady = () => Promise.reject(new Error("Supabase content repository is not implemented yet"));
export const supabaseRepository: ContentRepository = { listDomains: notReady, listTopics: notReady, getTopic: notReady };
