import type { Metadata } from "next";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { AppProvider } from "@/lib/AppContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Moitrii — Modern Indian Women's Lifestyle & Personal AI Companion",
  description:
    "An affordable personal AI agent platform where every woman gets her own persistent companion for health, food, beauty, family, wellness, and calm living.",
  icons: {
    icon: "/images/moitrii_logo.jpg",
    shortcut: "/images/moitrii_logo.jpg",
    apple: "/images/moitrii_logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body className="min-h-screen flex flex-col text-charcoal-900 antialiased selection:bg-rosebrand/20 selection:text-charcoal-900">
          <ConvexClientProvider>
            <AppProvider>
              <Navbar />
              <main className="flex-grow">{children}</main>
              <Footer />
            </AppProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
