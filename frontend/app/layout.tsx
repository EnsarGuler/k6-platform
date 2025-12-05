import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "k6 Test Platform",
  description: "Yük Testi Otomasyonu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-slate-50">
            <nav className="border-b bg-white px-8 py-4 flex items-center gap-6 sticky top-0 z-10 shadow-sm">
              <a
                href="/"
                className="font-bold text-xl text-blue-600 mr-4 hover:opacity-80 transition-opacity"
              >
                k6 Cockpit
              </a>
              <a
                href="/"
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Senaryolar
              </a>
              <a
                href="/tests"
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Test Oluştur & Çalıştır
              </a>
            </nav>

            <main>{children}</main>
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}
