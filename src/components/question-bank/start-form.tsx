"use client";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { localize } from "@/lib/content/localize";
import type { Localized } from "@/lib/question-bank/types";
import { startAttemptAction } from "@/app/[locale]/question-bank/actions";

export interface DomainOption { slug: string; title: Localized; available: number }

const COUNTS = [3, 5, 10, 20, 40];
const LIMITS = [0, 10, 20, 30, 60];

export function StartForm({ domains, bookmarked, totalAvailable }: { domains: DomainOption[]; bookmarked: number; totalAvailable: number }) {
  const t = useTranslations("QuestionBank");
  const locale = useLocale();
  const [mode, setMode] = useState<"practice" | "exam">("practice");
  const [selected, setSelected] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [limit, setLimit] = useState(0);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = (slug: string) => setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await startAttemptAction({ mode, count, domains: selected, timeLimitMinutes: mode === "exam" && limit > 0 ? limit : null, bookmarkedOnly });
      if (r && !r.ok) setError(r.error); // success redirects from the server
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6" aria-describedby={error ? "start-error" : undefined}>
      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-semibold">{t("modeLegend")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["practice", "exam"] as const).map((m) => (
            <label key={m} className="flex cursor-pointer gap-3 rounded-md border border-border bg-card p-3 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2">
              <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="mt-1 size-4 shrink-0" />
              <span>
                <span className="block font-medium">{t(m)}</span>
                <span className="block text-sm text-muted-foreground">{t(`${m}Help`)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-semibold">{t("domainsLegend")}</legend>
        <ul className="grid gap-2 sm:grid-cols-2">
          {domains.map((d) => (
            <li key={d.slug}>
              <label className={`flex min-h-11 items-center gap-3 rounded-md border border-border px-3 py-2 ${d.available ? "cursor-pointer bg-card" : "bg-muted text-muted-foreground"}`}>
                <input type="checkbox" checked={selected.includes(d.slug)} disabled={!d.available} onChange={() => toggle(d.slug)} className="size-4 shrink-0" />
                <span className="flex-1">{localize(d.title, locale)}</span>
                <span className="text-xs text-muted-foreground">{d.available ? t("domainAvailable", { n: d.available }) : t("domainNone")}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="qb-count" className="text-sm font-semibold">{t("countLabel")}</label>
          <select id="qb-count" value={count} onChange={(e) => setCount(Number(e.target.value))} className="block min-h-11 w-full rounded-md border border-input bg-card px-3">
            {COUNTS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">{t("countHelp")}</p>
        </div>
        <div className="space-y-1">
          <label htmlFor="qb-limit" className="text-sm font-semibold">{t("timeLimitLabel")}</label>
          <select id="qb-limit" value={limit} disabled={mode !== "exam"} onChange={(e) => setLimit(Number(e.target.value))} className="block min-h-11 w-full rounded-md border border-input bg-card px-3 disabled:opacity-60">
            {LIMITS.map((l) => <option key={l} value={l}>{l === 0 ? t("noLimit") : t("minutes", { n: l })}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">{t("timeLimitHelp")}</p>
        </div>
      </div>

      {bookmarked > 0 ? (
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input type="checkbox" checked={bookmarkedOnly} onChange={(e) => setBookmarkedOnly(e.target.checked)} className="size-4" />
          <span>{t("bookmarkedOnly", { n: bookmarked })}</span>
        </label>
      ) : null}

      {error ? <div id="start-error"><Callout tone="danger">{error}</Callout></div> : null}

      <Button type="submit" size="lg" disabled={pending || totalAvailable === 0} aria-busy={pending}>
        {pending ? t("starting") : mode === "exam" ? t("startExam") : t("startPractice")}
      </Button>
    </form>
  );
}
