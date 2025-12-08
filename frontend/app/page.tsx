"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Activity,
  Layers,
  Play,
  Server,
  Zap,
  ChevronRight,
  BarChart3,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  // Verileri Çekelim (Özet Bilgi İçin)
  const { data: tests } = useQuery({
    queryKey: ["tests"],
    queryFn: async () => (await api.get("/tests")).data,
  });
  const { data: scenarios } = useQuery({
    queryKey: ["scenarios"],
    queryFn: async () => (await api.get("/scenarios")).data,
  });

  // İstatistikler
  const totalTests = tests?.length || 0;
  const totalScenarios = scenarios?.length || 0;
  const lastTest = tests && tests.length > 0 ? tests[tests.length - 1] : null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* BAŞLIK */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          k6 Otomasyon Kokpiti
        </h1>
        <p className="text-slate-500 text-lg">
          Sistem aktif ve testlere hazır.
        </p>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kart 1 */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Toplam Test
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTests}</div>
            <p className="text-xs text-slate-500 mt-1">
              çalıştırılan test sayısı
            </p>
          </CardContent>
        </Card>

        {/* Kart 2 */}
        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Senaryo Kütüphanesi
            </CardTitle>
            <Layers className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalScenarios}</div>
            <p className="text-xs text-slate-500 mt-1">hazır test parçacığı</p>
          </CardContent>
        </Card>

        {/* Kart 3 */}
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Sistem Durumu
            </CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">ONLINE</div>
            <p className="text-xs text-slate-500 mt-1">
              Docker servisleri aktif
            </p>
          </CardContent>
        </Card>
      </div>

      {/* HIZLI MENÜLER (BÜYÜK BUTONLAR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          onClick={() => router.push("/tests")}
          className="group cursor-pointer rounded-xl border bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Play className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600">
                Yeni Test Başlat
              </h3>
              <p className="text-slate-500">
                Hedef URL belirle ve yük testi oluştur.
              </p>
            </div>
            <ChevronRight className="w-6 h-6 ml-auto text-slate-300 group-hover:text-blue-500" />
          </div>
        </div>

        <div
          onClick={() => router.push("/scenarios")}
          className="group cursor-pointer rounded-xl border bg-white p-6 shadow-sm hover:border-orange-500 hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600">
                Senaryo Yönetimi
              </h3>
              <p className="text-slate-500">
                Kod kütüphanesini düzenle veya yeni ekle.
              </p>
            </div>
            <ChevronRight className="w-6 h-6 ml-auto text-slate-300 group-hover:text-orange-500" />
          </div>
        </div>
      </div>

      {/* SON AKTİVİTE */}
      {lastTest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Son Aktivite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
              <div>
                <p className="font-bold text-slate-800">{lastTest.name}</p>
                <p className="text-sm text-slate-500">
                  {lastTest.targetBaseUrl}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push(`/tests/${lastTest.id}`)}
              >
                Raporu Gör
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
