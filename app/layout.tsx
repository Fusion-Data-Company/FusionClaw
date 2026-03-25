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
  title: "FusionClaw — The AI-Native Business Operating System",
  description:
    "Complete business in a box for business owners who are afraid of connecting an unrestricted agent to their business. FusionClaw gives your agent guardrails and context control for operations and gives your agent all the tools a solo entrepreneur needs.",
  metadataBase: new URL("https://fusionclaw.vercel.app"),
  openGraph: {
    title: "FusionClaw — The AI-Native Business Operating System",
    description:
      "Complete business in a box for business owners who are afraid of connecting an unrestricted agent to their business. FusionClaw gives your agent guardrails and context control for operations and gives your agent all the tools a solo entrepreneur needs.",
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
    title: "FusionClaw — The AI-Native Business Operating System",
    description:
      "Complete business in a box for business owners who are afraid of connecting an unrestricted agent to their business. FusionClaw gives your agent guardrails and context control for operations.",
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
