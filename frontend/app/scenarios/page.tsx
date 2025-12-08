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
// İkonlarımızı ekledik
import { Pencil, Plus, Code2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export default function ScenariosPage() {
  const queryClient = useQueryClient();

  // --- FORM STATE ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scriptFragment, setScriptFragment] = useState("");

  // DÜZENLEME MODU: Eğer bu doluysa "Güncelleme" yapıyoruz demektir.
  const [editingId, setEditingId] = useState<string | null>(null);

  // 1. LİSTELEME
  const { data: scenarios, isLoading } = useQuery<Scenario[]>({
    queryKey: ["scenarios"],
    queryFn: async () => (await api.get("/scenarios")).data,
  });

  // 2. KAYDETME (HEM EKLEME HEM GÜNCELLEME)
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, description, scriptFragment };

      if (editingId) {
        // ID varsa GÜNCELLE (PATCH)
        await api.patch(`/scenarios/${editingId}`, payload);
      } else {
        // ID yoksa YENİ EKLE (POST)
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

  // 3. SİLME İŞLEMİ (YENİ)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/scenarios/${id}`);
    },
    onSuccess: () => {
      toast.success("Senaryo silindi.");
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      // Eğer düzenlenen senaryoyu sildiysek formu temizle
      if (editingId) resetForm();
    },
    onError: () => toast.error("Silinemedi."),
  });

  // Listeden "Düzenle"ye basınca formu doldur
  const handleEdit = (scenario: Scenario) => {
    setEditingId(scenario.id);
    setName(scenario.name);
    setDescription(scenario.description || "");
    setScriptFragment(scenario.scriptFragment);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Yukarı kaydır
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
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Senaryo Kütüphanesi
        </h1>
        {editingId && (
          <Button variant="outline" onClick={resetForm} className="gap-2">
            <X className="w-4 h-4" /> İptal Et (Yeni Ekle)
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- SOL TARA: FORM --- */}
        <div className="lg:col-span-1">
          <Card
            className={`sticky top-8 ${
              editingId ? "border-orange-400 shadow-lg" : ""
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingId ? (
                  <Pencil className="w-5 h-5 text-orange-500" />
                ) : (
                  <Plus className="w-5 h-5 text-blue-500" />
                )}
                {editingId ? "Senaryoyu Düzenle" : "Yeni Senaryo Ekle"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Senaryo Adı</Label>
                <Input
                  placeholder="Örn: Login Test"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Input
                  placeholder="Ne işe yarar?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>k6 Kodu (Fonksiyon)</Label>
                <Textarea
                  className="font-mono text-xs h-64 bg-slate-50"
                  placeholder={`export function MyTest() {\n  http.get(BASE_URL);\n}`}
                  value={scriptFragment}
                  onChange={(e) => setScriptFragment(e.target.value)}
                />
              </div>
              <Button
                className={`w-full ${
                  editingId
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-blue-600 hover:bg-blue-700"
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
            <div>Yükleniyor...</div>
          ) : (
            scenarios
              ?.slice()
              .reverse()
              .map((scenario) => (
                <Card
                  key={scenario.id}
                  className={`transition-all hover:shadow-md ${
                    editingId === scenario.id
                      ? "border-orange-400 bg-orange-50"
                      : ""
                  }`}
                >
                  <CardContent className="p-5 flex justify-between items-start gap-4">
                    <div className="space-y-1 overflow-hidden flex-1">
                      <div className="font-bold text-lg flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-slate-400" />{" "}
                        {scenario.name}
                      </div>
                      <p className="text-sm text-slate-500">
                        {scenario.description}
                      </p>
                      <div className="bg-slate-100 p-2 rounded text-xs font-mono text-slate-600 truncate mt-2">
                        {scenario.scriptFragment.substring(0, 80)}...
                      </div>
                    </div>

                    {/* BUTONLAR */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(scenario)}
                      >
                        <Pencil className="w-4 h-4 mr-2" /> Düzenle
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(scenario.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Sil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
