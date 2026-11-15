"use client";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Navigation link that marks the current section (aria-current + visual state) so users always know where they are. */
export function NavLink({ href, children, className, activeClassName }: { href: string; children: React.ReactNode; className?: string; activeClassName?: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn(className, active && (activeClassName ?? "bg-muted font-semibold"))}>
      {children}
    </Link>
  );
}
