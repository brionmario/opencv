import type { Metadata } from "next";

/**
 * noindex: the editor is a tool, not a page. It renders whatever document the
 * visitor has open in their own browser, so there is no stable content here
 * for a crawler to index, only an empty shell.
 */
export const metadata: Metadata = {
  title: "Editor",
  robots: { index: false, follow: true },
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
