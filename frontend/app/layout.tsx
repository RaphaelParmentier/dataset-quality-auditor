import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Data Quality Auditor",
  description:
    "AI-assisted platform for automated dataset validation, inspection and reporting workflows.",

  openGraph: {
    title: "AI Data Quality Auditor",
    description:
      "Production-oriented AI platform for automated dataset validation and analytical workflows.",
    url: "https://audit.raphaelparmentier.dev",
    siteName: "AI Data Quality Auditor",
    images: [
      {
        url: "/images/og-audit.png",
        width: 1200,
        height: 630,
        alt: "AI Data Quality Auditor",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "AI Data Quality Auditor",
    description:
      "AI-assisted platform for automated dataset validation and reporting workflows.",
    images: ["/images/og-audit.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
