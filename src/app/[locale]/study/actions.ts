"use server";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getActorKey, getQuestionBankService } from "@/lib/question-bank";
import { QuestionBankError, REVISION_KINDS } from "@/lib/question-bank/types";
import { rateLimit } from "@/lib/rate-limit";

const input = z.object({ kind: z.enum(REVISION_KINDS), count: z.number().int().min(1).max(50).default(10) });

/** Starts a revision set and sends the learner into it (revalidate + redirect issued by the action; see question-bank/actions.ts). */
export async function startRevisionAction(raw: unknown): Promise<{ ok: false; code: string; error: string } | undefined> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid", error: "That request is not valid." };
  const svc = await getQuestionBankService({ create: true }).catch(() => null);
  if (!svc) return { ok: false, code: "auth", error: "Sign in to use study mode." };
  if (!rateLimit(`st-start:${await getActorKey()}`, 30, 60_000)) return { ok: false, code: "limit", error: "Too many requests. Please wait a moment." };
  let id: string;
  try {
    id = await svc.startRevision(parsed.data.kind, parsed.data.count);
  } catch (e) {
    if (e instanceof QuestionBankError) return { ok: false, code: e.code, error: e.message };
    return { ok: false, code: "unavailable", error: "Study mode is temporarily unavailable." };
  }
  revalidatePath("/", "layout");
  redirect({ href: `/question-bank/attempt/${id}`, locale: await getLocale() });
}
