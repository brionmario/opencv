/**
 * Base-path aware asset URLs.
 *
 * The GitHub Pages build serves the app from a sub-path (/opencv/) via
 * next.config's `basePath`. Next applies that prefix to <Link> and
 * next/image, but NOT to a raw <img src>, a URL in `metadata.icons`, or a
 * URL that react-pdf fetches itself — those stay root-relative and 404 in
 * production while working fine on localhost, so every such path goes
 * through here.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Prefixes an app-root-relative path with the base path. Leaves anything
 * else alone: data: URLs (uploaded photos), absolute http(s) URLs, and paths
 * that already carry the prefix.
 */
export function assetPath<T extends string | undefined>(path: T): T {
  if (!path || !path.startsWith("/")) return path;
  if (!BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
  return `${BASE_PATH}${path}` as T;
}

/**
 * An absolute URL for the same asset. The HTML export is a standalone file
 * the user downloads, so a relative path in it would resolve against
 * wherever the file happens to sit; exports need the origin baked in.
 */
export function absoluteAssetUrl<T extends string | undefined>(path: T): T {
  const prefixed = assetPath(path);
  if (!prefixed || !prefixed.startsWith("/") || typeof window === "undefined") return prefixed;
  return new URL(prefixed, window.location.origin).href as T;
}
