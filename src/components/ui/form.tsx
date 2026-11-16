import * as React from "react";
import { cn } from "@/lib/utils";

const field = "block w-full min-h-11 rounded-md border border-input bg-card px-3 py-2 text-base text-foreground placeholder:text-muted-foreground";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(field, className)} {...p} />;
});
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(field, "min-h-28", className)} {...p} />;
});
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...p }, ref) {
  return <select ref={ref} className={cn(field, className)} {...p} />;
});
export function Label({ className, ...p }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-sm font-medium text-foreground", className)} {...p} />;
}
export function Field({ label, htmlFor, hint, error, children }: { label: string; htmlFor: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p id={`${htmlFor}-hint`} className="text-sm text-muted-foreground">{hint}</p> : null}
      {error ? <p id={`${htmlFor}-error`} role="alert" className="text-sm font-medium text-danger-foreground">{error}</p> : null}
    </div>
  );
}
