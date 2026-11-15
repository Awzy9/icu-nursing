import { z } from "zod";
import { QuestionBankError } from "./question-bank";

export { QuestionBankError as EquipmentError };

/** Per-learner equipment learning state: bookmarked module codes and the diagram parts the learner has viewed. */
export const equipmentStateSchema = z.object({
  fixtures: z.boolean(),
  bookmarks: z.array(z.string().regex(/^SYN-EQ-\d{3}$/)).max(50),
  viewed: z.record(z.string().regex(/^SYN-EQ-\d{3}$/), z.array(z.string().regex(/^[a-z]{1,24}$/)).max(8)),
});
export type EquipmentState = z.infer<typeof equipmentStateSchema>;
export const EMPTY_STATE: EquipmentState = { fixtures: false, bookmarks: [], viewed: {} };

export interface EquipmentStateService {
  readonly mode: "database" | "fixtures";
  get(): Promise<EquipmentState>;
  setBookmark(code: string, on: boolean): Promise<void>;
  markViewed(code: string, part: string): Promise<void>;
  resetProgress(code: string): Promise<void>;
}
