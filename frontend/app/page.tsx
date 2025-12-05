"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Scenario, CreateScenarioDto } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, FileText, Code } from "lucide-react";
import { toast } from "sonner";

export default function ScenariosPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const defaultCode = `export function New_Action() {
  let res = http.get(\`\${BASE_URL}/\`);
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}`;

  const [formData, setFormData] = useState<CreateScenarioDto>({
    name: "",
    description: "",
    scriptFragment: defaultCode,
  });

  const { data: scenarios, isLoading } = useQuery<Scenario[]>({
    queryKey: ["scenarios"],
    queryFn: async () => (await api.get("/scenarios")).data,
  });

  const createMutation = useMutation({
    mutationFn: async (newScenario: CreateScenarioDto) => {
      return await api.post("/scenarios", newScenario);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      setIsOpen(false);
      setFormData({ name: "", description: "", scriptFragment: defaultCode });
      toast.success("Senaryo kütüphaneye eklendi!");
    },
    onError: (err) => toast.error("Hata: " + err),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Senaryo Kütüphanesi
          </h1>
          <p className="text-slate-500 mt-1">
            Sistemdeki mevcut test parçacıkları.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Yeni Senaryo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Yeni Test Parçacığı Oluştur</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Senaryo Adı</Label>
                  <Input
                    placeholder="Örn: Login İşlemi"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input
                    placeholder="Ne yapıyor?"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Script (JS)</Label>
                <Textarea
                  className="font-mono text-sm min-h-[300px] bg-slate-950 text-green-400 p-4"
                  value={formData.scriptFragment}
                  onChange={(e) =>
                    setFormData({ ...formData, scriptFragment: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Kaydet
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios?.map((scenario) => (
            <Card key={scenario.id} className="hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-blue-500" />
                  {scenario.name}
                </CardTitle>
                <CardDescription>{scenario.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 p-3 rounded-md border text-xs font-mono text-slate-600 overflow-hidden h-32 relative">
                  <pre>{scenario.scriptFragment}</pre>
                  <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-slate-50 to-transparent" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
