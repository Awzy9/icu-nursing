"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { workingEditionEnabled } from "@/lib/working";
import { allExamQuestions, pickExamQuestions } from "@/lib/working/exam-source";
import { timeLimitSecondsFor, COUNT_PRESETS } from "@/lib/working/exam";
import { newSeed } from "@/lib/question-bank/shuffle";
import { rateLimit } from "@/lib/rate-limit";

async function account() { if (!workingEditionEnabled()) throw Error("Learning edition unavailable"); const db = await createClient(); if (!db) throw Error("Please sign in"); const { data, error } = await db.auth.getUser(); if (error || !data.user) throw Error("Please sign in again"); return { db, user: data.user }; }

const startSchema = z.object({ categories: z.array(z.string().min(1).max(200)).min(1).max(30), count: z.number().int().refine((n) => (COUNT_PRESETS as readonly number[]).includes(n)) });
export async function startExam(input: unknown) {
  try {
    const value = startSchema.parse(input);
    const { db, user } = await account();
    if (!rateLimit(`working-exam-start:${user.id}`, 20)) return { ok: false as const, error: "Please wait a moment before trying again." };
    const pool = allExamQuestions();
    const picked = pickExamQuestions(pool, value.categories, value.count, newSeed());
    if (picked.length === 0) return { ok: false as const, error: "No questions are available for the topics you chose." };
    const timeLimitSeconds = timeLimitSecondsFor(picked.length);
    const { data, error } = await db.rpc("working_exam_start", { p_question_ids: picked.map((q) => q.id), p_time_limit_seconds: timeLimitSeconds });
    if (error) throw error;
    return { ok: true as const, id: data as string };
  } catch { return { ok: false as const, error: "Could not start the exam. Please retry." }; }
}

const answerSchema = z.object({ examId: z.string().uuid(), questionId: z.string().min(1).max(60), choice: z.number().int().min(0).max(3) });
export async function answerExam(input: unknown) {
  try {
    const value = answerSchema.parse(input);
    const { db, user } = await account();
    if (!rateLimit(`working-exam-answer:${user.id}`, 120)) return { ok: false as const, error: "Please wait a moment before trying again." };
    const { error } = await db.rpc("working_exam_answer", { p_exam_id: value.examId, p_question_id: value.questionId, p_choice: value.choice });
    if (error) throw error;
    return { ok: true as const };
  } catch { return { ok: false as const, error: "Could not save your answer. Please retry." }; }
}

const submitSchema = z.object({ examId: z.string().uuid() });
export async function submitExam(input: unknown) {
  try {
    const value = submitSchema.parse(input);
    const { db } = await account();
    const { error } = await db.rpc("working_exam_submit", { p_exam_id: value.examId });
    if (error) throw error;
    return { ok: true as const };
  } catch { return { ok: false as const, error: "Could not submit the exam. Please retry." }; }
}
