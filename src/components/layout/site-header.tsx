import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { NavLink as ActiveLink } from "./nav-link";
import { getRoles, getSessionUser, STAFF_ROLES } from "@/lib/auth";
import { signOutAction } from "@/app/[locale]/(auth)/actions";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav, type NavLink } from "./mobile-nav";
import { FUTURE_FEATURES } from "./nav-items";

export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const brand = await getTranslations("Common");
  const user = await getSessionUser();
  const roles = user ? await getRoles(user.id) : [];
  const isStaff = roles.some((r) => STAFF_ROLES.includes(r));

  const primary: NavLink[] = [{ href: "/library", label: t("library") }, { href: "/learn", label: t("learn") }, { href: "/question-bank", label: t("questionBank") }, { href: "/study", label: t("study") }, { href: "/cases", label: t("cases") }, { href: "/skills", label: t("skills") }, { href: "/equipment", label: t("equipment") }, { href: "/medications", label: t("medications") }];
  if (user) primary.push({ href: "/dashboard", label: t("dashboard") }, { href: "/bookmarks", label: t("bookmarks") });
  if (isStaff) primary.push({ href: "/admin", label: t("admin") });
  const future: NavLink[] = FUTURE_FEATURES.map((f) => ({ href: `/coming-soon/${f}`, label: t(f), soon: true }));

  const signOut = user ? (
    <form action={signOutAction}>
      <Button type="submit" variant="outline" size="sm">{t("signOut")}</Button>
    </form>
  ) : (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm"><Link href="/login">{t("signIn")}</Link></Button>
      <Button asChild size="sm"><Link href="/register">{t("signUp")}</Link></Button>
    </div>
  );

  return (
    <header className="relative border-b border-border bg-card">
      <div className="container flex min-h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-navy no-underline">
          <span aria-hidden className="inline-flex size-8 items-center justify-center rounded-md bg-navy text-sm text-navy-foreground">IK</span>
          <span className="max-w-[11rem] leading-tight sm:max-w-none">{brand("brand")}</span>
        </Link>
        <nav aria-label={t("main")} className="hidden items-center gap-1 xl:flex">
          {primary.map((l) => (
            <ActiveLink key={l.href} href={l.href} className="inline-flex min-h-11 items-center rounded-md px-3 text-foreground no-underline hover:bg-muted">{l.label}</ActiveLink>
          ))}
          <details className="relative">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-md px-3 hover:bg-muted">{t("soon")}…</summary>
            <ul className="absolute end-0 z-40 mt-1 w-64 rounded-md border border-border bg-card p-1 shadow-lg">
              {future.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex min-h-11 items-center justify-between rounded-md px-3 text-foreground no-underline hover:bg-muted">
                    <span>{l.label}</span><span className="text-xs text-muted-foreground">{t("soon")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        </nav>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <div className="hidden xl:block">{signOut}</div>
          <MobileNav links={[...primary, ...future]} footer={signOut} />
        </div>
      </div>
    </header>
  );
}
