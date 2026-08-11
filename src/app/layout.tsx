import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FindBack — Reunite lost items with their owners",
    template: "%s · FindBack",
  },
  description:
    "Report lost and found items, upload a photo, and let FindBack compare images to find possible matches and notify owners.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "FindBack",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#00685f",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={nunito.variable}>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col bg-surface">
        <main className="flex-1">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
