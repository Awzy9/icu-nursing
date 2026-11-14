"use client";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import type { FormState } from "@/app/[locale]/(auth)/actions";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

export function AuthForm({ action, submitLabel, children, successMessage, hidden }: { action: Action; submitLabel: string; children: React.ReactNode; successMessage?: string; hidden?: Record<string, string> }) {
  const t = useTranslations("Auth.errors");
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {state.error ? <Callout tone="danger" role="alert">{t(state.error)}</Callout> : null}
      {state.ok && successMessage ? <Callout tone="success" role="status">{successMessage}</Callout> : null}
      {children}
      <Button type="submit" disabled={pending} className="w-full">{submitLabel}</Button>
    </form>
  );
}
