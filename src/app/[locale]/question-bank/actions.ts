"use server";
// Navigation after an action is issued BY the action (revalidatePath + redirect, the documented Next.js pattern). A client-side
// router.push after the action raced with the route's own re-render and occasionally stalled (3 of 14 headless runs; 0 of 42 after).
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getActorKey, getQuestionBankService } from "@/lib/question-bank";
import { QuestionBankError, startInputSchema, type AnswerResult } from "@/lib/question-bank/types";
import { rateLimit } from "@/lib/rate-limit";

export type ActionResult<T = Record<string, never>> = ({ ok: true } & T) | { ok: false; code: string; error: string };

const uuid = z.string().uuid();
const position = z.number().int().min(1).max(100);

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<{ data: T }>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof QuestionBankError) return { ok: false, code: e.code, error: e.message };
    return { ok: false, code: "unavailable", error: "The question bank is temporarily unavailable." };
  }
}

const bad = (): ActionResult<{ data: never }> => ({ ok: false, code: "invalid", error: "That request is not valid." });

export async function startAttemptAction(input: unknown): Promise<ActionResult<{ data: never }>> {
  const parsed = startInputSchema.safeParse(input);
  if (!parsed.success) return bad();
  const svc = await getQuestionBankService({ create: true }).catch(() => null);
  if (!svc) return { ok: false, code: "auth", error: "Sign in to use the question bank." };
  if (!rateLimit(`qb-start:${await getActorKey()}`, 30, 60_000)) return { ok: false, code: "limit", error: "Too many requests. Please wait a moment." };
  const r = await run(() => svc.startAttempt(parsed.data));
  if (r.ok) {
    revalidatePath("/", "layout");
    redirect({ href: `/question-bank/attempt/${r.data}`, locale: await getLocale() });
  }
  return r as ActionResult<{ data: never }>;
}

export async function submitAnswerAction(attemptId: string, pos: number, optionId: string | null): Promise<ActionResult<{ data: AnswerResult }>> {
  if (!uuid.safeParse(attemptId).success || !position.safeParse(pos).success || (optionId !== null && !uuid.safeParse(optionId).success)) return bad();
  const svc = await getQuestionBankService({ create: true }).catch(() => null);
  if (!svc) return { ok: false, code: "auth", error: "Sign in to use the question bank." };
  return run(() => svc.submitAnswer(attemptId, pos, optionId));
}

export async function setFlagAction(attemptId: string, pos: number, flagged: boolean): Promise<ActionResult<{ data: void }>> {
  if (!uuid.safeParse(attemptId).success || !position.safeParse(pos).success) return bad();
  const svc = await getQuestionBankService({ create: true }).catch(() => null);
  if (!svc) return { ok: false, code: "auth", error: "Sign in to use the question bank." };
  return run(() => svc.setFlag(attemptId, pos, Boolean(flagged)));
}

export async function setPositionAction(attemptId: string, pos: number): Promise<ActionResult<{ data: void }>> {
  if (!uuid.safeParse(attemptId).success || !position.safeParse(pos).success) return bad();
  const svc = await getQuestionBankService({ create: true }).catch(() => null);
  if (!svc) return { ok: false, code: "auth", error: "Sign in to use the question bank." };
  return run(() => svc.setPosition(attemptId, pos));
}

export async function setBookmarkAction(questionId: string, bookmarked: boolean): Promise<ActionResult<{ data: void }>> {
  if (!uuid.safeParse(questionId).success) return bad();
  const svc = await getQuestionBankService({ create: true }).catch(() => null);
  if (!svc) return { ok: false, code: "auth", error: "Sign in to use the question bank." };
  return run(() => svc.setBookmark(questionId, Boolean(bookmarked)));
}

/**
 * Finishes an attempt and sends the learner to the results. The redirect is issued HERE (by Next.js, as part of the action's own
 * response) rather than by a client-side router.push after the action: pairing the two raced with the route's own re-render and
 * occasionally left the page on the old URL (reproduced in 3 of 14 headless runs; 0 of 42 after this change).
 */
export async function submitAttemptAction(attemptId: string): Promise<ActionResult<{ data: never }>> {
  if (!uuid.safeParse(attemptId).success) return bad();
  const svc = await getQuestionBankService({ create: true }).catch(() => null);
  if (!svc) return { ok: false, code: "auth", error: "Sign in to use the question bank." };
  const r = await run(async () => (await svc.submitAttempt(attemptId)).status);
  if (r.ok || r.code === "conflict") revalidatePath("/", "layout");
  if (r.ok || r.code === "conflict") redirect({ href: `/question-bank/attempt/${attemptId}/results`, locale: await getLocale() });
  return r as ActionResult<{ data: never }>;
}

export async function discardAttemptAction(attemptId: string): Promise<ActionResult<{ data: void }>> {
  if (!uuid.safeParse(attemptId).success) return bad();
  const svc = await getQuestionBankService({ create: true }).catch(() => null);
  if (!svc) return { ok: false, code: "auth", error: "Sign in to use the question bank." };
  const r = await run(() => svc.discardAttempt(attemptId));
  if (r.ok) revalidatePath("/", "layout");
  return r;
}
