import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "sonner";
import Link from "next/link"; // Link eklendi

// İkonlar eklendi
import { LayoutDashboard, PlayCircle, LibraryBig, Box } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "k6 Platform",
  description: "Load Testing Platform",
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
          {/* ANA LAYOUT YAPISI */}
          <div className="flex h-screen bg-slate-50">
            {/* SOL SIDEBAR */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl">
              <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <Box className="w-8 h-8 text-blue-500" />
                <h1 className="text-xl font-bold text-white">k6 Platform</h1>
              </div>

              <nav className="flex-1 p-4 space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/tests"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  <span>Test Oluştur</span>
                </Link>

                <Link
                  href="/scenarios"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <LibraryBig className="w-5 h-5" />
                  <span>Senaryolar</span>
                </Link>
              </nav>

              <div className="p-4 border-t border-slate-800 text-xs text-center text-slate-500">
                v1.0.0 • Full Stack
              </div>
            </aside>

            {/* SAĞ TARAF (İÇERİK) */}
            <main className="flex-1 overflow-auto">{children}</main>
          </div>

          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
}
