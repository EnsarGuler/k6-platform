"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Scenario } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Plus, Code2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export default function ScenariosPage() {
  const queryClient = useQueryClient();

  // --- FORM STATE ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scriptFragment, setScriptFragment] = useState("");

  // DÜZENLEME MODU
  const [editingId, setEditingId] = useState<string | null>(null);

  // 1. LİSTELEME
  const { data: scenarios, isLoading } = useQuery<Scenario[]>({
    queryKey: ["scenarios"],
    queryFn: async () => (await api.get("/scenarios")).data,
  });

  // 2. KAYDETME
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, description, scriptFragment };

      if (editingId) {
        await api.patch(`/scenarios/${editingId}`, payload);
      } else {
        await api.post("/scenarios", payload);
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Senaryo güncellendi!" : "Senaryo eklendi!");
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      resetForm();
    },
    onError: () => toast.error("İşlem başarısız."),
  });

  // 3. SİLME
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/scenarios/${id}`);
    },
    onSuccess: () => {
      toast.success("Senaryo silindi.");
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      if (editingId) resetForm();
    },
    onError: () => toast.error("Silinemedi."),
  });

  const handleEdit = (scenario: Scenario) => {
    setEditingId(scenario.id);
    setName(scenario.name);
    setDescription(scenario.description || "");
    setScriptFragment(scenario.scriptFragment);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (confirm("Bu senaryoyu silmek istediğine emin misin?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setScriptFragment("");
  };

  return (
    // ANA KAPLAYICI: Koyu Arka Plan
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* BAŞLIK ALANI */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Senaryo Kütüphanesi
          </h1>
          {editingId && (
            <Button
              variant="outline"
              onClick={resetForm}
              className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <X className="w-4 h-4" /> İptal Et (Yeni Ekle)
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- SOL TARA: FORM --- */}
          <div className="lg:col-span-1">
            <Card
              className={`sticky top-8 bg-slate-900 border-slate-800 shadow-xl ${
                editingId
                  ? "border-indigo-500/50 ring-1 ring-indigo-500/20"
                  : ""
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  {editingId ? (
                    <Pencil className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <Plus className="w-5 h-5 text-emerald-400" />
                  )}
                  {editingId ? "Senaryoyu Düzenle" : "Yeni Senaryo Ekle"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs font-bold uppercase tracking-wide">
                    Senaryo Adı
                  </Label>
                  <Input
                    placeholder="Örn: Login Test"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    // Input Dark Mode
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs font-bold uppercase tracking-wide">
                    Açıklama
                  </Label>
                  <Input
                    placeholder="Ne işe yarar?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs font-bold uppercase tracking-wide">
                    k6 Kodu (Fonksiyon)
                  </Label>
                  <Textarea
                    // Textarea Dark Mode + Kod Rengi
                    className="font-mono text-xs h-64 bg-slate-950 border-slate-700 text-emerald-400 placeholder:text-slate-700 focus-visible:ring-indigo-500"
                    placeholder={`export function MyTest() {\n  http.get(BASE_URL);\n}`}
                    value={scriptFragment}
                    onChange={(e) => setScriptFragment(e.target.value)}
                  />
                </div>
                <Button
                  className={`w-full font-semibold transition-all shadow-lg ${
                    editingId
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20"
                  }`}
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending
                    ? "Kaydediliyor..."
                    : editingId
                    ? "Güncellemeyi Kaydet"
                    : "Kütüphaneye Ekle"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* --- SAĞ TARAF: LİSTE --- */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <div className="text-slate-500 text-center py-10 animate-pulse">
                Veriler yükleniyor...
              </div>
            ) : (
              scenarios
                ?.slice()
                .reverse()
                .map((scenario) => (
                  <Card
                    key={scenario.id}
                    // Liste Elemanı Dark Mode
                    className={`transition-all bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-600 hover:shadow-lg group ${
                      editingId === scenario.id
                        ? "border-indigo-500 bg-slate-800/50"
                        : ""
                    }`}
                  >
                    <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="space-y-1 overflow-hidden flex-1 w-full">
                        <div className="font-bold text-lg flex items-center gap-2 text-white group-hover:text-indigo-300 transition-colors">
                          <Code2 className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />{" "}
                          {scenario.name}
                        </div>
                        <p className="text-sm text-slate-400">
                          {scenario.description}
                        </p>
                        {/* Kod Önizleme Kutusu */}
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs font-mono text-slate-500 truncate mt-3 w-full group-hover:border-slate-700 transition-colors">
                          {scenario.scriptFragment.substring(0, 80)}...
                        </div>
                      </div>

                      {/* BUTONLAR */}
                      <div className="flex md:flex-col gap-2 w-full md:w-auto mt-2 md:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(scenario)}
                          className="flex-1 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-600"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Düzenle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => handleDelete(scenario.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Sil
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}

            {!isLoading && scenarios?.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
                Henüz hiç senaryo eklenmemiş.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
