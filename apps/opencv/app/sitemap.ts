import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/asset-path";

// Required under `output: export`: these are route handlers, and a static
// export has no server to run them on demand.
export const dynamic = "force-static";

/**
 * Only the two pages that have content of their own. The editor and the share
 * view are tools whose pages are empty until the browser fills them, and both
 * are marked noindex, so listing them would be contradicting ourselves.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl("/"), changeFrequency: "monthly", priority: 1 },
    { url: siteUrl("/templates"), changeFrequency: "monthly", priority: 0.8 },
  ];
}
