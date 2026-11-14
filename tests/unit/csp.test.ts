import { describe, expect, it } from "vitest";
import { buildCsp, newNonce } from "@/lib/csp";

describe("buildCsp", () => {
  it("allows scripts only with the request nonce and never 'unsafe-inline'", () => {
    const csp = buildCsp({ nonce: "abc" });
    const script = csp.split("; ").find((d) => d.startsWith("script-src"))!;
    expect(script).toContain("'nonce-abc'");
    expect(script).toContain("'strict-dynamic'");
    expect(script).not.toContain("unsafe-inline");
    expect(script).not.toContain("unsafe-eval");
  });
  it("only permits eval in development", () => {
    expect(buildCsp({ nonce: "n", dev: true })).toContain("'unsafe-eval'");
    expect(buildCsp({ nonce: "n", dev: false })).not.toContain("unsafe-eval");
  });
  it("scopes network access to the configured Supabase project", () => {
    const csp = buildCsp({ nonce: "n", supabaseUrl: "https://dvmevjomyaqrojsiffnf.supabase.co" });
    expect(csp).toContain("connect-src 'self' https://dvmevjomyaqrojsiffnf.supabase.co wss://dvmevjomyaqrojsiffnf.supabase.co");
    expect(csp).not.toContain("*.supabase.co");
  });
  it("blocks framing, plugins and foreign form targets", () => {
    const csp = buildCsp({ nonce: "n" });
    for (const d of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"]) expect(csp).toContain(d);
  });
  it("generates unpredictable, unique nonces", () => {
    expect(new Set(Array.from({ length: 50 }, newNonce)).size).toBe(50);
  });
});
