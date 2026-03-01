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

const title = "ask-a-man | Aman Agarwal — Senior Frontend Developer";
const description =
  "Chat with Aman Agarwal's AI assistant. Ask about his experience scaling React apps to 10M+ users at Paytm, micro-frontend architecture, performance optimization, and more.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "Aman Agarwal",
    "Senior Frontend Developer",
    "React",
    "Next.js",
    "TypeScript",
    "Micro-frontends",
    "Paytm",
    "Godaddy",
    "Portfolio",
    "AI Assistant",
  ],
  authors: [{ name: "Aman Agarwal" }],
  creator: "Aman Agarwal",
  openGraph: {
    type: "website",
    title,
    description,
    siteName: "ask-a-man",
    images: [
      { url: "/logo.png", width: 512, height: 512, alt: "Aman Agarwal" },
    ],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
