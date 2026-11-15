import { setRequestLocale } from "next-intl/server";
import { AdminForm } from "@/components/admin/admin-form";
import { Callout } from "@/components/ui/feedback";
import { Field, Input, Select } from "@/components/ui/form";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setSubscriptionAction } from "../actions";

export const dynamic = "force-dynamic";
interface Row { user_id: string; email: string; plan: string; status: string; period_end: string; cancel_at_period_end: boolean; provider: string }

/** Administrator view of subscriptions. Mock records only: the database refuses every change unless mock payments are switched on for a development database. */
export default async function SubscriptionsAdmin({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const { locale } = await params; const { q } = await searchParams;
  setRequestLocale(locale);
  await requireStaff(locale, ["admin"]);
  const db = (await createClient())!;
  const { data, error } = await db.rpc("adm_sub_list", { p_query: q ?? null });
  const rows = (error ? [] : (data as Row[])) ?? [];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Subscriptions</h1>
      <Callout tone="warning" role="note">TEST RECORDS ONLY. No payment provider has been chosen and nothing is charged. Subscriptions never grant access to unpublished content: they only switch capacity and convenience features. Every change needs a written reason and is audited.</Callout>
      {error ? <Callout tone="danger">{error.message}</Callout> : null}
      <form method="get" className="flex flex-wrap items-end gap-2" role="search">
        <Field label="Find by email" htmlFor="q"><Input id="q" name="q" defaultValue={q ?? ""} maxLength={80} /></Field>
        <button type="submit" className="inline-flex min-h-11 items-center rounded-md border border-input bg-card px-4 text-sm font-medium">Search</button>
      </form>
      {rows.length === 0 ? <p className="text-muted-foreground">No subscriptions found.</p> : (
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((r) => (
            <li key={r.user_id} className="space-y-2 py-3">
              <p><b>{r.email}</b> <span className="text-sm text-muted-foreground">{r.plan} · {r.status} · until {new Date(r.period_end).toISOString().slice(0, 10)}{r.cancel_at_period_end ? " · cancels at period end" : ""} · {r.provider}</span></p>
              <AdminForm action={setSubscriptionAction} submit="Apply" variant="outline" className="flex flex-wrap items-end gap-2" confirm="Apply this change to a test subscription?">
                <input type="hidden" name="userId" value={r.user_id} />
                <Field label="Plan" htmlFor={`p-${r.user_id}`}><Select id={`p-${r.user_id}`} name="plan" defaultValue={r.plan}><option value="premium">premium</option><option value="free">free</option></Select></Field>
                <Field label="Status" htmlFor={`s-${r.user_id}`}><Select id={`s-${r.user_id}`} name="status" defaultValue={r.status}>{["active", "trialing", "past_due", "canceled", "expired"].map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
                <Field label="Days" htmlFor={`d-${r.user_id}`}><Input id={`d-${r.user_id}`} name="days" type="number" min={1} max={400} defaultValue={30} /></Field>
                <Field label="Reason (required)" htmlFor={`r-${r.user_id}`}><Input id={`r-${r.user_id}`} name="reason" required minLength={5} maxLength={300} /></Field>
              </AdminForm>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
