"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { io } from "socket.io-client";

export default function TestReportPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [liveData, setLiveData] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(false);

  const {
    data: test,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["test", testId],
    queryFn: async () =>
      (await api.get(`/tests`)).data.find((t: any) => t.id === testId),
  });

  useEffect(() => {
    const lastRun = test?.runs?.[test.runs.length - 1];
    if (lastRun?.status === "COMPLETED" || lastRun?.status === "FAILED") {
      setIsLive(false);
      return;
    }

    setIsLive(true);
    const socket = io("http://localhost:3000");

    socket.on(`test-progress-${testId}`, (data) => {
      if (data.type === "FINISHED") {
        setIsLive(false);
        refetch();
        socket.disconnect();
      } else {
        setLiveData((prev) => [...prev.slice(-19), data]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [testId, test?.runs]);

  if (isLoading) return <div className="p-10 text-center">Yükleniyor...</div>;
  if (!test) return <div className="p-10 text-center">Test bulunamadı.</div>;

  const lastRun =
    test.runs && test.runs.length > 0 ? test.runs[test.runs.length - 1] : null;
  const results = lastRun?.resultSummary;

  if (results && !isLive) {
    const metrics = results.metrics;

    const failMetric = metrics.http_req_failed;
    let failRate = 0;

    if (typeof failMetric?.rate === "number") {
      failRate = failMetric.rate * 100;
    } else if (typeof failMetric?.values?.rate === "number") {
      failRate = failMetric.values.rate * 100;
    } else if (
      failMetric?.passes !== undefined &&
      failMetric?.fails !== undefined
    ) {
      const total = failMetric.passes + failMetric.fails;
      failRate = total > 0 ? (failMetric.passes / total) * 100 : 0;
    } else if (failMetric?.values?.passes !== undefined) {
      const passes = failMetric.values.passes;
      const fails = failMetric.values.fails;
      const total = passes + fails;
      failRate = total > 0 ? (passes / total) * 100 : 0;
    }

    const avgDuration =
      metrics.http_req_duration?.avg ??
      metrics.http_req_duration?.values?.avg ??
      0;
    const maxDuration =
      metrics.http_req_duration?.max ??
      metrics.http_req_duration?.values?.max ??
      0;
    const p95Duration =
      metrics.http_req_duration?.["p(95)"] ??
      metrics.http_req_duration?.values?.["p(95)"] ??
      0;
    const totalReqs =
      metrics.http_reqs?.count ?? metrics.http_reqs?.values?.count ?? 0;

    const chartData = [
      { name: "Ortalama", ms: avgDuration },
      { name: "P95", ms: p95Duration },
      { name: "Maks", ms: maxDuration },
    ];

    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">Rapor: {test.name}</h1>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Toplam İstek</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {totalReqs}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Error</CardTitle>
            </CardHeader>
            <CardContent
              className={`text-2xl font-bold ${
                failRate > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {failRate.toFixed(2)}%
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ortalama Time</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-orange-600">
              {Number(avgDuration).toFixed(2)} ms
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Max Time</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold text-purple-600">
              {Number(maxDuration).toFixed(2)} ms
            </CardContent>
          </Card>
        </div>

        <Card className="h-[400px]">
          <CardHeader>
            <CardTitle>Sonuç Analizi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ms" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {test.name}
            <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full animate-pulse border border-green-200">
              LIVE YAYIN 🔴
            </span>
          </h1>
          <p className="text-slate-500 mt-1">
            Veriler anlık olarak WebSocket üzerinden akıyor.
          </p>
        </div>
      </div>

      <Card className="h-[500px] border-green-200 shadow-lg shadow-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" /> Canlı Yanıt Süresi
            (Latency)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={liveData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="time" />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip
                contentStyle={{ backgroundColor: "#000", color: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="latency"
                stroke="#16a34a"
                strokeWidth={3}
                dot={{ r: 4, fill: "#16a34a" }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
          {liveData.length === 0 && (
            <div className="text-center text-slate-400 mt-10">
              Veri bekleniyor...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
