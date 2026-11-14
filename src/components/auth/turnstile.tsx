"use client";
import { useEffect, useRef } from "react";

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
}
declare global {
  interface Window { turnstile?: TurnstileApi; __turnstileLoading?: Promise<void> }
}

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
function load(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  window.__turnstileLoading ??= new Promise<void>((resolve, reject) => {
    // Inserted by our nonce'd bundle, so CSP 'strict-dynamic' allows it.
    const s = document.createElement("script");
    s.src = SCRIPT; s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Turnstile failed to load"));
    document.head.appendChild(s);
  });
  return window.__turnstileLoading;
}

/**
 * Cloudflare Turnstile widget. Writes the single-use token into a hidden `captchaToken` input. Call `resetKey` changes
 * (e.g. after a failed submission) to obtain a fresh token. Renders nothing when no site key is configured.
 */
export function Turnstile({ siteKey, resetKey, label }: { siteKey?: string; resetKey?: unknown; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const widget = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!siteKey || !host.current) return;
    let cancelled = false;
    void load().then(() => {
      if (cancelled || !host.current || !window.turnstile || widget.current) return;
      widget.current = window.turnstile.render(host.current, {
        sitekey: siteKey,
        callback: (token: string) => { if (input.current) input.current.value = token; },
        "expired-callback": () => { if (input.current) input.current.value = ""; },
        "error-callback": () => { if (input.current) input.current.value = ""; },
        theme: "auto",
      });
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = undefined;
    };
  }, [siteKey]);

  useEffect(() => {
    if (resetKey === undefined) return;
    if (input.current) input.current.value = "";
    if (widget.current && window.turnstile) window.turnstile.reset(widget.current);
  }, [resetKey]);

  if (!siteKey) return null;
  return (
    <div>
      <p className="mb-1 text-sm text-muted-foreground" id="captcha-label">{label}</p>
      <div ref={host} aria-labelledby="captcha-label" data-testid="turnstile" className="min-h-[65px]" />
      <input ref={input} type="hidden" name="captchaToken" defaultValue="" />
    </div>
  );
}
