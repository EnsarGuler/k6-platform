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

                <Link
                  href="/reports"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition"
                >
                  {/* İkon (Rapor ikonu) */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Raporlar</span>
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
