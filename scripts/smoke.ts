/**
 * Deployment smoke test. Safe to run against any URL (read-only GETs).
 *   npx tsx scripts/smoke.ts https://staging.example.org [--live] [--captcha] [--production]
 * --live        expects Supabase mode (/api/health mode "supabase"; /admin redirects anonymous visitors to sign-in)
 * --captcha     expects CAPTCHA enabled (/api/health captcha true; login page contains the widget host)
 * --production  expects an indexable deployment (no noindex); otherwise noindex is REQUIRED
 */
const base = (process.argv[2] ?? "").replace(/\/$/, "");
const flags = new Set(process.argv.slice(3));
if (!/^https?:\/\//.test(base)) { console.error("Usage: smoke.ts <base-url> [--live] [--captcha] [--production]"); process.exit(2); }

let failed = 0;
const check = (name: string, ok: boolean, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`); if (!ok) failed++; };
const get = async (path: string, init: RequestInit = {}) => {
  const t = Date.now();
  const res = await fetch(base + path, { redirect: "manual", ...init });
  return { res, ms: Date.now() - t, text: res.status < 400 || res.status === 404 ? await res.text() : "" };
};

(async () => {
  const health = await get("/api/health");
  const h = JSON.parse(health.text || "{}");
  check("health endpoint ok", health.res.status === 200 && h.status === "ok", JSON.stringify(h));
  check("health reports the expected mode", flags.has("--live") ? h.mode === "supabase" : true, `mode=${h.mode}`);
  check("CAPTCHA state matches expectation", flags.has("--captcha") ? h.captcha === true : h.captcha === false, `captcha=${h.captcha}`);
  check("health is not cacheable", /no-store/.test(health.res.headers.get("cache-control") ?? ""));

  const home = await get("/en");
  const csp = home.res.headers.get("content-security-policy") ?? "";
  const scriptSrc = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("script-src")) ?? "";
  check("home page loads quickly", home.res.status === 200 && home.ms < 4000, `${home.res.status} in ${home.ms} ms`);
  check("CSP uses a per-request nonce and strict-dynamic, with no unsafe-inline/eval for scripts", /'nonce-[^']+'/.test(scriptSrc) && scriptSrc.includes("'strict-dynamic'") && !/unsafe-(inline|eval)/.test(scriptSrc));
  check("CSP blocks framing and objects", csp.includes("frame-ancestors 'none'") && csp.includes("object-src 'none'"));
  const csp2 = (await get("/en")).res.headers.get("content-security-policy");
  check("nonce differs on every request", csp !== csp2);
  check("clickjacking / sniffing headers set", home.res.headers.get("x-frame-options") === "DENY" && home.res.headers.get("x-content-type-options") === "nosniff");
  if (base.startsWith("https://")) check("HSTS set on https", /max-age=\d+/.test(home.res.headers.get("strict-transport-security") ?? ""));
  check("server does not advertise its framework", !home.res.headers.get("x-powered-by"));
  const robotsHeader = home.res.headers.get("x-robots-tag") ?? "";
  const robots = await get("/robots.txt");
  if (flags.has("--production")) check("production IS indexable", !/noindex/.test(robotsHeader) && !/Disallow: \/\s*$/m.test(robots.text));
  else check("non-production is NOT indexable (X-Robots-Tag + robots.txt)", /noindex/.test(robotsHeader) && /Disallow: \//.test(robots.text));
  check("no secret material in the HTML", !/sb_secret_|service_role|sbp_[A-Za-z0-9]{10}|eyJhbGciOi[A-Za-z0-9_-]{20}/.test(home.text));
  check("no stack traces or framework internals in the HTML", !/at Object\.|webpack-internal:|ReferenceError/.test(home.text));

  const ar = await get("/ar");
  check("Arabic page is right-to-left", ar.res.status === 200 && /<html[^>]*dir="rtl"/.test(ar.text));
  for (const p of ["/en/library", "/en/login", "/en/register", "/en/coming-soon/simulation"]) check(`page ${p}`, (await get(p)).res.status === 200);
  check("unknown page is a 404", (await get("/en/definitely-not-here")).res.status === 404);
  const login = await get("/en/login");
  if (flags.has("--captcha")) check("login page renders the CAPTCHA host", login.text.includes('data-testid="turnstile"'));
  const admin = await get("/en/admin");
  if (flags.has("--live")) check("admin redirects anonymous visitors to sign-in", [302, 307, 308].includes(admin.res.status) && /\/en\/login/.test(admin.res.headers.get("location") ?? ""), `${admin.res.status} ${admin.res.headers.get("location")}`);
  const api = await get("/rest/v1/", { headers: {} });
  check("the app does not proxy database APIs", api.res.status !== 200 && !api.text.includes("PGRST"), `status ${api.res.status}`);
  console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll smoke checks passed");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(1); });
