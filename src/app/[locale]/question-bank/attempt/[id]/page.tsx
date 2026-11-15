import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Callout } from "@/components/ui/feedback";
import { redirect } from "@/i18n/navigation";
import { requireUser } from "@/lib/auth";
import { getQuestionBankService, resolveMode } from "@/lib/question-bank";
import { QuizRunner } from "@/components/question-bank/quiz-runner";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "QuestionBank" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AttemptPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("QuestionBank");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const mode = resolveMode();
  if (mode === "disabled") notFound();
  if (mode === "database") await requireUser(locale, `/question-bank/attempt/${id}`);
  const svc = await getQuestionBankService().catch(() => null);
  if (!svc) notFound();
  const attempt = await svc.getAttempt(id).catch(() => undefined);
  if (attempt === undefined) return <Callout tone="danger">{t("loadError")}</Callout>;
  if (!attempt || attempt.status === "abandoned") notFound();
  if (attempt.status === "completed") redirect({ href: `/question-bank/attempt/${id}/results`, locale });
  return (
    <div className="space-y-4">
      <h1 className="sr-only">{t(attempt.mode)} — {t("title")}</h1>
      {mode === "fixtures" ? <Callout tone="warning" role="note">{t("fixturesBanner")}</Callout> : null}
      <QuizRunner initial={attempt} locale={locale} />
    </div>
  );
}
