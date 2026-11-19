// Authentication callbacks (email confirmation, password reset). Only two exact shapes are accepted; anything else is ignored.
import { z } from "zod";

export type CallbackIntent = { kind: "signup" | "recovery" | "magiclink" | "email_change"; code: string };
export type CallbackResult = { ok: true; intent: CallbackIntent } | { ok: false; reason: "scheme" | "host" | "path" | "params" };

const SCHEME = "nursingmastery";
const params = z.object({ code: z.string().regex(/^[A-Za-z0-9._-]{8,200}$/), type: z.enum(["signup", "recovery", "magiclink", "email_change"]).default("magiclink") });

/** `nursingmastery://auth/callback?code=...` or `https://<our site>/auth/callback?code=...` (a verified app link). Other hosts, paths and schemes are refused. */
export function parseAuthCallback(raw: string, siteOrigin: string): CallbackResult {
  let u: URL; try { u = new URL(raw); } catch { return { ok: false, reason: "scheme" }; }
  if (u.protocol === `${SCHEME}:`) { if (u.hostname !== "auth" || u.pathname !== "/callback") return { ok: false, reason: "path" }; }
  else if (u.protocol === "https:" || (u.protocol === "http:" && siteOrigin.startsWith("http://"))) { if (u.origin !== siteOrigin) return { ok: false, reason: "host" }; if (u.pathname !== "/auth/callback") return { ok: false, reason: "path" }; }
  else return { ok: false, reason: "scheme" };
  const p = params.safeParse({ code: u.searchParams.get("code") ?? undefined, type: u.searchParams.get("type") ?? undefined });
  return p.success ? { ok: true, intent: { kind: p.data.type, code: p.data.code } } : { ok: false, reason: "params" };
}
