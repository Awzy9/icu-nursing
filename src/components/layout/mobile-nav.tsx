"use client";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { NavLink as ActiveLink } from "./nav-link";

export interface NavLink { href: string; label: string; soon?: boolean }

export function MobileNav({ links, footer, tools }: { links: NavLink[]; footer?: React.ReactNode; tools?: React.ReactNode }) {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        ref={btn}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? t("closeMenu") : t("menu")}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-11 items-center justify-center rounded-md border border-input bg-card"
      >
        {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>
      {open ? (
        <nav id="mobile-menu" aria-label={t("main")} className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-b border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg">
          {tools && <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-border pb-3 sm:hidden">{tools}</div>}
          <ul className="grid gap-1 min-[380px]:grid-cols-2">
            {links.map((l) => (
              <li key={l.href}>
                <ActiveLink href={l.href} className="flex min-h-12 items-center justify-between rounded-md px-3 text-sm font-medium text-foreground no-underline hover:bg-muted">
                  <span>{l.label}</span>
                  {l.soon ? <span className="text-xs text-muted-foreground">{t("soon")}</span> : null}
                </ActiveLink>
              </li>
            ))}
          </ul>
          {footer ? <div className="mt-3 border-t border-border pt-3">{footer}</div> : null}
        </nav>
      ) : null}
    </div>
  );
}
