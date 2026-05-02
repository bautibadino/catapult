"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AthleteRanking } from "@/components/dashboard/athlete-ranking";
import { GpsDataTable } from "@/components/dashboard/gps-data-table";
import { MermaPanel } from "@/components/dashboard/merma-panel";
import { BenchmarkPanel } from "@/components/dashboard/benchmark-panel";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { DashboardData } from "@/types/dashboard";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard,
  TrendingDown,
  Users,
  BarChart3,
  Trophy,
  Target,
  CalendarDays,
} from "lucide-react";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-[#F4F4F4] flex items-center justify-center mb-5">
        <BarChart3 className="w-10 h-10 text-[#C4C4C4]" />
      </div>
      <h2 className="text-xl font-extrabold text-[#0A0A0A] tracking-tight">
        No hay datos aún
      </h2>
      <p className="text-sm text-[#A3A3A3] mt-2 max-w-sm leading-relaxed">
        Importa un CSV de datos GPS para comenzar a visualizar el dashboard del equipo.
      </p>
      <a
        href="/import"
        className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#F26522] to-[#D54E0E] text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20 hover:opacity-90 transition-opacity"
      >
        <CalendarDays className="w-4 h-4" />
        Importar CSV
      </a>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[340px] rounded-xl" />
        <Skeleton className="h-[340px] rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <Card className="rounded-xl p-6 bg-red-50 text-red-700 border-red-200">
        <div className="flex items-center gap-2 font-bold">
          <TrendingDown className="w-5 h-5" />
          Error cargando dashboard
        </div>
        <p className="text-sm mt-1 text-red-600">{error}</p>
      </Card>
    );
  }

  if (!data || data.kpis.length === 0) return <EmptyState />;

  const chartDistData = data.sessions.map((s) => ({
    name: s.name,
    dist: Math.round(s.promTotal.dist || 0),
    mmin: Number((s.promTotal.m_min || 0).toFixed(1)),
  }));

  const chartPLData = data.sessions.map((s) => ({
    name: s.name,
    pl: Math.round(s.promTotal.pl || 0),
  }));

  // Normalized multi-line chart: each metric scaled to 0-100% of its own range
  const rawMulti = data.sessions.map((s) => ({
    name: s.name,
    dist: s.promTotal.dist || 0,
    mmin: s.promTotal.m_min || 0,
    z5: s.promTotal.z5 || 0,
    pl: s.promTotal.pl || 0,
    top: s.promTotal.top_speed || 0,
    a4: s.promTotal.a4 || 0,
  }));

  function normalizeMetric(values: number[]) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    if (range === 0) return values.map(() => 50);
    return values.map((v) => ((v - min) / range) * 100);
  }

  const distNorm = normalizeMetric(rawMulti.map((d) => d.dist));
  const mminNorm = normalizeMetric(rawMulti.map((d) => d.mmin));
  const z5Norm = normalizeMetric(rawMulti.map((d) => d.z5));
  const plNorm = normalizeMetric(rawMulti.map((d) => d.pl));

  const chartMultiData = rawMulti.map((d, i) => ({
    name: d.name,
    distPct: Number(distNorm[i].toFixed(1)),
    mminPct: Number(mminNorm[i].toFixed(1)),
    z5Pct: Number(z5Norm[i].toFixed(1)),
    plPct: Number(plNorm[i].toFixed(1)),
    // Keep raw values for tooltip
    distRaw: Math.round(d.dist),
    mminRaw: Number(d.mmin.toFixed(1)),
    z5Raw: Math.round(d.z5),
    plRaw: Math.round(d.pl),
  }));

  const chartSmallData = data.sessions.map((s) => ({
    name: s.name,
    z5: Math.round(s.promTotal.z5 || 0),
    topSpeed: Number((s.promTotal.top_speed || 0).toFixed(1)),
    a4: Math.round(s.promTotal.a4 || 0),
  }));

  // Chart margins to prevent edge crowding
  const chartMargin = { top: 8, right: 16, left: 8, bottom: 8 };

  const tabClass =
    "text-xs font-bold uppercase tracking-wider text-[#A3A3A3] data-[state=active]:text-[#F26522] data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2.5 rounded-lg transition-all";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F26522] to-[#D54E0E] flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0A0A0A] tracking-tight">
              Dashboard
            </h1>
            <p className="text-xs text-[#A3A3A3] font-medium mt-0.5">
              {data.sessions.length} sesiones · {data.athletes.length} jugadores
            </p>
          </div>
        </div>
        <a
          href="/import"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A0A0A] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#1A1A1A] transition-colors"
        >
          <CalendarDays className="w-4 h-4" />
          Importar
        </a>
      </div>

      <Tabs defaultValue="resumen" className="space-y-6">
        <TabsList className="bg-[#F4F4F4] p-1.5 h-auto flex flex-wrap gap-1 rounded-xl border border-[#F0F0F0]">
          <TabsTrigger value="resumen" className={tabClass}>
            <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="merma" className={tabClass}>
            <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
            Merma
          </TabsTrigger>
          <TabsTrigger value="jugadores" className={tabClass}>
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Jugadores
          </TabsTrigger>
          <TabsTrigger value="evolucion" className={tabClass}>
            <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
            Evolución
          </TabsTrigger>
          <TabsTrigger value="benchmark" className={tabClass}>
            <Target className="w-3.5 h-3.5 mr-1.5" />
            Benchmarks
          </TabsTrigger>
          <TabsTrigger value="partidos" className={tabClass}>
            <Trophy className="w-3.5 h-3.5 mr-1.5" />
            Partidos
          </TabsTrigger>
        </TabsList>

        {/* RESUMEN */}
        <TabsContent value="resumen" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {data.kpis.map((kpi, i) => (
              <KpiCard key={i} {...kpi} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="rounded-xl p-5 bg-white border-[#F0F0F0] shadow-sm">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F4F4F4]">
                <div>
                  <h3 className="text-sm font-bold text-[#0A0A0A]">Distancia por fecha</h3>
                  <p className="text-xs text-[#A3A3A3] mt-0.5">Promedio del equipo (m)</p>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDistData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F4" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#A3A3A3" }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: "#A3A3A3" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v) => [`${Number(v).toLocaleString("es-AR")} m`, "Distancia"]} contentStyle={{ borderRadius: 10, border: "1px solid #F0F0F0", fontSize: 12 }} />
                    <Bar dataKey="dist" fill="#F26522" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="rounded-xl p-5 bg-white border-[#F0F0F0] shadow-sm">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F4F4F4]">
                <div>
                  <h3 className="text-sm font-bold text-[#0A0A0A]">m/min por fecha</h3>
                  <p className="text-xs text-[#A3A3A3] mt-0.5">Intensidad promedio</p>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDistData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F4" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#A3A3A3" }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: "#A3A3A3" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                    <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} m/min`, "Intensidad"]} contentStyle={{ borderRadius: 10, border: "1px solid #F0F0F0", fontSize: 12 }} />
                    <Line type="monotone" dataKey="mmin" stroke="#0A0A0A" strokeWidth={3} dot={{ r: 5, fill: "#0A0A0A" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="rounded-xl p-5 bg-white border-[#F0F0F0] shadow-sm">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F4F4F4]">
                <div>
                  <h3 className="text-sm font-bold text-[#0A0A0A]">Carga mecánica</h3>
                  <p className="text-xs text-[#A3A3A3] mt-0.5">Player Load promedio</p>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartPLData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F4" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#A3A3A3" }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: "#A3A3A3" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [`${Number(v).toFixed(0)}`, "Player Load"]} contentStyle={{ borderRadius: 10, border: "1px solid #F0F0F0", fontSize: 12 }} />
                    <Bar dataKey="pl" fill="rgba(242,101,34,0.85)" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="rounded-xl p-5 bg-white border-[#F0F0F0] shadow-sm">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F4F4F4]">
              <div>
                <h3 className="text-sm font-bold text-[#0A0A0A]">Insights del ciclo</h3>
                <p className="text-xs text-[#A3A3A3] mt-0.5">
                  Hallazgos del trabajo de campo
                </p>
              </div>
            </div>
            <InsightsPanel insights={data.insights} />
          </Card>
        </TabsContent>

        {/* MERMA */}
        <TabsContent value="merma" className="mt-0">
          <MermaPanel
            metrics={data.merma.metrics}
            mode={data.merma.mode}
            players={data.merma.players}
          />
        </TabsContent>

        {/* JUGADORES */}
        <TabsContent value="jugadores" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AthleteRanking
              title="Top distancia"
              items={data.rankings.dist}
              format={(v) => `${(v / 1000).toFixed(2)} km`}
            />
            <AthleteRanking
              title="Top sprints (Z5)"
              items={data.rankings.z5}
              format={(v) => `${Math.round(v)} m`}
            />
            <AthleteRanking
              title="Top Player Load"
              items={data.rankings.pl}
              format={(v) => `${Math.round(v)}`}
            />
          </div>
          <Card className="rounded-xl p-5 bg-white border-[#F0F0F0] shadow-sm">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F4F4F4]">
              <div>
                <h3 className="text-sm font-bold text-[#0A0A0A]">
                  Detalle del plantel
                </h3>
                <p className="text-xs text-[#A3A3A3] mt-0.5">
                  {data.athletes.length} jugadores con datos
                </p>
              </div>
            </div>
            <GpsDataTable athletes={data.athletes} />
          </Card>
        </TabsContent>

        {/* EVOLUCION */}
        <TabsContent value="evolucion" className="space-y-5 mt-0">
          <Card className="rounded-xl p-5 bg-white border-[#F0F0F0] shadow-sm">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F4F4F4]">
              <div>
                <h3 className="text-sm font-bold text-[#0A0A0A]">
                  Evolución física fecha a fecha
                </h3>
                <p className="text-xs text-[#A3A3A3] mt-0.5">
                  Promedios del equipo
                </p>
              </div>
            </div>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartMultiData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#A3A3A3" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#A3A3A3" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    content={({ payload, label }) => {
                      if (!payload || payload.length === 0) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white rounded-xl border border-[#F0F0F0] shadow-lg p-3 text-xs">
                          <div className="font-bold text-[#0A0A0A] mb-2">{label}</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#F26522]" /> Distancia: <strong>{d.distRaw.toLocaleString("es-AR")} m</strong></div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#2563EB]" /> m/min: <strong>{d.mminRaw}</strong></div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Z5: <strong>{d.z5Raw.toLocaleString("es-AR")} m</strong></div>
                            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#DC2626]" /> Player Load: <strong>{d.plRaw}</strong></div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                  <Line type="monotone" dataKey="distPct" name="Distancia" stroke="#F26522" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="mminPct" name="m/min" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="z5Pct" name="Sprints Z5" stroke="#16A34A" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="5 3" />
                  <Line type="monotone" dataKey="plPct" name="Player Load" stroke="#DC2626" strokeWidth={2.5} dot={{ r: 4 }} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Sprints Z5 (m)">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartSmallData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#A3A3A3" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#A3A3A3" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #F0F0F0", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="z5" name="Z5 (m)" fill="#F26522" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Top Speed (km/h)">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartSmallData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#A3A3A3" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#A3A3A3" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #F0F0F0", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="topSpeed" name="Top Speed (km/h)" fill="#0A0A0A" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Aceleraciones >4 m/s²">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartSmallData} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F4" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#A3A3A3" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#A3A3A3" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #F0F0F0", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="a4" name="Acc >4 m/s²" fill="#16A34A" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>

        {/* BENCHMARK */}
        <TabsContent value="benchmark" className="mt-0">
          <BenchmarkPanel items={data.benchmarks} />
        </TabsContent>

        {/* PARTIDOS */}
        <TabsContent value="partidos" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.sessions.map((s) => (
              <a
                key={s._id}
                href={`/sessions/${s._id}`}
                className="block group rounded-xl overflow-hidden bg-white border border-[#F0F0F0] shadow-sm hover:shadow-md hover:border-[#E5E5E5] transition-all duration-200"
              >
                <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] text-white px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-[#F26522] uppercase tracking-wider">
                      {s.name}
                    </div>
                    <div className="text-base font-bold mt-0.5 group-hover:text-[#F26522] transition-colors">
                      {s.rival || s.name}
                    </div>
                    <div className="text-[11px] text-[#A3A3A3] mt-1 font-medium">
                      {s.date}
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white border-0 text-[11px] font-bold"
                  >
                    {s.athleteCount} jugadores
                  </Badge>
                </div>
                <div className="px-5 py-4 space-y-2">
                  <StatRow label="Distancia promedio" value={`${((s.promTotal.dist || 0) / 1000).toFixed(2)} km`} />
                  <StatRow label="Distancia relativa" value={`${(s.promTotal.m_min || 0).toFixed(1)} m/min`} />
                  <StatRow label="Sprints Z5" value={`${Math.round(s.promTotal.z5 || 0)} m`} />
                  <StatRow label="Top speed equipo" value={`${(s.promTotal.top_speed || 0).toFixed(1)} km/h`} />
                  <StatRow label="Acc >4 m/s²" value={`${Math.round(s.promTotal.a4 || 0)}`} />
                  <StatRow label="Dec >4 m/s²" value={`${Math.round(s.promTotal.d4 || 0)}`} />
                  <StatRow label="Player Load" value={`${Math.round(s.promTotal.pl || 0)}`} highlight />
                </div>
              </a>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-xl p-5 bg-white border-[#F0F0F0] shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F4F4F4]">
        <h3 className="text-sm font-bold text-[#0A0A0A]">{title}</h3>
      </div>
      <div className="h-[260px]">{children}</div>
    </Card>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-[#F4F4F4] last:border-0 text-[13px]">
      <span className="text-[#A3A3A3]">{label}</span>
      <span className={`font-bold ${highlight ? "text-[#F26522]" : "text-[#0A0A0A]"}`}>
        {value}
      </span>
    </div>
  );
}
