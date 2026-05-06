import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import { AuthLayout } from "@/components/AuthLayout";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans-brand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mintdish",
  description: "Recipe organizer with metric conversions and structured steps",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mintdish",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
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
      className={`${jakartaSans.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#059669" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <AuthLayout>{children}</AuthLayout>
        </Providers>
        <footer className="mt-auto border-t border-gray-100 py-4 text-center text-xs text-gray-400">
          <a href="/privacy" className="hover:text-gray-600">
            Privacy
          </a>
          <span className="mx-2">·</span>
          <a href="/terms" className="hover:text-gray-600">
            Terms
          </a>
        </footer>
      </body>
    </html>
  );
}
