// Expo Router treats host-style provider URLs differently from ordinary in-app paths.
// Keep the Supabase one-time code in the query string, but send navigation to a real screen.
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const u = new URL(path, "nursingmastery://app.local");
    if (u.protocol === "nursingmastery:" && u.hostname === "auth" && u.pathname === "/callback") {
      return `/auth/callback${u.search}`;
    }
  } catch { /* leave unrelated/invalid URLs to Expo Router */ }
  return path;
}
