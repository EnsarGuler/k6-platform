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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-gray-400 font-mono">
        <span className="animate-pulse">SYSTEM_LOADING...</span>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <h1 className="text-xl font-bold text-red-500 mb-2 font-mono">
          SYSTEM_ERROR
        </h1>
        <p className="text-gray-500 mb-4">{error}</p>
        <Link
          href="/reports"
          className="text-blue-400 hover:underline font-mono text-sm"
        >
          Return to Index
        </Link>
      </div>
    );

  if (!report) return null;

  // --- VERİ İŞLEME MANTIĞI (Dokunulmadı) ---
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
        if (targetMetric.values && targetMetric.values[key] !== undefined)
          return Number(targetMetric.values[key]);
        if (targetMetric[key] !== undefined) return Number(targetMetric[key]);
      }
      return 0;
    } catch (e) {
      return 0;
    }
  };

  const totalReqs = findVal("http_reqs", ["count"]);
  const failedReqs = findVal("http_req_failed", ["passes"]);
  let failureRate = "0.00";
  if (totalReqs > 0) failureRate = ((failedReqs / totalReqs) * 100).toFixed(2);
  const vusMax = findVal("vus", ["max", "value"]);

  let duration = "0.0";
  if (report.resultSummary?.state?.testRunDurationMs) {
    duration = (report.resultSummary.state.testRunDurationMs / 1000).toFixed(1);
  } else if (report.createdAt && report.endedAt) {
    const start = new Date(report.createdAt).getTime();
    const end = new Date(report.endedAt).getTime();
    duration = ((end - start) / 1000).toFixed(1);
  }

  const avgDuration = findVal("http_req_duration", ["avg"], true).toFixed(2);
  const maxDuration = findVal("http_req_duration", ["max"], true).toFixed(2);
  let p95Raw = findVal("http_req_duration", ["p(95)"], true);
  if (p95Raw === 0) p95Raw = findVal("http_req_duration", ["p(90)"], true);
  const p95Duration = p95Raw.toFixed(2);
  const dataReceivedMB = (
    findVal("data_received", ["count"]) /
    1024 /
    1024
  ).toFixed(2);
  const dataSentKB = (findVal("data_sent", ["count"]) / 1024).toFixed(2);
  const rps = findVal("http_reqs", ["rate"], true).toFixed(2);

  return (
    // Arka planı zorla #0a0a0a (Simsiyah) yapıyoruz
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Arka Plan Deseni */}
      <div className="absolute inset-0 bg-tech-pattern opacity-20 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header - Minimalist */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b border-gray-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                {report.test?.name || "Unnamed Test Execution"}
              </h1>
              <span
                className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold rounded border ${
                  report.status === "COMPLETED"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {report.status}
              </span>
            </div>
            <div className="mt-2 text-xs font-mono text-gray-500 flex items-center gap-4">
              <span>ID: {report.id}</span>
              <span>|</span>
              <span>{new Date(report.createdAt).toLocaleString("tr-TR")}</span>
            </div>
          </div>
          <Link
            href="/reports"
            className="mt-4 md:mt-0 text-sm font-medium text-gray-400 hover:text-white transition flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              ←
            </span>{" "}
            Back to Overview
          </Link>
        </div>

        {/* KPI Grid - Kurumsal Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <TechCard
            label="Total Requests"
            value={totalReqs.toLocaleString()}
            unit="reqs"
            icon={<ServerIcon />}
          />
          <TechCard
            label="Error Rate"
            value={`%${failureRate}`}
            unit={failedReqs + " errors"}
            icon={<AlertIcon />}
            highlight={Number(failureRate) > 0} // Hata varsa kırmızı yap
          />
          <TechCard
            label="Concurrency"
            value={vusMax}
            unit="Max VUs"
            icon={<UsersIcon />}
          />
          <TechCard
            label="Duration"
            value={duration}
            unit="seconds"
            icon={<ClockIcon />}
          />
        </div>

        {/* Detay Panelleri */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latency Panel */}
          <div className="bg-[#111] border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
              <ActivityIcon className="text-blue-500" />
              <h2 className="text-sm font-bold text-gray-100 uppercase tracking-wider">
                Latency Metrics
              </h2>
            </div>

            <div className="space-y-4">
              <MetricRow
                label="Avg Response Time"
                value={`${avgDuration} ms`}
              />
              <MetricRow
                label="P95 (95th Percentile)"
                value={`${p95Duration} ms`}
                highlightColor="text-blue-400"
              />
              <MetricRow
                label="Max Response Time"
                value={`${maxDuration} ms`}
                highlightColor="text-orange-400"
              />
            </div>
          </div>

          {/* Throughput Panel */}
          <div className="bg-[#111] border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
              <NetworkIcon className="text-purple-500" />
              <h2 className="text-sm font-bold text-gray-100 uppercase tracking-wider">
                Throughput & Network
              </h2>
            </div>

            <div className="space-y-4">
              <MetricRow
                label="Requests Per Second"
                value={`${rps} req/s`}
                highlightColor="text-purple-400"
              />
              <MetricRow label="Data Received" value={`${dataReceivedMB} MB`} />
              <MetricRow label="Data Sent" value={`${dataSentKB} KB`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- PROFESYONEL UI BİLEŞENLERİ ---

function TechCard({ label, value, unit, icon, highlight = false }: any) {
  return (
    <div
      className={`bg-[#111] border ${
        highlight ? "border-red-900/50 bg-red-900/10" : "border-gray-800"
      } rounded-lg p-5 flex flex-col justify-between hover:border-gray-600 transition duration-200`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
          {label}
        </span>
        <div className={`${highlight ? "text-red-400" : "text-gray-600"}`}>
          {icon}
        </div>
      </div>
      <div>
        <div
          className={`text-2xl font-mono font-medium ${
            highlight ? "text-red-400" : "text-gray-100"
          }`}
        >
          {value}
        </div>
        <div className="text-xs text-gray-500 mt-1 font-mono">{unit}</div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, highlightColor = "text-gray-200" }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-800/50 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`font-mono text-sm ${highlightColor}`}>{value}</span>
    </div>
  );
}

// --- SVG İKONLAR (EMOJİ YERİNE) ---
// Bu ikonlar "Lucide" tarzı temiz vektörlerdir.

const ServerIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
    <line x1="6" x2="6.01" y1="6" y2="6" />
    <line x1="6" x2="6.01" y1="18" y2="18" />
  </svg>
);

const AlertIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ClockIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ActivityIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const NetworkIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="16" y="16" width="6" height="6" rx="1" />
    <rect x="2" y="16" width="6" height="6" rx="1" />
    <rect x="9" y="2" width="6" height="6" rx="1" />
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
    <path d="M12 12V8" />
  </svg>
);
