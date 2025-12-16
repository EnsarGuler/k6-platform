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
} from "lucide-react";
import { toast } from "sonner";

// --- 1. TEST TİPLERİ TANIMLAMASI ---
const TEST_TYPES = [
  {
    id: "load",
    title: "Load Test (Yük)",
    icon: <Scale className="w-8 h-8 text-blue-500" />,
    desc: "Sistemin normal, beklenen yük altındaki performansını ölçer.",
    color: "border-blue-200 bg-blue-50 hover:border-blue-500",
  },
  {
    id: "stress",
    title: "Stress Test (Stres)",
    icon: <TrendingUp className="w-8 h-8 text-red-500" />,
    desc: "Sistemin sınırlarını zorlar, kırılma noktasını bulana kadar yükü artırır.",
    color: "border-red-200 bg-red-50 hover:border-red-500",
  },
  {
    id: "spike",
    title: "Spike Test (Ani Yük)",
    icon: <Zap className="w-8 h-8 text-yellow-500" />,
    desc: "Ani trafik patlamalarında (örn: indirim anı) sistemin tepkisini ölçer.",
    color: "border-yellow-200 bg-yellow-50 hover:border-yellow-500",
  },
  {
    id: "soak",
    title: "Soak Test (Dayanıklılık)",
    icon: <Anchor className="w-8 h-8 text-purple-500" />,
    desc: "Uzun süreli yük altında bellek sızıntılarını kontrol eder.",
    color: "border-purple-200 bg-purple-50 hover:border-purple-500",
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

  // 3. TESTİ BAŞLAT (Burada "Test Reçetesini" Hazırlıyoruz 🧠)
  const startTestMutation = useMutation({
    mutationFn: async () => {
      // Otomatik isim oluştur
      const autoName =
        testName ||
        `${selectedType?.toUpperCase()} Test - ${new Date().toLocaleTimeString()}`;

      // --- TEST STRATEJİSİNİ OLUŞTUR ---
      let testOptions: any = {};
      const targetVus = Number(vus);

      switch (selectedType) {
        case "spike":
          // ⚡ SPIKE: 2 saniyede fırla, bekle, düş
          testOptions = {
            stages: [
              { duration: "2s", target: targetVus }, // Zirveye fırla
              { duration: duration, target: targetVus }, // Zirvede kal
              { duration: "5s", target: 0 }, // Hızlıca bitir
            ],
          };
          break;

        case "stress":
          // 📈 STRESS: Süre boyunca yavaş yavaş tırman
          testOptions = {
            stages: [
              { duration: duration, target: targetVus }, // Yavaşça artır
              { duration: "5s", target: 0 }, // Sonra düş
            ],
          };
          break;

        case "soak":
          // 🛁 SOAK: Yavaş çık, uzun kal
          testOptions = {
            stages: [
              { duration: "1m", target: targetVus }, // 1 dakikada ısın
              { duration: duration, target: targetVus }, // Asıl test süresi
              { duration: "1m", target: 0 }, // Soğuma
            ],
          };
          break;

        default:
          // ⚖️ LOAD: Sabit yük
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
        options: testOptions, // <-- Hazırladığımız reçeteyi gönderiyoruz
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
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* --- 1. SİHİRBAZ EKRANI (SEÇİM) --- */}
      {!selectedType ? (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Ne tür bir test yapmak istiyorsun?
            </h1>
            <p className="text-slate-500 text-lg">
              Stratejini seç, sistem otomatik yapılandırsın.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
            {TEST_TYPES.map((type) => (
              <div
                key={type.id}
                onClick={() => {
                  setSelectedType(type.id);
                  // Varsayılan Preset Değerler
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
                className={`cursor-pointer rounded-xl border-2 p-6 transition-all hover:scale-105 shadow-sm hover:shadow-lg ${type.color}`}
              >
                <div className="mb-4">{type.icon}</div>
                <h3 className="font-bold text-xl text-slate-900 mb-2">
                  {type.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {type.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* --- 2. AYAR EKRANI (FORM) --- */
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                {TEST_TYPES.find((t) => t.id === selectedType)?.icon}
                {TEST_TYPES.find((t) => t.id === selectedType)?.title} Oluştur
              </h2>
              <p className="text-slate-500 mt-1">
                Gerekli parametreleri ayarla.
              </p>
            </div>
            <Button variant="outline" onClick={() => setSelectedType(null)}>
              ← Geri Dön
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* SOL: PARAMETRELER */}
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
                    <Label>Hedef URL (BASE_URL)</Label>
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
                    <Activity className="w-5 h-5" />
                    {selectedType === "spike"
                      ? "Ani Yük Ayarları"
                      : selectedType === "stress"
                      ? "Stres Limitleri"
                      : "Yük Ayarları"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      {/* AKILLI ETİKETLER BURADA */}
                      <Label className="text-xs font-bold text-slate-600">
                        {selectedType === "stress"
                          ? "HEDEFLENEN MAX (VUs)"
                          : selectedType === "spike"
                          ? "ANLIK ZİRVE (VUs)"
                          : "KULLANICI SAYISI (VUs)"}
                      </Label>
                      <Input
                        type="number"
                        value={vus}
                        onChange={(e) => setVus(Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-600">
                        SÜRE
                      </Label>
                      <Input
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="text-xs bg-slate-50 text-slate-500 p-3 rounded border">
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
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold"
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

            {/* SAĞ: SENARYOLAR */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Senaryo Seçimi</CardTitle>
                  <CardDescription>
                    Bu sanal kullanıcılar sitede ne yapsın? (Login, Arama,
                    Gezinti vb.)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scenarios?.map((scenario) => (
                      <div
                        key={scenario.id}
                        className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:border-blue-300 transition-all ${
                          selectedScenarios.includes(scenario.id)
                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                            : ""
                        }`}
                        onClick={() => toggleScenario(scenario.id)}
                      >
                        <Checkbox
                          checked={selectedScenarios.includes(scenario.id)}
                        />
                        <div>
                          <Label className="cursor-pointer font-semibold">
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
      <div className="space-y-4 pt-8 border-t mt-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Test Geçmişi</h2>
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
                        return (
                          <tr
                            key={test.id}
                            className="border-b hover:bg-slate-100 cursor-pointer"
                            onClick={() => router.push(`/tests/${test.id}`)}
                          >
                            <td className="p-4 font-medium">{test.name}</td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(
                                  lastRun?.status || "PENDING"
                                )}`}
                              >
                                {lastRun?.status || "PENDING"}
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Silinsin mi?"))
                                    deleteMutation.mutate(test.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600" />
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
