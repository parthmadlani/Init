import { siteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: "Init — your daily learning path", template: "%s | Init" },
  openGraph: { type: "website", siteName: "Init", title: "Init — your daily learning path", description: "Free videos. A clear learning path. A schedule that fits your day." },
  twitter: { card: "summary", title: "Init — your daily learning path", description: "Turn your learning goal into a daily plan." },
  description: "Turns a goal, a skill level, and a time budget into a structured learning path.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
