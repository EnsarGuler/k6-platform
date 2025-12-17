"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Scenario, Test } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Play,
  Activity,
  Globe,
  RefreshCcw,
  Trash2,
  Zap,
  TrendingUp,
  Anchor,
  Scale,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

// --- 1. TEST TİPLERİ (DARK MODE RENKLERİ) ---
const TEST_TYPES = [
  {
    id: "load",
    title: "Load Test (Yük)",
    icon: <Scale className="w-8 h-8 text-blue-400" />,
    desc: "Sistemin normal, beklenen yük altındaki performansını ölçer.",
    // Dark mode uyumlu hover ve border renkleri
    className:
      "border-slate-800 bg-slate-900 hover:border-blue-500 hover:bg-blue-950/20 hover:shadow-blue-900/20",
  },
  {
    id: "stress",
    title: "Stress Test (Stres)",
    icon: <TrendingUp className="w-8 h-8 text-rose-400" />,
    desc: "Sistemin sınırlarını zorlar, kırılma noktasını bulana kadar yükü artırır.",
    className:
      "border-slate-800 bg-slate-900 hover:border-rose-500 hover:bg-rose-950/20 hover:shadow-rose-900/20",
  },
  {
    id: "spike",
    title: "Spike Test (Ani Yük)",
    icon: <Zap className="w-8 h-8 text-amber-400" />,
    desc: "Ani trafik patlamalarında (örn: indirim anı) sistemin tepkisini ölçer.",
    className:
      "border-slate-800 bg-slate-900 hover:border-amber-500 hover:bg-amber-950/20 hover:shadow-amber-900/20",
  },
  {
    id: "soak",
    title: "Soak Test (Dayanıklılık)",
    icon: <Anchor className="w-8 h-8 text-purple-400" />,
    desc: "Uzun süreli yük altında bellek sızıntılarını kontrol eder.",
    className:
      "border-slate-800 bg-slate-900 hover:border-purple-500 hover:bg-purple-950/20 hover:shadow-purple-900/20",
  },
];

