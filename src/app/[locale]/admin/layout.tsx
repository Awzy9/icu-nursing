import { setRequestLocale } from "next-intl/server";
import { Callout } from "@/components/ui/feedback";
import { Link } from "@/i18n/navigation";
import { requireStaff } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (isDemoMode()) return <Callout tone="warning">The administration area needs a configured backend. The app is running in demonstration mode.</Callout>;
  const { roles } = await requireStaff(locale);
  const links = [
    { href: "/admin", label: "Overview" }, { href: "/admin/topics", label: "Topics" }, { href: "/admin/sources", label: "Sources" },
    ...(roles.includes("admin") ? [{ href: "/admin/users", label: "Users and roles" }] : []),
  ];
  return (
    <div className="space-y-6">
      <nav aria-label="Administration" className="flex flex-wrap gap-1 border-b border-border pb-2">
        {links.map((l) => <Link key={l.href} href={l.href} className="inline-flex min-h-11 items-center rounded-md px-3 text-foreground no-underline hover:bg-muted">{l.label}</Link>)}
        <span className="ms-auto self-center text-sm text-muted-foreground">Roles: {roles.join(", ")}</span>
      </nav>
      <p className="text-xs text-muted-foreground">Staff interface (English). Content fields accept English and Arabic.</p>
      {children}
    </div>
  );
}
