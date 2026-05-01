"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/metrics/format";
import { ArrowLeft, User, Calendar, Timer, Route, Zap, TrendingUp, Activity } from "lucide-react";

export default function AthletePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/athlete/${id}`)
      .then((r) => r.json())
      .then((json) => setData(json))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-extrabold text-[#0A0A0A]">Jugador no encontrado</h2>
        <p className="text-sm text-[#A3A3A3] mt-2">El atleta solicitado no existe en la base de datos.</p>
        <a href="/" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A0A0A] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#1A1A1A] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </a>
      </div>
    );
  }

  const { athlete, summary, sessions } = data;

  const stats = [
    { label: "Partidos", value: summary.pj, icon: Calendar },
    { label: "Minutos totales", value: summary.totalDur, icon: Timer },
    { label: "Distancia avg", value: `${formatNumber(summary.avgDist, 0)} m`, icon: Route },
    { label: "m/min avg", value: summary.avgMmin.toFixed(1), icon: TrendingUp },
    { label: "Z5 avg", value: `${formatNumber(summary.avgZ5, 0)} m`, icon: Zap },
    { label: "Top Speed", value: `${summary.maxSpeed.toFixed(1)} km/h`, icon: Activity },
    { label: "Acc >4 avg", value: summary.avgA4.toFixed(1), icon: Zap },
    { label: "Player Load avg", value: summary.avgPL.toFixed(0), icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a href="/" className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#F4F4F4] text-[#707070] hover:text-[#F26522] hover:bg-[#FFE0CC] transition-all duration-200">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F26522] to-[#D54E0E] flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-orange-500/20">
            {athlete.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0A0A0A] tracking-tight">
              {athlete.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                {athlete.team || "ADIUR Primera"}
              </Badge>
              {athlete.position && (
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                  {athlete.position}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-xl p-4 bg-white border-[#F0F0F0] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] flex items-center justify-center text-[#F26522]">
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#A3A3A3] mb-1">
              {stat.label}
            </div>
            <div className="text-xl font-extrabold text-[#0A0A0A]">{stat.value}</div>
          </Card>
        ))}
      </div>

      {/* Sessions Table */}
      <Card className="rounded-xl p-5 bg-white border-[#F0F0F0] shadow-sm">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F4F4F4]">
          <div>
            <h3 className="text-sm font-bold text-[#0A0A0A]">Historial de sesiones</h3>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              {sessions.length} registros
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#F8F8F8]">
                <th className="text-left px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">Sesión</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">Fecha</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">Mitad</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">Dist</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">m/min</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">Z5</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">PL</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s: any, i: number) => (
                <tr key={i} className="hover:bg-[#FAFAFA] border-b border-[#F4F4F4] transition-colors">
                  <td className="px-3 py-2.5 font-semibold text-[#0A0A0A]">{s.sessionName}</td>
                  <td className="px-3 py-2.5 text-[#707070]">{s.sessionDate}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {s.half || "Full"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {Math.round(s.metrics.dist).toLocaleString("es-AR")}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {s.metrics.m_min.toFixed(1)}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {Math.round(s.metrics.z5).toLocaleString("es-AR")}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums font-bold">
                    {Math.round(s.metrics.pl).toLocaleString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
