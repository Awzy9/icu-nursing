"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { advanceAction, cancelAction, resumeAction, subscribeAction } from "@/app/[locale]/account/billing/actions";
import type { BillingActionState } from "@/app/[locale]/account/billing/actions";

const none: BillingActionState = {};
/** Subscription controls. Every action goes to a server action that talks to the mock provider; confirmation of cancellation is asked in words, never assumed. */
export function BillingPanel({ premium, status, cancelAtPeriodEnd, mockTools }: { premium: boolean; status: string; cancelAtPeriodEnd: boolean; mockTools: boolean }) {
  const t = useTranslations("Billing");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<BillingActionState>(none);
  const [trial, setTrial] = useState(false);
  const [days, setDays] = useState("31");
  const [fails, setFails] = useState(false);
  const live = premium && ["trialing", "active", "past_due"].includes(status);
  const run = (fn: () => Promise<BillingActionState>) => start(async () => { const r = await fn(); setMsg(r); if (r.ok) router.refresh(); });
  const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) if (v) f.set(k, v); return f; };
  return (
    <div className="space-y-4">
      <div role="status" aria-live="polite">{msg.error ? <Callout tone="danger" role="alert">{t(`errors.${msg.error}`)}</Callout> : msg.ok ? <p className="text-sm">{t("done")}</p> : null}</div>
      {!live ? (
        <div className="space-y-3">
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" className="size-5" checked={trial} onChange={(e) => setTrial(e.target.checked)} />{t("trial")}</label>
          <Button type="button" disabled={pending} onClick={() => run(() => subscribeAction(none, fd({ plan: "premium", trial: trial ? "on" : "" })))}>{t("subscribe")}</Button>
        </div>
      ) : cancelAtPeriodEnd ? (
        <Button type="button" variant="outline" disabled={pending} onClick={() => run(() => resumeAction())}>{t("resume")}</Button>
      ) : (
        <Button type="button" variant="outline" disabled={pending} onClick={() => { if (window.confirm(t("confirmCancel"))) run(() => cancelAction()); }}>{t("cancel")}</Button>
      )}
      {mockTools && live ? (
        <fieldset className="space-y-3 rounded-lg border border-dashed border-border p-4">
          <legend className="px-1 font-medium">{t("testTools")}</legend>
          <p className="text-sm text-muted-foreground">{t("testToolsHelp")}</p>
          <label className="flex flex-wrap items-center gap-2">{t("days")}
            <input inputMode="numeric" pattern="[0-9]*" className="min-h-11 w-24 rounded-md border border-input bg-card px-2" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, "").slice(0, 3))} />
          </label>
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" className="size-5" checked={fails} onChange={(e) => setFails(e.target.checked)} />{t("fails")}</label>
          <Button type="button" variant="outline" disabled={pending || !days} onClick={() => run(() => advanceAction(none, fd({ days, fails: fails ? "on" : "" })))}>{t("advance")}</Button>
        </fieldset>
      ) : null}
    </div>
  );
}
