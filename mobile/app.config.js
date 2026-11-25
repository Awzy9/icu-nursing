// Keep the public app's identity and configuration unchanged. The isolated
// candidate can be installed alongside it and never receives production OTAs.
const LIVE_SUPABASE = "dvmevjomyaqrojsiffnf.supabase.co";
const LIVE_SITES = new Set(["icu-nursing.vercel.app", "icu-nursing-preview.vercel.app"]);

function httpsOrigin(value, label) {
  let u;
  try { u = new URL(value); } catch { throw new Error("Missing or invalid " + label); }
  if (u.protocol !== "https:" || u.username || u.password || u.pathname !== "/" || u.search || u.hash) {
    throw new Error(label + " must be an exact HTTPS origin");
  }
  return u.origin;
}

function configure(config, env) {
  const staging = env.APP_VARIANT === "isolated-replay";
  if (!staging) {
    if (env.EXPO_PUBLIC_PROGRESS_REPLAY === "true") throw new Error("Replay is not approved outside isolated device testing");
    return config;
  }
  const backend = httpsOrigin(env.EXPO_PUBLIC_SUPABASE_URL, "isolated Supabase URL");
  const site = httpsOrigin(env.EXPO_PUBLIC_SITE_URL, "isolated website URL");
  const approvedBackend = httpsOrigin(env.ISOLATED_REPLAY_SUPABASE_URL, "approved Supabase URL");
  const approvedSite = httpsOrigin(env.ISOLATED_REPLAY_SITE_URL, "approved website URL");
  if (backend !== approvedBackend || site !== approvedSite ||
      new URL(backend).hostname === LIVE_SUPABASE || LIVE_SITES.has(new URL(site).hostname) ||
      backend === site) throw new Error("Refusing non-isolated replay test origins");
  const key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key || !key.startsWith("sb_publishable_")) throw new Error("An isolated publishable key is required");
  if (env.EXPO_PUBLIC_PROGRESS_REPLAY !== "true") throw new Error("Isolated replay profile requires explicit replay enablement");
  return {
    ...config,
    name: "Nursing Mastery QA",
    scheme: "nursingmasteryqa",
    ios: { ...config.ios, bundleIdentifier: "com.nursingmastery.app.qa" },
    android: { ...config.android, package: "com.nursingmastery.app.qa" },
    updates: { ...config.updates, enabled: false },
  };
}

module.exports = ({config}) => configure(config, process.env);
module.exports.configure = configure;
