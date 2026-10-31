import type { Metadata } from "next";
import { siteUrl } from "@/lib/asset-path";

/**
 * The gallery is the one app page worth indexing: it is a real landing page
 * for someone looking for resume templates, and its content is the same for
 * everybody.
 */
export const metadata: Metadata = {
  title: "Resume templates",
  description:
    "Four print-tested resume templates: Professional, Modern, Classic and Minimal. " +
    "Preview each one filled in, pick a layout, and edit it in the browser. Free and open source.",
  alternates: { canonical: siteUrl("/templates") },
  openGraph: {
    title: "Resume templates | OpenCV",
    description:
      "Four print-tested resume templates. Preview each one filled in, then edit it in the browser.",
    url: siteUrl("/templates"),
  },
};

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
