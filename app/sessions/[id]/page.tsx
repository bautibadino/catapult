"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Users, Route, TrendingUp, Zap, Activity, Trophy } from "lucide-react";

export default function SessionPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/session/${id}`)
      .then((r) => r.json())
      .then((json) => setData(json))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
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
          <Calendar className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-extrabold text-[#0A0A0A]">Sesión no encontrada</h2>
        <p className="text-sm text-[#A3A3A3] mt-2">La sesión solicitada no existe en la base de datos.</p>
        <a href="/" className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A0A0A] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#1A1A1A] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </a>
      </div>
    );
  }

  const { session, promTotal, athletes } = data;

  const stats = [
    { label: "Distancia promedio", value: `${((promTotal.dist || 0) / 1000).toFixed(2)} km`, icon: Route },
    { label: "m/min", value: (promTotal.m_min || 0).toFixed(1), icon: TrendingUp },
    { label: "Z5", value: `${Math.round(promTotal.z5 || 0)} m`, icon: Zap },
    { label: "Player Load", value: Math.round(promTotal.pl || 0).toString(), icon: Activity },
    { label: "Top Speed", value: `${(promTotal.top_speed || 0).toFixed(1)} km/h`, icon: Trophy },
    { label: "Acc >4", value: Math.round(promTotal.a4 || 0).toString(), icon: Zap },
    { label: "Dec >4", value: Math.round(promTotal.d4 || 0).toString(), icon: Zap },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a href="/" className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#F4F4F4] text-[#707070] hover:text-[#F26522] hover:bg-[#FFE0CC] transition-all duration-200">
          <ArrowLeft className="w-5 h-5" />
        </a>
        <div>
          <h1 className="text-2xl font-extrabold text-[#0A0A0A] tracking-tight">
            {session.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
              {session.date}
            </Badge>
            {session.rival && (
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                vs {session.rival}
              </Badge>
            )}
            <Badge className="text-[10px] bg-[#F26522] text-white border-0 font-bold">
              <Users className="w-3 h-3 mr-1" />
              {athletes.length} jugadores
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
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

      {/* Athletes Table */}
      <Card className="rounded-xl p-5 bg-white border-[#F0F0F0] shadow-sm">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F4F4F4]">
          <div>
            <h3 className="text-sm font-bold text-[#0A0A0A]">Participantes</h3>
            <p className="text-xs text-[#A3A3A3] mt-0.5">
              {athletes.length} jugadores en esta sesión
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#F8F8F8]">
                <th className="text-left px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">Jugador</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">Dist (m)</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">m/min</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">Z5</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">Top Speed</th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">PL</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((a: any) => (
                <tr key={a.athleteId} className="hover:bg-[#FAFAFA] border-b border-[#F4F4F4] transition-colors">
                  <td className="px-3 py-2.5 font-semibold text-[#0A0A0A]">
                    <a href={`/athletes/${a.athleteId}`} className="hover:text-[#F26522] hover:underline transition-colors">
                      {a.athleteName}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {Math.round(a.metrics.dist).toLocaleString("es-AR")}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {a.metrics.m_min.toFixed(1)}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {Math.round(a.metrics.z5).toLocaleString("es-AR")}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums">
                    {a.metrics.top_speed.toFixed(1)}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums font-bold">
                    {Math.round(a.metrics.pl).toLocaleString("es-AR")}
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
