import type { Metadata } from "next";

/**
 * noindex, and deliberately so.
 *
 * Every share link in existence is this one URL: the resume rides in the
 * fragment, which never reaches a server. So a crawler indexing /view would
 * file one empty page under a title that belongs to nobody, and any ranking
 * it earned would point at a blank document. There is nothing here to find
 * unless you were given the link.
 */
export const metadata: Metadata = {
  title: "Shared resume",
  robots: { index: false, follow: false },
};

export default function ViewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
