import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { GlobalHeader } from "@/components/site/global-header";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: "TechBlogger | Signal-rich writing for builders",
  description:
    "A polished, content-driven tech publication built with Next.js, Tailwind, and shadcn/ui patterns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${plexMono.variable} antialiased`}>
        <GlobalHeader />
        {children}
      </body>
    </html>
  );
}
