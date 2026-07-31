import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { SearchProvider } from "@/context/SearchContext";
import { FavoritesProvider } from "@/context/FavoritesContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Wedding Support Company — Find Your Perfect Resort",
  description: "Browse top wedding venues, resort packages, and customized promotional deals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        {/* Phosphor Icons CDN Script placed inside <body> */}
        <Script
          src="https://unpkg.com/@phosphor-icons/web"
          strategy="afterInteractive"
        />
        <FavoritesProvider>
          <SearchProvider>{children}</SearchProvider>
        </FavoritesProvider>
      </body>
    </html>
  );
}