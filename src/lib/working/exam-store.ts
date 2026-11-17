import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface StoredExam { id: string; questionIds: string[]; timeLimitSeconds: number; startedAt: string; submittedAt: string | null; answers: Record<string, number> }

export async function loadExam(id: string): Promise<{ exam: StoredExam; serverNow: string } | null> {
  const db = await createClient();
  if (!db) return null;
  const { data, error } = await db.from("working_exams").select("id,question_ids,time_limit_seconds,started_at,submitted_at,answers").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return { exam: { id: data.id, questionIds: data.question_ids, timeLimitSeconds: data.time_limit_seconds, startedAt: data.started_at, submittedAt: data.submitted_at, answers: data.answers ?? {} }, serverNow: new Date().toISOString() };
}
