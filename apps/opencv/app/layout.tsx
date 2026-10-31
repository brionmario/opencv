import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { BASE_PATH, SITE_URL, siteUrl } from '@/lib/asset-path'

const NAME = 'OpenCV'
const TAGLINE = 'The resume builder that stores nothing'
const DESCRIPTION =
  'A free, open-source resume builder. Four print-tested templates, a live editor, ' +
  'and PDF, HTML, Markdown and JSON Resume exports. No account and no database: ' +
  'your resume is shared as a link that carries the whole document.'

export const metadata: Metadata = {
  // Every page's own title fills the slot; the root keeps a full one of its own.
  title: {
    default: `${NAME}: ${TAGLINE}`,
    template: `%s | ${NAME}`,
  },
  description: DESCRIPTION,
  applicationName: NAME,
  authors: [{ name: 'Brion Mario', url: 'https://github.com/brionmario' }],
  creator: 'Brion Mario',
  keywords: [
    'resume builder',
    'cv builder',
    'free resume builder',
    'open source resume builder',
    'ATS-friendly resume',
    'resume templates',
    'JSON Resume',
    'resume to PDF',
  ],
  alternates: { canonical: siteUrl('/') },
  openGraph: {
    type: 'website',
    siteName: NAME,
    title: `${NAME}: ${TAGLINE}`,
    description: DESCRIPTION,
    url: siteUrl('/'),
    locale: 'en',
    // Absolute, for the reason SITE_URL exists: a root-relative path here
    // would resolve past the GitHub Pages sub-path and 404 in every unfurl.
    images: [
      {
        url: siteUrl('/brand/og.png'),
        width: 1200,
        height: 630,
        alt: `${NAME}: ${TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${NAME}: ${TAGLINE}`,
    description: DESCRIPTION,
    images: [siteUrl('/brand/og.png')],
  },
  metadataBase: new URL(SITE_URL),
  icons: {
    // No SVG entry: browsers prefer it over the PNGs regardless of order,
    // which would override the scheme-specific marks below.
    // BASE_PATH: Next does not apply basePath to metadata icon URLs, so under
    // the GitHub Pages sub-path these 404 unless prefixed here.
    icon: [
      { url: `${BASE_PATH}/icon-light-32x32.png`, media: '(prefers-color-scheme: light)' },
      { url: `${BASE_PATH}/icon-dark-32x32.png`, media: '(prefers-color-scheme: dark)' },
    ],
    apple: `${BASE_PATH}/apple-icon.png`,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ fontFamily: "'Hanken Grotesk', ui-sans-serif, system-ui, -apple-system, sans-serif" }}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
