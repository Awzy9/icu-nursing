import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/env";

/** Only an explicit NEXT_PUBLIC_APP_ENV=production deployment may be crawled; staging and previews never are. */
export function robotsFor(indexable: boolean, siteUrl?: string): MetadataRoute.Robots {
  if (!indexable) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/bookmarks", "/account", "/mfa", "/api", "/auth"] }], ...(siteUrl ? { sitemap: `${siteUrl.replace(/\/$/, "")}/sitemap.xml` } : {}) };
}

export default function robots(): MetadataRoute.Robots {
  const env = getEnv();
  return robotsFor(env.indexable, env.NEXT_PUBLIC_SITE_URL);
}
