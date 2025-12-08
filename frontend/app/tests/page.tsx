"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Scenario, Test } from "@/lib/types";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Activity, Globe, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateTestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- FORM STATE ---
  const [testName, setTestName] = useState("");
  const [targetUrl, setTargetUrl] = useState("https://test-api.k6.io");
  const [vus, setVus] = useState(5);
  const [duration, setDuration] = useState("10s");
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);

  // 1. Senaryoları Getir
  const { data: scenarios, isLoading: loadingScenarios } = useQuery<Scenario[]>(
    {
      queryKey: ["scenarios"],
      queryFn: async () => (await api.get("/scenarios")).data,
    }
  );

  // 2. Geçmiş Testleri Getir
  const { data: tests, isLoading: loadingTests } = useQuery<Test[]>({
    queryKey: ["tests"],
    queryFn: async () => (await api.get("/tests")).data,
    refetchInterval: 3000,
  });

  // 3. Test Başlatma
  const startTestMutation = useMutation({
    mutationFn: async () => {
      const createPayload = {
        name: testName || `Test - ${new Date().toLocaleTimeString()}`,
        projectId: "default-project",
        targetBaseUrl: targetUrl,
        selectedScenarioIds: selectedScenarios,
        options: { vus: Number(vus), duration: duration },
      };
      const createRes = await api.post("/tests", createPayload);
      const testId = createRes.data.id;

      await api.post(`/tests/${testId}/run`);
      return testId;
    },
    onSuccess: (testId) => {
      toast.success("Test Başlatıldı!");
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
    onError: (err: any) => {
      toast.error("Hata: " + (err.response?.data?.message || err.message));
    },
  });

  // 4. SİLME İŞLEMİ
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tests/${id}`);
    },
    onSuccess: () => {
      toast.success("Test silindi!");
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
    onError: () => toast.error("Silinemedi."),
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Satıra tıklamayı engelle
    if (confirm("Bu testi silmek istediğine emin misin?")) {
      deleteMutation.mutate(id);
    }
  };

  const toggleScenario = (id: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleStart = () => {
    if (selectedScenarios.length === 0) {
      toast.warning("Lütfen en az bir senaryo seçin!");
      return;
    }
    startTestMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200";
      case "RUNNING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse";
      case "FAILED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      {/* ÜST KISIM: TEST OLUŞTURUCU */}
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Test Oluşturucu
          </h1>
          <p className="text-slate-500 mt-1">
            Parametreleri belirleyin ve k6 motorunu ateşleyin.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" /> Hedef
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Test Adı</Label>
                  <Input
                    placeholder="Otomatik İsim"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hedef URL</Label>
                  <Input
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" /> Yük
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>VUs</Label>
                    <Input
                      type="number"
                      value={vus}
                      onChange={(e) => setVus(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Süre</Label>
                    <Input
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
              onClick={handleStart}
              disabled={startTestMutation.isPending}
            >
              {startTestMutation.isPending ? (
                "Başlatılıyor..."
              ) : (
                <span className="flex gap-2">
                  <Play fill="currentColor" /> TESTİ BAŞLAT
                </span>
              )}
            </Button>
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Senaryo Seçimi</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingScenarios ? (
                  <div>Yükleniyor...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scenarios?.map((scenario) => (
                      <div
                        key={scenario.id}
                        className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:border-blue-300 transition-all ${
                          selectedScenarios.includes(scenario.id)
                            ? "border-blue-500 bg-blue-50"
                            : ""
                        }`}
                        onClick={() => toggleScenario(scenario.id)}
                      >
                        <Checkbox
                          checked={selectedScenarios.includes(scenario.id)}
                        />
                        <div>
                          <Label className="cursor-pointer">
                            {scenario.name}
                          </Label>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {scenario.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ALT KISIM: TEST GEÇMİŞİ */}
      <div className="space-y-4 pt-8 border-t">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Son Testler</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["tests"] })
            }
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Yenile
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm text-left">
                <thead className="bg-slate-50 [&_tr]:border-b">
                  <tr className="border-b transition-colors">
                    <th className="h-12 px-4 font-medium text-slate-500">
                      Test Adı
                    </th>
                    <th className="h-12 px-4 font-medium text-slate-500">
                      Durum
                    </th>
                    <th className="h-12 px-4 font-medium text-slate-500">
                      Hedef
                    </th>
                    <th className="h-12 px-4 font-medium text-slate-500">
                      Tarih
                    </th>
                    <th className="h-12 px-4 font-medium text-slate-500 w-[50px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTests ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center">
                        Yükleniyor...
                      </td>
                    </tr>
                  ) : (
                    tests
                      ?.slice()
                      .reverse()
                      .map((test) => {
                        const lastRun =
                          test.runs && test.runs.length > 0
                            ? test.runs[test.runs.length - 1]
                            : null;
                        const status = lastRun ? lastRun.status : "PENDING";

                        return (
                          <tr
                            key={test.id}
                            className="border-b transition-colors hover:bg-slate-100 cursor-pointer"
                            onClick={() => router.push(`/tests/${test.id}`)}
                          >
                            <td className="p-4 font-medium">{test.name}</td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(
                                  status
                                )}`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500">
                              {test.targetBaseUrl}
                            </td>
                            <td className="p-4 text-slate-500">
                              {lastRun
                                ? new Date(lastRun.createdAt).toLocaleString(
                                    "tr-TR"
                                  )
                                : "-"}
                            </td>
                            <td className="p-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => handleDelete(e, test.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
