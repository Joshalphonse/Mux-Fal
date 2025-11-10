import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
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
  title: "Mux + fal.ai Video Generator",
  description: "Generate AI Videos with fal.ai and play them back with Mux",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <div className="fixed right-4 top-4 z-50">
          <a
            href="https://github.com/muxinc/Mux-Fal"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the Mux + fal.ai GitHub repository"
          >
            <Image
              src="/github-mark-white.png"
              alt="GitHub"
              width={32}
              height={32}
              priority
            />
          </a>
        </div>
        {children}
      </body>
    </html>
  );
}
