"use client";
import { useEffect, useRef, useState } from "react";
import { loadTurnstile } from "./turnstile";

declare global { interface Window { ReactNativeWebView?: { postMessage(data: string): void } } }

/**
 * Hosts Cloudflare Turnstile for the native apps. It posts the single-use token to the app's WebView and to nothing else
 * (no window.opener, no parent frame, no URL parameters). The app accepts the message only from this site's origin.
 */
export function NativeCaptcha({ siteKey, labels }: { siteKey?: string; labels: { title: string; unavailable: string; waiting: string; done: string } }) {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"waiting" | "done" | "error">("waiting");
  useEffect(() => {
    if (!siteKey || !host.current) return;
    let widget: string | undefined; let cancelled = false;
    void loadTurnstile().then(() => {
      if (cancelled || !host.current || !window.turnstile) return;
      widget = window.turnstile.render(host.current, {
        sitekey: siteKey, theme: "auto",
        callback: (token: string) => { setState("done"); window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "icu.turnstile", v: 1, token })); },
        "expired-callback": () => setState("waiting"),
        "error-callback": () => setState("error"),
      });
    }).catch(() => setState("error"));
    return () => { cancelled = true; if (widget && window.turnstile) window.turnstile.remove(widget); };
  }, [siteKey]);
  if (!siteKey) return <p role="alert">{labels.unavailable}</p>;
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">{labels.title}</h1>
      <div ref={host} data-testid="native-turnstile" className="min-h-[65px]" />
      <p role="status" className="text-sm text-muted-foreground">{state === "done" ? labels.done : state === "error" ? labels.unavailable : labels.waiting}</p>
    </div>
  );
}
