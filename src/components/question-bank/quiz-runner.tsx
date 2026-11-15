"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Bookmark, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, Flag, XCircle } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge, Callout, ProgressBar } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { LText, hasFallback } from "./localized";
import type { AttemptView, ItemView } from "@/lib/question-bank/types";
import {
  setBookmarkAction, setFlagAction, setPositionAction, submitAnswerAction, submitAttemptAction,
} from "@/app/[locale]/question-bank/actions";

const LETTERS: Record<string, string[]> = { en: ["A", "B", "C", "D"], ar: ["أ", "ب", "ج", "د"] };

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
}

export function QuizRunner({ initial, locale }: { initial: AttemptView; locale: string }) {
  const t = useTranslations("QuestionBank");
  const router = useRouter();
  const exam = initial.mode === "exam";
  const total = initial.items.length;

  const [items, setItems] = useState<ItemView[]>(initial.items);
  const [index, setIndex] = useState(() => Math.min(Math.max(initial.last_position, 1), total) - 1);
  const [choices, setChoices] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [live, setLive] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const finishing = useRef(false);

  const item = items[index]!;
  const letters = LETTERS[locale] ?? LETTERS.en!;
  const answeredCount = items.filter((i) => i.selected_option_id !== null).length;
  const flaggedCount = items.filter((i) => i.flagged).length;
  const patch = useCallback((pos: number, p: Partial<ItemView>) => setItems((xs) => xs.map((x) => (x.position === pos ? { ...x, ...p } : x))), []);

  // Move focus to the question heading after navigation so screen-reader users hear the new question.
  useEffect(() => {
    if (mounted.current) headingRef.current?.focus();
    mounted.current = true;
  }, [index]);
  useEffect(() => { if (confirming) confirmRef.current?.focus(); }, [confirming]);

  const goTo = (i: number) => {
    const next = Math.min(Math.max(i, 0), total - 1);
    setError(null);
    setIndex(next);
    void setPositionAction(initial.id, next + 1);
  };

  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    setBusy(true);
    const r = await submitAttemptAction(initial.id);
    if (r.ok || r.code === "conflict") {
      router.push(`/question-bank/attempt/${initial.id}/results`);
      // Watchdog: on a slow or flaky connection the soft (client-side) navigation has been seen to stall after the attempt was already
      // scored. A hard navigation to the same URL always works, so use it if we are still here after a few seconds.
      window.setTimeout(() => {
        if (!window.location.pathname.endsWith("/results")) window.location.assign(`${window.location.pathname.replace(/\/$/, "")}/results`);
      }, 6000);
    } else {
      finishing.current = false;
      setBusy(false);
      setError(r.code === "not_found" ? t("attemptGone") : t("actionError"));
    }
  }, [initial.id, router, t]);

  // Exam timer, anchored to the SERVER clock so a wrong device clock cannot extend or shorten the exam.
  const skew = useMemo(() => Date.parse(initial.server_now) - Date.now(), [initial.server_now]);
  const deadline = initial.expires_at ? Date.parse(initial.expires_at) : null;
  const [remaining, setRemaining] = useState<number | null>(() => (deadline ? (deadline - (Date.now() + skew)) / 1000 : null));
  useEffect(() => {
    if (deadline === null) return;
    const tick = () => {
      const left = (deadline - (Date.now() + skew)) / 1000;
      setRemaining(left);
      if (left <= 0) { setLive(t("timeUp")); void finish(); }
      else if (Math.floor(left) === 300) setLive(t("timeWarning5"));
      else if (Math.floor(left) === 60) setLive(t("timeWarning1"));
    };
    tick();
    const h = setInterval(tick, 1000);
    return () => clearInterval(h);
  }, [deadline, skew, finish, t]);

  async function submitPractice() {
    const choice = choices[item.position];
    if (!choice || busy) return;
    setBusy(true);
    setError(null);
    const r = await submitAnswerAction(initial.id, item.position, choice);
    setBusy(false);
    if (r.ok && r.data.feedback) {
      patch(item.position, { selected_option_id: choice, revealed: true, feedback: r.data.feedback });
      setLive(r.data.feedback.is_correct ? t("correct") : t("incorrect"));
    } else if (!r.ok && r.code === "conflict") router.refresh();
    else setError(t("actionError"));
  }

  async function chooseExam(optionId: string | null) {
    if (busy) return;
    const before = item.selected_option_id;
    patch(item.position, { selected_option_id: optionId });
    setBusy(true);
    setError(null);
    const r = await submitAnswerAction(initial.id, item.position, optionId);
    setBusy(false);
    if (!r.ok) {
      patch(item.position, { selected_option_id: before });
      if (r.code === "conflict") void finish();
      else setError(t("actionError"));
    } else setLive(t("answerSaved"));
  }

  async function toggleFlag() {
    const next = !item.flagged;
    patch(item.position, { flagged: next });
    const r = await setFlagAction(initial.id, item.position, next);
    if (!r.ok) { patch(item.position, { flagged: !next }); setError(t("actionError")); }
  }

  async function toggleBookmark() {
    const next = !item.bookmarked;
    setItems((xs) => xs.map((x) => (x.question_id === item.question_id ? { ...x, bookmarked: next } : x)));
    const r = await setBookmarkAction(item.question_id, next);
    if (!r.ok) { setItems((xs) => xs.map((x) => (x.question_id === item.question_id ? { ...x, bookmarked: !next } : x))); setError(t("actionError")); }
  }

  const revealed = item.revealed && item.feedback;
  const locked = Boolean(revealed) || item.unavailable;
  const selected = item.selected_option_id ?? (exam ? null : choices[item.position] ?? null);
  const last = index === total - 1;
  const lowTime = remaining !== null && remaining <= 300;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-hidden>{t(exam ? "exam" : "practice")}</p>
          {remaining !== null ? (
            <p role="timer" aria-live="off" aria-label={t("timeRemaining")} className={cn("rounded-md border px-3 py-1 font-mono text-lg tabular-nums", lowTime ? "border-danger-foreground/40 bg-danger text-danger-foreground" : "border-border bg-card")}>
              <span className="sr-only">{t("timeRemaining")}: </span>
              <span dir="ltr">{formatClock(remaining)}</span>
            </p>
          ) : null}
        </div>
        <ProgressBar value={(answeredCount / total) * 100} label={t("questionOf", { n: index + 1, total })} />
        <div role="status" aria-live="polite" className="sr-only">{live}</div>

        <article aria-labelledby="qb-q-heading" className="space-y-4 rounded-lg border border-border bg-card p-4 sm:p-6">
          <header className="flex flex-wrap items-center gap-2">
            <h2 id="qb-q-heading" ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {t("questionOf", { n: index + 1, total })}
            </h2>
            {item.synthetic ? <Badge tone="warning">{t("fixturesBadge")}</Badge> : null}
            <Badge>{t("topic")}: <LText value={item.domain_title} locale={locale} className="ms-1" /></Badge>
            <Badge>{t("difficulty")}: {t(`difficulty${item.difficulty}` as "difficulty1")}</Badge>
            {item.flagged ? <Badge tone="warning"><Flag className="me-1 size-3" aria-hidden />{t("navFlagged")}</Badge> : null}
          </header>

          {item.unavailable ? (
            <Callout tone="warning">{t("unavailableQuestion")}</Callout>
          ) : (
            <fieldset className="space-y-3">
              <legend className="mb-3 text-base font-medium leading-relaxed sm:text-lg">
                <LText value={item.stem} locale={locale} />
                {hasFallback(item.stem, locale) ? <span className="mt-1 block text-xs font-normal text-muted-foreground">{t("showingEnglish")}</span> : null}
                <span className="sr-only"> {t("chooseOne")}</span>
              </legend>
              <ul className="space-y-3">
                {item.options.map((o, oi) => {
                  const isSel = selected === o.id;
                  const fb = revealed ? item.feedback! : null;
                  const isCorrect = fb ? o.id === fb.correct_option_id : false;
                  const isWrongPick = fb ? isSel && !isCorrect : false;
                  const expl = fb?.explanations[o.id];
                  return (
                    <li key={o.id}>
                      <label
                        className={cn(
                          "flex min-h-12 gap-3 rounded-md border p-3 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2",
                          !locked && "cursor-pointer hover:bg-muted",
                          isSel && !fb && "border-primary bg-muted ring-2 ring-primary",
                          isCorrect && "border-success-foreground/60 bg-success text-success-foreground",
                          isWrongPick && "border-danger-foreground/60 bg-danger text-danger-foreground",
                          !isSel && !isCorrect && "border-border",
                        )}
                      >
                        <input
                          type="radio"
                          name={`q-${item.position}`}
                          value={o.id}
                          checked={isSel}
                          disabled={locked || busy}
                          onChange={() => (exam ? void chooseExam(o.id) : setChoices((c) => ({ ...c, [item.position]: o.id })))}
                          className="mt-1 size-5 shrink-0"
                        />
                        <span aria-hidden className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-semibold">{letters[oi]}</span>
                        <span className="flex-1">
                          <LText value={o.text} locale={locale} />
                          {fb ? (
                            <span className="mt-2 block space-y-1">
                              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                                {isCorrect ? <><CheckCircle2 className="size-4" aria-hidden />{t("correctAnswer")}</> : null}
                                {isWrongPick ? <><XCircle className="size-4" aria-hidden />{t("yourAnswer")}: {t("incorrect")}</> : null}
                              </span>
                              {expl ? (
                                <span className="block text-sm">
                                  <span className="font-semibold">{isCorrect ? t("whyCorrect") : t("whyWrong")}: </span>
                                  <LText value={expl} locale={locale} />
                                </span>
                              ) : null}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}

          {revealed ? (
            <div role="status" className="space-y-2 rounded-md border border-border bg-muted p-3 text-sm">
              <p className="flex items-center gap-2 font-semibold">
                {item.feedback!.is_correct ? <><CheckCircle2 className="size-5" aria-hidden />{t("correct")}</> : item.selected_option_id ? <><XCircle className="size-5" aria-hidden />{t("incorrect")}</> : <>{t("notAnsweredLabel")}</>}
              </p>
              <p><span className="font-semibold">{t("summary")}: </span><LText value={item.feedback!.rationale} locale={locale} /></p>
              {!exam ? <p className="text-muted-foreground">{t("answerLocked")}</p> : null}
            </div>
          ) : null}

          {error ? <Callout tone="danger">{error}</Callout> : null}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {!exam && !locked ? (
              <Button type="button" onClick={() => void submitPractice()} disabled={!choices[item.position] || busy} aria-busy={busy}>
                {busy ? t("submitting") : t("submitAnswer")}
              </Button>
            ) : null}
            {exam && !locked && item.selected_option_id ? (
              <Button type="button" variant="ghost" onClick={() => void chooseExam(null)} disabled={busy}>{t("clearAnswer")}</Button>
            ) : null}
            <Button type="button" variant="outline" aria-pressed={item.flagged} onClick={() => void toggleFlag()}>
              <Flag className="size-4" aria-hidden />{item.flagged ? t("unflag") : t("flag")}
            </Button>
            <Button type="button" variant="outline" aria-pressed={item.bookmarked} onClick={() => void toggleBookmark()}>
              {item.bookmarked ? <BookmarkCheck className="size-4" aria-hidden /> : <Bookmark className="size-4" aria-hidden />}
              {item.bookmarked ? t("unbookmark") : t("bookmark")}
            </Button>
          </div>
        </article>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => goTo(index - 1)} disabled={index === 0}>
            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden />{t("previous")}
          </Button>
          <div className="flex flex-wrap gap-2">
            {!last ? (
              <Button type="button" onClick={() => goTo(index + 1)}>{t("next")}<ChevronRight className="size-4 rtl:rotate-180" aria-hidden /></Button>
            ) : null}
            <Button type="button" variant={last ? "default" : "outline"} onClick={() => setConfirming(true)} disabled={busy}>
              {exam ? t("submitExam") : t("finish")}
            </Button>
          </div>
        </div>

        {confirming ? (
          <div ref={confirmRef} tabIndex={-1} role="alertdialog" aria-labelledby="qb-confirm-h" aria-describedby="qb-confirm-d" className="space-y-3 rounded-lg border-2 border-primary bg-card p-4 outline-none">
            <h2 id="qb-confirm-h" className="text-lg font-semibold">{t("confirmTitle")}</h2>
            <div id="qb-confirm-d" className="space-y-1 text-sm">
              <p>{t("confirmUnanswered", { n: total - answeredCount })}</p>
              {flaggedCount ? <p>{t("confirmFlagged", { n: flaggedCount })}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => void finish()} disabled={busy} aria-busy={busy}>{t("confirmSubmit")}</Button>
              <Button type="button" variant="outline" onClick={() => { setConfirming(false); headingRef.current?.focus(); }}>{t("keepWorking")}</Button>
            </div>
          </div>
        ) : null}
      </div>

      <nav aria-label={t("navigator")} className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <h2 className="text-sm font-semibold">{t("navigator")}</h2>
        <ol className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-4">
          {items.map((x, i) => {
            const state = [x.selected_option_id ? t("navAnswered") : t("navUnanswered"), x.flagged ? t("navFlagged") : null, i === index ? t("navCurrent") : null].filter(Boolean).join(", ");
            return (
              <li key={x.position}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${t("questionOf", { n: i + 1, total })}: ${state}`}
                  aria-current={i === index ? "step" : undefined}
                  className={cn(
                    "relative inline-flex min-h-11 w-full items-center justify-center rounded-md border text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    x.selected_option_id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                    i === index && "ring-2 ring-ring ring-offset-2",
                  )}
                >
                  {i + 1}
                  {x.flagged ? <Flag className="absolute end-0.5 top-0.5 size-3" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="text-xs text-muted-foreground">{answeredCount}/{total} · <Flag className="inline size-3" aria-hidden /> {flaggedCount}</p>
      </nav>
    </div>
  );
}
