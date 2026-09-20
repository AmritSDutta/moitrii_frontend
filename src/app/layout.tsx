import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/AppContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Moitrii — Modern Indian Women's Lifestyle & Personal AI Companion",
  description:
    "An affordable personal AI agent platform where every woman gets her own persistent companion for health, food, beauty, family, wellness, and calm living.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-petal-50 text-charcoal-900 antialiased selection:bg-rosebrand/20 selection:text-charcoal-900">
        <AppProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
