"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, ArrowLeft, Loader2 } from "lucide-react";

export default function ReportsListPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/tests/runs/history")
      .then((res) => res.json())
      .then((data) => {
        setRuns(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Veri çekme hatası:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Başlık Alanı */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-500" />
              Geçmiş Test Raporları
            </h1>
            <p className="text-sm text-slate-400 mt-1 ml-11">
              Tamamlanan tüm yük testlerinin detaylı analizleri.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
            <p>Raporlar yükleniyor...</p>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950/50 text-slate-400 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="p-5 border-b border-slate-800">Test Adı</th>
                    <th className="p-5 border-b border-slate-800">Tarih</th>
                    <th className="p-5 border-b border-slate-800">Durum</th>
                    <th className="p-5 border-b border-slate-800">Max VUs</th>
                    <th className="p-5 border-b border-slate-800 text-right">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {runs.map((run) => (
                    <tr
                      key={run.id}
                      className="hover:bg-slate-800/50 transition duration-150 group"
                    >
                      <td className="p-5 font-medium text-white group-hover:text-indigo-300 transition-colors">
                        {run.test?.name || (
                          <span className="text-slate-600 italic">
                            Silinmiş Test
                          </span>
                        )}
                      </td>
                      <td className="p-5 text-slate-400 text-sm font-mono">
                        {new Date(run.createdAt).toLocaleString("tr-TR")}
                      </td>
                      <td className="p-5">
                        {/* KÖŞELİ ROZETLER (rounded-sm) */}
                        <span
                          className={`px-3 py-1 rounded-sm text-[11px] font-bold border tracking-wide uppercase ${
                            run.status === "COMPLETED"
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/50"
                              : run.status === "FAILED"
                              ? "bg-rose-950/40 text-rose-400 border-rose-800/50"
                              : "bg-amber-950/40 text-amber-400 border-amber-800/50"
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="p-5 text-slate-300 font-mono text-sm">
                        {run.resultSummary?.metrics?.vus?.values?.max || "-"}
                      </td>
                      <td className="p-5 text-right">
                        {/* SİYAHA YAKIN LACİVERT & KÖŞELİ BUTON */}
                        {/* bg-[#172554] = Blue-950 (Çok koyu lacivert) */}
                        <Link
                          href={`/reports/${run.id}`}
                          className="inline-flex items-center justify-center bg-[#172554] hover:bg-blue-900 border border-blue-900 text-white px-5 py-2 rounded-sm text-sm font-medium transition shadow-md"
                        >
                          Raporu Gör
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {runs.length === 0 && (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center border-t border-slate-800">
                <FileText className="w-12 h-12 mb-4 text-slate-700" />
                <p className="text-xl font-semibold text-slate-400">
                  Henüz hiç test kaydı bulunmuyor.
                </p>
                <p className="mt-2 text-sm max-w-sm mx-auto">
                  Yeni bir test başlatarak sistem performansını ölçmeye
                  başlayabilirsin.
                </p>
                <Link
                  href="/test/create"
                  className="mt-6 text-indigo-400 hover:text-indigo-300 text-sm font-medium hover:underline"
                >
                  + Yeni Test Başlat
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
