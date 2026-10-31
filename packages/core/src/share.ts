/**
 * Share links.
 *
 * This module is the codec only: encoding, decoding and the wire format.
 * Building an actual URL needs an origin and a base path, which only the app
 * has, so that part stays there.
 *
 * The app is a static export with no backend, so a shared CV has nowhere to
 * live but the link itself. The whole document (data, theme and layout)
 * travels in the URL's **hash**, not the query string: a fragment is never
 * sent to the server, so it escapes the ~8KB request-line limit that would
 * otherwise 414 on GitHub Pages, and the CV never touches an access log.
 *
 * Payloads are deflated before encoding, which takes a realistic CV from
 * several KB of base64 down to roughly a quarter of that.
 *
 * Encoded form: `<codec>.<base64url>`, where codec is `z` (deflate-raw) or
 * `u` (plain UTF-8). The marker exists so a link made in a browser with
 * CompressionStream still opens in one without it, and vice versa.
 */

import type { CVData, CVTheme } from "./types.js";
import type { LayoutType } from "./layouts.js";

/** The hash key a share link carries, e.g. `/view#cv=z.q1bKS…`. */
export const SHARE_HASH_KEY = "cv";

/** The legacy query param: bare base64 of CVData, no theme, no compression. */
export const LEGACY_QUERY_KEY = "data";

export interface SharePayload {
  /** Schema version, so an old link can be read by a newer decoder. */
  v: 1;
  data: CVData;
  theme?: CVTheme;
  layout?: LayoutType;
}

/* ── base64url ────────────────────────────────────────────────────────────── */

/** Backed by a plain ArrayBuffer, which is what Blob and atob/btoa accept;
 *  a bare Uint8Array may be over a SharedArrayBuffer, which they do not. */
type Bytes = Uint8Array<ArrayBuffer>;

// btoa wants a binary string. Built in chunks because a single join over a
// multi-megabyte photo payload is needlessly heavy, and String.fromCharCode
// cannot take that many arguments at once.
function bytesToBase64(bytes: Bytes): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Bytes {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toBase64Url(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  // atob is strict about length; restore the padding the URL form dropped.
  return b64 + "=".repeat((4 - (b64.length % 4)) % 4);
}

/* ── deflate ──────────────────────────────────────────────────────────────── */

function canCompress(): boolean {
  return typeof CompressionStream !== "undefined";
}

async function streamThrough(
  bytes: Bytes,
  stream: CompressionStream | DecompressionStream
): Promise<Bytes> {
  const blob = new Blob([bytes]);
  const buffer = await new Response(blob.stream().pipeThrough(stream as never)).arrayBuffer();
  return new Uint8Array(buffer);
}

/* ── encode / decode ──────────────────────────────────────────────────────── */

/**
 * Packs a payload into the string that goes after `#cv=`. Rejects nothing:
 * an unserializable payload throws, which the caller surfaces as a failed
 * copy rather than handing out a broken link.
 */
export async function encodeShare(payload: SharePayload): Promise<string> {
  const json = JSON.stringify(payload);
  const raw = new TextEncoder().encode(json) as Bytes;

  if (canCompress()) {
    try {
      const deflated = await streamThrough(raw, new CompressionStream("deflate-raw"));
      return `z.${toBase64Url(bytesToBase64(deflated))}`;
    } catch {
      // Fall through to the uncompressed form rather than failing the share.
    }
  }

  return `u.${toBase64Url(bytesToBase64(raw))}`;
}

/** Reads a `#cv=` value back. Returns null for anything malformed. */
export async function decodeShare(encoded: string): Promise<SharePayload | null> {
  const dot = encoded.indexOf(".");
  if (dot < 1) return null;

  const codec = encoded.slice(0, dot);
  const body = encoded.slice(dot + 1);

  try {
    let bytes = base64ToBytes(fromBase64Url(body));

    if (codec === "z") {
      if (!canCompress()) return null;
      bytes = await streamThrough(bytes, new DecompressionStream("deflate-raw"));
    } else if (codec !== "u") {
      return null;
    }

    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    // A link is untrusted input: anything without the one field the renderer
    // cannot do without is rejected outright.
    if (!parsed || typeof parsed !== "object" || !parsed.data?.personalInfo) return null;
    return parsed as SharePayload;
  } catch {
    return null;
  }
}

/**
 * The editor used to write the whole CV into `?data=` as plain base64 of
 * CVData. Those links are already in the wild, so they keep working, and they
 * just carry no theme or layout.
 */
export function decodeLegacyQuery(encoded: string): CVData | null {
  try {
    const bytes = base64ToBytes(encoded);
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || !parsed.personalInfo) return null;
    return parsed as CVData;
  } catch {
    return null;
  }
}

/** Pulls the share payload out of a URL hash, if it has one. */
export function readShareHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get(SHARE_HASH_KEY);
}
