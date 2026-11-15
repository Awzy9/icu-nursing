"use client";
import { startTransition, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form";
import { deleteAccountAction, type DeletionState } from "@/app/[locale]/account/delete/actions";

export interface DeletionLabels { email: string; emailHint: string; understand: string; submit: string; confirmQuestion: string; errors: Record<string, string> }

export function DeleteAccountForm({ labels }: { labels: DeletionLabels }) {
  const [state, action, pending] = useActionState<DeletionState, FormData>(deleteAccountAction, {});
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!window.confirm(labels.confirmQuestion)) return;
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      {state.error ? <Callout tone="danger" role="alert">{labels.errors[state.error] ?? labels.errors.generic}</Callout> : null}
      <Field label={labels.email} htmlFor="del-email" hint={labels.emailHint}>
        <Input id="del-email" name="email" type="email" autoComplete="off" required dir="ltr" />
      </Field>
      <label className="flex min-h-11 items-start gap-3">
        <input type="checkbox" name="understand" className="mt-1 size-5" required />
        <span>{labels.understand}</span>
      </label>
      <Button type="submit" variant="danger" disabled={pending}>{labels.submit}</Button>
    </form>
  );
}
