import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/asset-path";

// Required under `output: export`: these are route handlers, and a static
// export has no server to run them on demand.
export const dynamic = "force-static";

/**
 * Note this only reaches crawlers that look for it here. The site is served
 * from a GitHub Pages project sub-path, and robots.txt is read from the domain
 * root — which belongs to the user site, not this repo. It costs nothing and
 * is correct where it is read; the per-page robots directives are what
 * actually carry.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing to index, and every share link is the same URL.
      disallow: ["/view", "/editor"],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
