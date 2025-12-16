"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ReportDetailPage() {
  const params = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.runId) return;

    fetch(`http://localhost:3000/tests/run/${params.runId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Rapor verisi sunucudan alınamadı.");
        return res.json();
      })
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [params.runId]);

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        Rapor yükleniyor...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <h1 className="text-xl font-bold text-red-400 mb-2">Bir Hata Oluştu</h1>
        <p className="text-gray-400 mb-4">{error}</p>
        <Link href="/reports" className="bg-gray-700 px-4 py-2 rounded">
          Listeye Dön
        </Link>
      </div>
    );

  if (!report) return null;

  // --- AKILLI VERİ OKUYUCU ---
  const findVal = (
    metricName: string,
    keys: string[],
    isFloat = false
  ): number => {
    try {
      const metrics = report.resultSummary?.metrics;
      if (!metrics || !metrics[metricName]) return 0;

      const targetMetric = metrics[metricName];

      for (const key of keys) {
        if (targetMetric.values && targetMetric.values[key] !== undefined) {
          return Number(targetMetric.values[key]);
        }
        if (targetMetric[key] !== undefined) {
          return Number(targetMetric[key]);
        }
      }
      return 0;
    } catch (e) {
      return 0;
    }
  };

  // --- HESAPLAMALAR (Manuel Matematik) ---

  // 1. Toplam İstek
  const totalReqs = findVal("http_reqs", ["count"]);

  // 2. Hatalı İstek (KRİTİK DÜZELTME: 'passes' alanı failed count'u tutar)
  // http_req_failed metriğinde:
  // passes = Hata Sayısı (True dönenler)
  // fails  = Başarı Sayısı (False dönenler)
  const failedReqs = findVal("http_req_failed", ["passes"]);

  // 3. Hata Oranını Kendimiz Hesaplıyoruz (En Garantisi)
  let failureRate = "0.00";
  if (totalReqs > 0) {
    failureRate = ((failedReqs / totalReqs) * 100).toFixed(2);
  }

  const vusMax = findVal("vus", ["max", "value"]);

  // Test Süresi
  let duration = "0.0";
  if (report.resultSummary?.state?.testRunDurationMs) {
    duration = (report.resultSummary.state.testRunDurationMs / 1000).toFixed(1);
  } else if (report.createdAt && report.endedAt) {
    const start = new Date(report.createdAt).getTime();
    const end = new Date(report.endedAt).getTime();
    duration = ((end - start) / 1000).toFixed(1);
  }

  // Gecikme (Latency)
  const avgDuration = findVal("http_req_duration", ["avg"], true).toFixed(2);
  const maxDuration = findVal("http_req_duration", ["max"], true).toFixed(2);

  let p95Raw = findVal("http_req_duration", ["p(95)"], true);
  if (p95Raw === 0) p95Raw = findVal("http_req_duration", ["p(90)"], true);
  const p95Duration = p95Raw.toFixed(2);

  // Data
  const dataReceivedMB = (
    findVal("data_received", ["count"]) /
    1024 /
    1024
  ).toFixed(2);
  const dataSentKB = (findVal("data_sent", ["count"]) / 1024).toFixed(2);
  const rps = findVal("http_reqs", ["rate"], true).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Üst Başlık */}
        <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">
                {report.test?.name || "İsimsiz Test"}
              </h1>
              <span
                className={`px-3 py-1 text-sm rounded-full font-bold ${
                  report.status === "COMPLETED" ? "bg-green-600" : "bg-red-600"
                }`}
              >
                {report.status}
              </span>
            </div>
            <p className="text-gray-400 mt-1 text-sm">
              Run ID:{" "}
              <span className="font-mono text-gray-500">{report.id}</span> •{" "}
              {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
          <Link
            href="/reports"
            className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded border border-gray-700 transition"
          >
            ← Listeye Dön
          </Link>
        </div>

        {/* 4 Ana Kart */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Toplam İstek" value={totalReqs} icon="📦" />
          <StatCard
            title="Hatalı İstek"
            value={`${failedReqs} (%${failureRate})`}
            icon="🔥"
            color={failedReqs > 0 ? "text-red-400" : "text-green-400"}
          />
          <StatCard
            title="Maksimum VUs"
            value={vusMax}
            icon="👥"
            color="text-blue-400"
          />
          <StatCard title="Test Süresi" value={`${duration} sn`} icon="⏱️" />
        </div>

        {/* Detaylı Analiz Paneli */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sol: Gecikme Süreleri */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
              ⚡ Gecikme (Latency) Analizi
            </h2>
            <div className="space-y-4">
              <Row label="Ortalama Süre" value={`${avgDuration} ms`} />
              <Row
                label="P95 (%95'i bundan hızlı)"
                value={`${p95Duration} ms`}
                highlight
              />
              <Row
                label="En Yavaş İstek (Max)"
                value={`${maxDuration} ms`}
                color="text-red-400"
              />
            </div>
          </div>

          {/* Sağ: Verim (Throughput) */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-purple-400 flex items-center gap-2">
              📊 Verim & Ağ
            </h2>
            <div className="space-y-4">
              <Row label="Saniye Başına İstek (RPS)" value={`${rps} req/s`} />
              <Row label="Toplam Alınan Veri" value={`${dataReceivedMB} MB`} />
              <Row label="Toplam Gönderilen Veri" value={`${dataSentKB} KB`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- YARDIMCI BİLEŞENLER ---

function StatCard({ title, value, icon, color = "text-white" }: any) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg hover:border-gray-500 transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">
            {title}
          </p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className="text-3xl opacity-20 grayscale-0">{icon}</div>
      </div>
    </div>
  );
}

function Row({ label, value, color = "text-white", highlight = false }: any) {
  return (
    <div
      className={`flex justify-between items-center p-3 rounded ${
        highlight
          ? "bg-gray-700/50 border border-gray-600"
          : "border-b border-gray-700/50"
      }`}
    >
      <span className="text-gray-400">{label}</span>
      <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}
