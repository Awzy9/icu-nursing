"use client";
import { startTransition, useActionState, useEffect, useRef } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Callout } from "@/components/ui/feedback";
import type { AdminState } from "@/app/[locale]/admin/actions";

type Action = (prev: AdminState, form: FormData) => Promise<AdminState>;

/**
 * Generic staff form: shows the database's own (authorisation / validation) message on failure.
 * The form is submitted programmatically so React does not wipe what the person typed when the server says no;
 * it is reset only after a successful save.
 */
export function AdminForm({ action, submit, variant, children, className, confirm }: { action: Action; submit: string; variant?: ButtonProps["variant"]; children?: React.ReactNode; className?: string; confirm?: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form
      ref={ref}
      className={className ?? "space-y-3"}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      {state.error ? <Callout tone="danger" role="alert">{state.error}</Callout> : null}
      {state.ok && state.message ? <Callout tone="success" role="status">{state.message}</Callout> : null}
      {children}
      <Button type="submit" variant={variant} disabled={pending}>{submit}</Button>
    </form>
  );
}
