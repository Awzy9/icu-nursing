"use client";
import { useActionState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import type { AdminState } from "@/app/[locale]/admin/actions";

type Action = (prev: AdminState, form: FormData) => Promise<AdminState>;

/** Generic staff form: shows the database's own (authorisation / validation) message on failure. */
export function AdminForm({ action, submit, variant, children, className, confirm }: { action: Action; submit: string; variant?: ButtonProps["variant"]; children?: React.ReactNode; className?: string; confirm?: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      className={className ?? "space-y-3"}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {state.error ? <Callout tone="danger" role="alert">{state.error}</Callout> : null}
      {state.ok && state.message ? <Callout tone="success" role="status">{state.message}</Callout> : null}
      {children}
      <Button type="submit" variant={variant} disabled={pending}>{submit}</Button>
    </form>
  );
}
