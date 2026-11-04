import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { da } from "@/messages/da";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: da.app.name, template: `%s · ${da.app.name}` },
  description: da.app.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="da" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#indhold"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          {da.app.skipToContent}
        </a>
        <SiteHeader />
        <main id="indhold" className="flex flex-1 flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
