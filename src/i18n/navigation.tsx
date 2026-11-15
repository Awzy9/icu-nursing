import * as React from "react";
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

const nav = createNavigation(routing);

/**
 * Links do NOT prefetch. Learner pages (dashboards, attempts, results) are dynamic and change after every answer; a prefetched
 * copy served from the client router cache showed stale progress after finishing a case (found by the end-to-end suite).
 * Navigating fetches fresh data; the cost is one request per click.
 */
export function Link(props: React.ComponentProps<typeof nav.Link>) {
  return <nav.Link prefetch={false} {...props} />;
}
export const { redirect, usePathname, useRouter, getPathname } = nav;