export default function CreateTestPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // --- STATE ---
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const [testName, setTestName] = useState("");
  const [targetUrl, setTargetUrl] = useState("https://test-api.k6.io");
  const [vus, setVus] = useState(10);
  const [duration, setDuration] = useState("30s");
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);

  // 1. SENARYOLARI GETİR
  const { data: scenarios } = useQuery<Scenario[]>({
    queryKey: ["scenarios"],
    queryFn: async () => (await api.get("/scenarios")).data,
  });

  // 2. GEÇMİŞ TESTLERİ GETİR
  const { data: tests, isLoading: loadingTests } = useQuery<Test[]>({
    queryKey: ["tests"],
    queryFn: async () => (await api.get("/tests")).data,
    refetchInterval: 3000,
  });

  // 3. TESTİ BAŞLAT
  const startTestMutation = useMutation({
    mutationFn: async () => {
      const autoName =
        testName ||
        `${selectedType?.toUpperCase()} Test - ${new Date().toLocaleTimeString()}`;

      let testOptions: any = {};
      const targetVus = Number(vus);

      switch (selectedType) {
        case "spike":
          testOptions = {
            stages: [
              { duration: "2s", target: targetVus },
              { duration: duration, target: targetVus },
              { duration: "5s", target: 0 },
            ],
          };
          break;

        case "stress":
          testOptions = {
            stages: [
              { duration: duration, target: targetVus },
              { duration: "5s", target: 0 },
            ],
          };
          break;

        case "soak":
          testOptions = {
            stages: [
              { duration: "1m", target: targetVus },
              { duration: duration, target: targetVus },
              { duration: "1m", target: 0 },
            ],
          };
          break;

        default:
          testOptions = {
            vus: targetVus,
            duration: duration,
          };
          break;
      }

      const createPayload = {
        name: autoName,
        projectId: "default-project",
        targetBaseUrl: targetUrl,
        selectedScenarioIds: selectedScenarios,
        options: testOptions,
      };

      const createRes = await api.post("/tests", createPayload);
      const testId = createRes.data.id;

      await api.post(`/tests/${testId}/run`);
      return testId;
    },
    onSuccess: (testId) => {
      toast.success(`${selectedType?.toUpperCase()} Testi Başlatıldı! 🚀`);
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
      toast.success("Test silindi.");
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });

  const handleStart = () => {
    if (selectedScenarios.length === 0) {
      toast.warning("Lütfen en az bir senaryo seçin!");
      return;
    }
    startTestMutation.mutate();
  };

  const toggleScenario = (id: string) => {
    setSelectedScenarios((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-950/40 text-emerald-400 border-emerald-800/50";
      case "RUNNING":
        return "bg-amber-950/40 text-amber-400 border-amber-800/50 animate-pulse";
      case "FAILED":
        return "bg-rose-950/40 text-rose-400 border-rose-800/50";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* --- 1. SİHİRBAZ EKRANI (SEÇİM) --- */}
        {!selectedType ? (
          <div className="space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Ne tür bir test yapmak istiyorsun?
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Test stratejini belirle, gerisini platforma bırak. Otomatik
                yapılandırma ile hemen başla.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
              {TEST_TYPES.map((type) => (
                <div
                  key={type.id}
                  onClick={() => {
                    setSelectedType(type.id);
                    // Varsayılan Değerler
                    if (type.id === "stress") {
                      setVus(50);
                      setDuration("1m");
                    } else if (type.id === "spike") {
                      setVus(100);
                      setDuration("30s");
                    } else if (type.id === "soak") {
                      setVus(10);
                      setDuration("10m");
                    } else {
                      setVus(10);
                      setDuration("30s");
                    }
                  }}
                  className={`group cursor-pointer rounded-xl border-2 p-6 transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-xl ${type.className}`}
                >
                  <div className="mb-5 p-3 rounded-lg bg-slate-950 w-fit border border-slate-800 group-hover:border-slate-700 transition-colors">
                    {type.icon}
                  </div>
                  <h3 className="font-bold text-xl text-white mb-3 group-hover:text-indigo-300 transition-colors">
                    {type.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300">
                    {type.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* --- 2. AYAR EKRANI (FORM) --- */
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
                  {TEST_TYPES.find((t) => t.id === selectedType)?.icon}
                  {TEST_TYPES.find((t) => t.id === selectedType)?.title}{" "}
                  Yapılandırması
                </h2>
                <p className="text-slate-400 mt-2">
                  Hedef URL ve kullanıcı parametrelerini belirle.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedType(null)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Geri Dön
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* SOL: PARAMETRELER */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-slate-900 border-slate-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white text-lg">
                      <Globe className="w-5 h-5 text-indigo-400" /> Hedef
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Test Adı
                      </Label>
                      <Input
                        placeholder="Otomatik İsim (İsteğe bağlı)"
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        className="bg-slate-950 border-slate-700 text-white placeholder-slate-700 focus-visible:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase">
                        Hedef URL (Base URL)
                      </Label>
                      <Input
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        className="bg-slate-950 border-slate-700 text-white placeholder-slate-700 focus-visible:ring-indigo-500"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white text-lg">
                      <Activity className="w-5 h-5 text-emerald-400" />
                      {selectedType === "spike"
                        ? "Ani Yük Ayarları"
                        : selectedType === "stress"
                        ? "Stres Limitleri"
                        : "Yük Ayarları"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {selectedType === "stress"
                            ? "MAX KULLANICI"
                            : selectedType === "spike"
                            ? "ANLIK ZİRVE"
                            : "VIRTUAL USERS"}
                        </Label>
                        <Input
                          type="number"
                          value={vus}
                          onChange={(e) => setVus(Number(e.target.value))}
                          className="bg-slate-950 border-slate-700 text-white font-mono focus-visible:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          SÜRE
                        </Label>
                        <Input
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="bg-slate-950 border-slate-700 text-white font-mono focus-visible:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="text-xs bg-slate-950 text-slate-400 p-3 rounded border border-slate-800 leading-relaxed">
                      {selectedType === "stress" &&
                        "ℹ️ Sistem, testi 0'dan başlatıp bu sayıya kadar kademeli artıracaktır."}
                      {selectedType === "spike" &&
                        "ℹ️ Sistem, aniden bu sayıya fırlayıp sunucuyu şoka uğratacaktır."}
                      {selectedType === "load" &&
                        "ℹ️ Belirlenen süre boyunca sabit olarak bu kadar kullanıcı sitede gezinecektir."}
                      {selectedType === "soak" &&
                        "ℹ️ Sistem, uzun süre bu yükte kalarak dayanıklılık testi yapacaktır."}
                    </div>
                  </CardContent>
                </Card>

                <Button
                  size="lg"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-900/20 transition-all"
                  onClick={handleStart}
                  disabled={startTestMutation.isPending}
                >
                  {startTestMutation.isPending ? (
                    "Başlatılıyor..."
                  ) : (
                    <span className="flex gap-2 items-center">
                      <Play fill="currentColor" className="w-4 h-4" /> TESTİ
                      BAŞLAT
                    </span>
                  )}
                </Button>
              </div>

              {/* SAĞ: SENARYOLAR */}
              <div className="lg:col-span-2">
                <Card className="h-full bg-slate-900 border-slate-800 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-white">Senaryo Seçimi</CardTitle>
                    <CardDescription className="text-slate-400">
                      Bu sanal kullanıcılar sitede ne yapsın? En az birini
                      seçin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {scenarios?.map((scenario) => (
                        <div
                          key={scenario.id}
                          onClick={() => toggleScenario(scenario.id)}
                          className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all duration-200 ${
                            selectedScenarios.includes(scenario.id)
                              ? "border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500/50"
                              : "border-slate-800 bg-slate-950 hover:border-slate-600"
                          }`}
                        >
                          <Checkbox
                            checked={selectedScenarios.includes(scenario.id)}
                            className="border-slate-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                          />
                          <div>
                            <Label className="cursor-pointer font-semibold text-slate-200">
                              {scenario.name}
                            </Label>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                              {scenario.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* --- 3. GEÇMİŞ TESTLER --- */}
        <div className="space-y-4 pt-8 border-t border-slate-800 mt-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Test Geçmişi
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["tests"] })
              }
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Yenile
            </Button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm text-left">
                <thead className="bg-slate-950/50 text-slate-400 uppercase text-xs font-bold">
                  <tr className="border-b border-slate-800">
                    <th className="h-12 px-4 font-bold">Test Adı</th>
                    <th className="h-12 px-4 font-bold">Durum</th>
                    <th className="h-12 px-4 font-bold">Hedef</th>
                    <th className="h-12 px-4 font-bold">Tarih</th>
                    <th className="h-12 px-4 font-bold w-[50px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loadingTests ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-slate-500"
                      >
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
                        return (
                          <tr
                            key={test.id}
                            className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/tests/${test.id}`)}
                          >
                            <td className="p-4 font-medium text-slate-200">
                              {test.name}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-sm text-[11px] font-bold border uppercase tracking-wider ${getStatusColor(
                                  lastRun?.status || "PENDING"
                                )}`}
                              >
                                {lastRun?.status || "PENDING"}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 font-mono text-xs">
                              {test.targetBaseUrl}
                            </td>
                            <td className="p-4 text-slate-500 font-mono text-xs">
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
                                className="text-slate-500 hover:text-red-400 hover:bg-red-950/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Silinsin mi?"))
                                    deleteMutation.mutate(test.id);
                                }}
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
          </div>
        </div>
      </div>
    </div>
  );
}
