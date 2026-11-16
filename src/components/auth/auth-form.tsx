"use client";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import type { FormState } from "@/app/[locale]/(auth)/actions";
import { Turnstile } from "./turnstile";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

/** Keeps what the person typed when the server rejects the form, but always clears password fields after a failure. */
export function AuthForm({ action, submitLabel, children, successMessage, hidden, captcha = false }: { action: Action; submitLabel: string; children: React.ReactNode; successMessage?: string; hidden?: Record<string, string>; captcha?: boolean }) {
  const t = useTranslations("Auth.errors");
  const label = useTranslations("Auth")("captchaLabel");
  const siteKey = captcha ? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY : undefined;
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.error) ref.current?.querySelectorAll<HTMLInputElement>('input[type="password"]').forEach((i) => { i.value = ""; });
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form
      ref={ref}
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {state.error ? <Callout tone="danger" role="alert">{t(state.error)}</Callout> : null}
      {state.ok && successMessage ? <Callout tone="success" role="status">{successMessage}</Callout> : null}
      {children}
      <Turnstile siteKey={siteKey} resetKey={state} label={label} />
      <Button type="submit" disabled={pending} className="w-full">{submitLabel}</Button>
    </form>
  );
}
