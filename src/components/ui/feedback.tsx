import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "info" | "warning" | "danger" | "success";
const tones: Record<Tone, { cls: string; Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> }> = {
  info: { cls: "bg-muted text-foreground border-border", Icon: Info },
  warning: { cls: "bg-warning text-warning-foreground border-warning-foreground/40", Icon: AlertTriangle },
  danger: { cls: "bg-danger text-danger-foreground border-danger-foreground/40", Icon: OctagonAlert },
  success: { cls: "bg-success text-success-foreground border-success-foreground/40", Icon: CheckCircle2 },
};

/** Never conveys meaning by colour alone: always an icon plus text. */
export function Callout({ tone = "info", title, children, className, role }: { tone?: Tone; title?: string; children: React.ReactNode; className?: string; role?: "alert" | "status" | "note" }) {
  const { cls, Icon } = tones[tone];
  return (
    <div role={role ?? (tone === "danger" ? "alert" : "note")} className={cn("flex gap-3 rounded-md border p-3 text-sm", cls, className)}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function Badge({ children, tone = "info", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone].cls, className)}>{children}</span>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}
