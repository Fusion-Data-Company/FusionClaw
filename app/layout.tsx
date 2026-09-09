import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FusionClaw — the business-data layer for your agent',
  description:
      'Your agent already runs your terminal. FusionClaw gives it your customers, jobs, invoices, expenses and notes over MCP — with per-agent scoped keys, a confirmation gate on anything destructive, rate limits and an audit log of everything it did. Open source, self-hosted, one Postgres. Works with Hermes, OpenClaw and Claude Code.',
  metadataBase: new URL('https://fusionclaw.app'),
  openGraph: {
    title: 'FusionClaw — the business-data layer for your agent',
    description:
      'Your agent already runs your terminal. FusionClaw gives it your customers, jobs, invoices, expenses and notes over MCP — with per-agent scoped keys, a confirmation gate on anything destructive, rate limits and an audit log of everything it did. Open source, self-hosted, one Postgres. Works with Hermes, OpenClaw and Claude Code.',
    url: 'https://fusionclaw.app',
    siteName: 'FusionClaw',
    images: [
      {
        url: '/img/hero-desk.jpg',
        width: 1600,
        height: 893,
        alt: 'FusionClaw — an after-hours desk of invoices and a ledger lit by a terminal',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FusionClaw — the business-data layer for your agent',
    description:
      'Your agent already runs your terminal. FusionClaw gives it your customers, jobs, invoices, expenses and notes over MCP — with per-agent scoped keys, a confirmation gate on anything destructive, rate limits and an audit log of everything it did. Open source, self-hosted, one Postgres. Works with Hermes, OpenClaw and Claude Code.',
    images: ['/img/hero-desk.jpg'],
  },
  keywords: [
    'MCP server',
    'model context protocol',
    'agent business data',
    'Hermes agent',
    'OpenClaw',
    'Claude Code',
    'scoped API keys',
    'audit log',
    'self-hosted CRM',
    'open source',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border-med)',
              color: 'var(--color-text-primary)',
            },
          }}
        />
      </body>
    </html>
  )
}
