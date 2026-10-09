import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { BASE_PATH } from '@/lib/asset-path'

export const metadata: Metadata = {
  title: 'openCV — Resume Builder',
  description: 'Build beautiful, ATS-friendly resumes with openCV',
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
