import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FusionClaw — Connect Your OpenClaw or Claude Agent Safely to Your Business",
  description:
    "New to AI agents? FusionClaw gives your OpenClaw or Claude agent guardrails, context control, and every tool a solo entrepreneur needs — CRM, ops, finance, marketing — without exposing your entire business to an unrestricted agent.",
  metadataBase: new URL("https://fusionclaw.vercel.app"),
  openGraph: {
    title: "FusionClaw — Connect Your OpenClaw or Claude Agent Safely to Your Business",
    description:
      "New to AI agents? FusionClaw gives your OpenClaw or Claude agent guardrails, context control, and every tool a solo entrepreneur needs — CRM, ops, finance, marketing — without exposing your entire business to an unrestricted agent.",
    url: "https://fusionclaw.vercel.app",
    siteName: "FusionClaw",
    images: [
      {
        url: "/hustle-mascot-bg.jpg",
        width: 1920,
        height: 768,
        alt: "FusionClaw — All Hustle No Luck",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FusionClaw — Connect Your OpenClaw or Claude Agent Safely to Your Business",
    description:
      "New to AI agents? FusionClaw gives your OpenClaw or Claude agent guardrails, context control, and every tool a solo entrepreneur needs — without exposing your entire business to an unrestricted agent.",
    images: ["/hustle-mascot-bg.jpg"],
  },
  keywords: [
    "business operating system",
    "AI agent",
    "MCP tools",
    "CRM",
    "self-hosted",
    "open source",
    "small business",
    "solo entrepreneur",
    "Next.js",
    "guardrails",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border-med)",
              color: "var(--color-text-primary)",
            },
          }}
        />
      </body>
    </html>
  );
}
