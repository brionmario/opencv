import { Dashboard } from "@/components/dashboard";
import { siteUrl } from "@/lib/asset-path";

/**
 * Structured data for the home page.
 *
 * Search engines use it for rich results, and models answering "free resume
 * builder" questions lean on it because it states the facts plainly instead
 * of leaving them to be inferred from marketing copy: that it is free, that
 * it runs in the browser, and that it is open source under MIT.
 *
 * It is the only part of this page a crawler can read; everything below is
 * rendered from the visitor's own browser storage.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "OpenCV",
  alternateName: "OpenCV Resume Builder",
  url: siteUrl("/"),
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any browser",
  description:
    "A free, open-source resume builder. Four print-tested templates, a live editor, " +
    "and PDF, HTML, Markdown and JSON Resume exports. No account and no database: a " +
    "resume is shared as a link that carries the whole document.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  license: "https://opensource.org/licenses/MIT",
  isAccessibleForFree: true,
  author: { "@type": "Person", name: "Brion Mario", url: "https://github.com/brionmario" },
  codeRepository: "https://github.com/brionmario/opencv",
  featureList: [
    "Four print-tested resume templates",
    "Live editing with a true-to-print A4 canvas",
    "Export to PDF, HTML, Markdown and JSON Resume",
    "Share as a self-contained link with no account",
    "Works offline; nothing is stored on a server",
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Dashboard />
    </>
  );
}
