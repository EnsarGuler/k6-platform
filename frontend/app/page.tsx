"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Activity, FileText, CheckCircle, Loader2 } from "lucide-react";

export default function DashboardPage() {
  // 1. SENARYOLARI ÇEK (Sayısını göstermek için)
  const { data: scenarios, isLoading: loadingScenarios } = useQuery({
    queryKey: ["scenarios"],
    queryFn: async () => (await api.get("/scenarios")).data,
  });

  // 2. GEÇMİŞ TEST KOŞULARINI ÇEK (Toplam test sayısını göstermek için)
  const { data: runs, isLoading: loadingRuns } = useQuery({
    queryKey: ["history"],
    queryFn: async () => (await api.get("/tests/runs/history")).data,
  });

  // Yükleniyor durumu kontrolü
  const isLoading = loadingScenarios || loadingRuns;

  // Veriler
  const totalScenarios = scenarios?.length || 0;
  const totalRuns = runs?.length || 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
      <div className="max-w-7xl mx-auto">
        {/* Üst Başlık */}
        <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Platform Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Sistem durumu ve son aktiviteler
            </p>
          </div>
          <Link
            href="/test/create"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-900/20 transition"
          >
            + Yeni Test Başlat
          </Link>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Toplam Test Koşusu"
            value={
              isLoading ? (
                <Loader2 className="animate-spin w-8 h-8" />
              ) : (
                totalRuns
              )
            }
            sub="Bugüne kadar yapılan"
            icon={<Activity className="w-6 h-6" />}
            color="text-indigo-400"
          />
          <StatCard
            title="Aktif Senaryo"
            value={
              isLoading ? (
                <Loader2 className="animate-spin w-8 h-8" />
              ) : (
                totalScenarios
              )
            }
            sub="Kütüphanede kayıtlı"
            icon={<FileText className="w-6 h-6" />}
            color="text-emerald-400"
          />
          <StatCard
            title="Sistem Sağlığı"
            value="%100"
            sub="Tüm servisler aktif"
            icon={<CheckCircle className="w-6 h-6" />}
            color="text-green-500"
          />
        </div>

        {/* Alt Paneller */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sol: Hızlı İşlemler */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Hızlı Erişim
            </h2>
            <div className="space-y-3">
              <QuickLink
                href="/scenarios"
                title="Senaryoları Yönet"
                desc="Test senaryolarını düzenle veya ekle"
              />
              <QuickLink
                href="/reports"
                title="Raporları İncele"
                desc="Geçmiş test sonuçlarına göz at"
              />
              <QuickLink
                href="/test/create"
                title="Hızlı Test Başlat"
                desc="Ayarları yap ve hemen test et"
              />
            </div>
          </div>

          {/* Sağ: Sistem Bilgisi */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
              Sistem Bilgileri
            </h2>
            <div className="space-y-4 text-sm">
              <InfoRow
                label="Backend Durumu"
                value="Online"
                color="text-emerald-400 font-bold"
              />
              <InfoRow label="Worker Node" value="1 Aktif" />
              <InfoRow label="k6 Sürümü" value="v0.47.0" />
              <InfoRow label="Veritabanı" value="PostgreSQL" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Bileşenler ---

function StatCard({ title, value, sub, icon, color }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl hover:border-slate-700 transition duration-200 shadow-sm group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {title}
          </p>
          <div
            className={`text-3xl font-bold mt-2 text-white flex items-center gap-2`}
          >
            {value}
          </div>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <span
          className={`p-3 rounded-lg bg-slate-950 border border-slate-800 ${color} group-hover:scale-110 transition-transform`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

function QuickLink({ href, title, desc }: any) {
  return (
    <Link
      href={href}
      className="block group p-4 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-slate-200 font-semibold group-hover:text-white text-sm">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
        </div>
        <span className="text-slate-600 text-lg group-hover:translate-x-1 transition-transform">
          →
        </span>
      </div>
    </Link>
  );
}

function InfoRow({ label, value, color = "text-slate-300" }: any) {
  return (
    <div className="flex justify-between border-b border-slate-800/50 pb-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}
