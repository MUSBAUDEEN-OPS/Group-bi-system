import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { NavHeader } from "@/components/NavHeader";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { HtmlDirSync } from "@/components/HtmlDirSync";
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
  title: "Al Nokhbat Al Jawahir Al Oula — Group BI Dashboard",
  description: "Al Nokhbat Al Jawahir Al Oula Group BI & Automation System — consolidated view across Hajj & Umrah Tourism, Hotel, and Bakery",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#16233f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Suspense>
          <HtmlDirSync />
        </Suspense>
        <Suspense fallback={<div className="h-[88px] bg-[var(--brand-navy)]" />}>
          <NavHeader />
        </Suspense>
        <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-4">{children}</main>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
