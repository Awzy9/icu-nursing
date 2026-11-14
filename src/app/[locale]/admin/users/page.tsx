import { setRequestLocale } from "next-intl/server";
import { AdminForm } from "@/components/admin/admin-form";
import { ADMIN_ROLES, CODE_LABELS, REVIEW_CODES } from "@/components/admin/ui";
import { Field, Select } from "@/components/ui/form";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { grantRoleAction, revokeRoleAction, setSpecialtyAction } from "../actions";

interface P { id: string; email: string | null; display_name: string | null }

export default async function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireStaff(locale, ["admin"]);
  const db = (await createClient())!;
  const [{ data: profiles }, { data: roles }, { data: specs }] = await Promise.all([
    db.from("profiles").select("id, email, display_name").order("created_at", { ascending: false }).limit(200),
    db.from("user_roles").select("user_id, role"),
    db.from("reviewer_specialties").select("user_id, specialty"),
  ]);
  const people = (profiles ?? []) as unknown as P[];
  const rolesOf = (id: string) => ((roles ?? []) as unknown as { user_id: string; role: string }[]).filter((r) => r.user_id === id).map((r) => r.role);
  const specsOf = (id: string) => ((specs ?? []) as unknown as { user_id: string; specialty: string }[]).filter((r) => r.user_id === id).map((r) => r.specialty);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Users and roles</h1>
      <p className="text-muted-foreground">Staff roles only take effect for sessions that completed two-factor authentication. Reviewer specialties map to the clinical reviewer matrix.</p>
      <ul className="divide-y divide-border border-y border-border">
        {people.map((p) => {
          const r = rolesOf(p.id);
          const sp = specsOf(p.id);
          return (
            <li key={p.id} className="space-y-2 py-3">
              <p><b>{p.display_name ?? "(no name)"}</b> <span className="text-sm text-muted-foreground">{p.email}</span></p>
              <p className="text-sm">Roles: {r.join(", ")} · Specialties: {sp.join(", ") || "—"}</p>
              <div className="flex flex-wrap gap-4">
                <AdminForm action={grantRoleAction} submit="Grant" className="flex items-end gap-2"><input type="hidden" name="userId" value={p.id} /><Field label="Role" htmlFor={`g-${p.id}`}><Select id={`g-${p.id}`} name="role">{ADMIN_ROLES.filter((x) => !r.includes(x)).map((x) => <option key={x}>{x}</option>)}</Select></Field></AdminForm>
                <AdminForm action={revokeRoleAction} submit="Revoke" variant="outline" confirm="Revoke this role?" className="flex items-end gap-2"><input type="hidden" name="userId" value={p.id} /><Field label="Role" htmlFor={`r-${p.id}`}><Select id={`r-${p.id}`} name="role">{ADMIN_ROLES.filter((x) => r.includes(x)).map((x) => <option key={x}>{x}</option>)}</Select></Field></AdminForm>
                {r.includes("clinical_reviewer") ? (
                  <AdminForm action={setSpecialtyAction} submit="Set specialty" variant="outline" className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="userId" value={p.id} />
                    <Field label="Specialty" htmlFor={`s-${p.id}`}><Select id={`s-${p.id}`} name="specialty">{REVIEW_CODES.map((c) => <option key={c} value={c}>{c} — {CODE_LABELS[c]}</option>)}</Select></Field>
                    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="enabled" defaultChecked className="size-5" /> enabled</label>
                  </AdminForm>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
