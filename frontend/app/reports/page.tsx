"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ReportsListPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Backend'den geçmişi çek (Port 3000 olduğundan emin ol)
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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-blue-400">
            📝 Geçmiş Test Raporları
          </h1>
          <Link
            href="/"
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm transition"
          >
            ← Ana Sayfaya Dön
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">
            Raporlar yükleniyor...
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
                <tr>
                  <th className="p-4 border-b border-gray-600">Test Adı</th>
                  <th className="p-4 border-b border-gray-600">Tarih</th>
                  <th className="p-4 border-b border-gray-600">Durum</th>
                  <th className="p-4 border-b border-gray-600">Max VUs</th>
                  <th className="p-4 border-b border-gray-600 text-right">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    className="hover:bg-gray-700/50 transition duration-150"
                  >
                    <td className="p-4 font-medium text-white">
                      {run.test?.name || (
                        <span className="text-gray-500">Silinmiş Test</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-400 text-sm">
                      {new Date(run.createdAt).toLocaleString("tr-TR")}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          run.status === "COMPLETED"
                            ? "bg-green-900/30 text-green-400 border-green-800"
                            : run.status === "FAILED"
                            ? "bg-red-900/30 text-red-400 border-red-800"
                            : "bg-yellow-900/30 text-yellow-400 border-yellow-800"
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300 font-mono">
                      {/* Güvenli erişim operatörü (?.) kullanıyoruz */}
                      {run.resultSummary?.metrics?.vus?.values?.max || "-"}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/reports/${run.id}`}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-md"
                      >
                        Raporu Gör
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {runs.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <p className="text-xl">📭 Henüz hiç test kaydı bulunmuyor.</p>
                <p className="mt-2 text-sm">
                  Yeni bir test başlatarak burayı doldurabilirsin.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
