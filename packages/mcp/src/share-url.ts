/**
 * Share URLs, outside a browser.
 *
 * The codec in @brionmario/opencv-core stops at the encoded payload on
 * purpose: turning that into a URL needs an origin, and the core package has
 * no business guessing one. The app takes it from the page it is served on;
 * here it comes from configuration, because an agent may be pointing at the
 * public site, a staging deploy or a local dev server.
 */

import {
  decodeShare,
  decodeLegacyQuery,
  encodeShare,
  readShareHash,
  type SharePayload,
  type CVData,
} from "@brionmario/opencv-core";

/** Where the résumés this server mints will be read. */
export const BASE_URL = (
  process.env.OPENCV_BASE_URL ?? "https://brionmario.github.io/opencv"
).replace(/\/+$/, "");

/**
 * Long enough that link-rewriting clients start to mangle it. The fragment
 * itself has no size limit, so this is advice, not a failure.
 */
export const LONG_URL = 8000;

export function shareUrlFor(encoded: string): string {
  return `${BASE_URL}/view#cv=${encoded}`;
}

export async function buildShareUrl(payload: SharePayload): Promise<string> {
  return shareUrlFor(await encodeShare(payload));
}

/**
 * Reads a share link back into a document.
 *
 * Takes what an agent is likely to be holding: a full share URL, a legacy
 * ?data= URL, or the bare encoded payload on its own — someone pasting "the
 * bit after the #" is a predictable thing to receive, and refusing it would
 * be pedantry.
 */
export async function parseShareUrl(
  input: string
): Promise<{ payload: SharePayload } | { error: string }> {
  const raw = input.trim();

  let hash = "";
  let query = "";
  try {
    const url = new URL(raw);
    hash = url.hash;
    query = url.search;
  } catch {
    // Not a URL. Treat it as the payload itself, in either of the two forms
    // it could have been copied out as.
    hash = raw.startsWith("cv=") || raw.startsWith("#") ? raw : `cv=${raw}`;
  }

  const encoded = readShareHash(hash);
  if (encoded) {
    const payload = await decodeShare(encoded);
    if (payload) return { payload };
    return {
      error:
        "The résumé in that link could not be decoded. Share links are long, " +
        "and the usual cause is that the end was clipped by whatever passed it along.",
    };
  }

  const legacy = new URLSearchParams(query).get("data");
  if (legacy) {
    const data: CVData | null = decodeLegacyQuery(legacy);
    if (data) return { payload: { v: 1, data } };
    return { error: "That looks like an older ?data= link, but its contents could not be read." };
  }

  return {
    error:
      "No résumé found in that link. A share URL carries the document after a '#', " +
      "like https://example.com/view#cv=z.… — check nothing after the # was lost.",
  };
}
