/**
 * Share links, app side.
 *
 * The wire format and the codec live in @brionmario/opencv-core, so that a
 * link can be minted or read anywhere — a script, a CLI, an agent — and not
 * only in a page. What stays here is the part that genuinely needs the app:
 * turning an encoded payload into a URL, which takes the origin the page is
 * served from and the base path the build was configured with.
 */

import { encodeShare, type SharePayload } from "@brionmario/opencv-core";
import { BASE_PATH } from "@/lib/asset-path";

export {
  SHARE_HASH_KEY,
  LEGACY_QUERY_KEY,
  encodeShare,
  decodeShare,
  decodeLegacyQuery,
  readShareHash,
  type SharePayload,
} from "@brionmario/opencv-core";

function appUrl(path: string): URL {
  // BASE_PATH is the GitHub Pages sub-path (/opencv); a share link has to
  // survive being pasted anywhere, so it is absolute.
  return new URL(`${BASE_PATH}${path}`, window.location.origin);
}

/** The read-only link to hand out. */
export async function buildShareUrl(payload: SharePayload): Promise<string> {
  const encoded = await encodeShare(payload);
  const url = appUrl("/view");
  url.hash = `cv=${encoded}`;
  return url.toString();
}
