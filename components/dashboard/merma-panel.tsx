import { Card } from "@/components/ui/card";
import { formatNumber, formatPct } from "@/lib/metrics/format";
import { MermaMetric, MermaPlayer } from "@/types/dashboard";
import { TrendingDown, Minus } from "lucide-react";

interface MermaPanelProps {
  metrics: MermaMetric[];
  mode: string;
  players: MermaPlayer[];
}

export function MermaPanel({ metrics, mode, players }: MermaPanelProps) {
  const max = Math.max(...metrics.map((m) => Math.max(m.ptAvg, m.stAvg))) || 1;

  return (
    <div className="space-y-5">
      <Card className="rounded-xl p-5 bg-white border-[#F0F0F0] shadow-sm">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F4F4F4]">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#F26522]" />
            <h3 className="text-sm font-bold text-[#0A0A0A]">
              Comparativa 1° tiempo vs 2° tiempo
            </h3>
          </div>
          <span className="text-xs font-medium text-[#A3A3A3] bg-[#F4F4F4] px-3 py-1 rounded-full">
            {mode === "completos" ? "Titulares completos" : "Todos por minuto"}
          </span>
        </div>
        <div className="space-y-4">
          {metrics.map((m) => {
            const ptW = (m.ptAvg / max) * 100;
            const stW = (m.stAvg / max) * 100;
            const isUp = m.deltaPct >= -2;
            return (
              <div key={m.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#404040] uppercase tracking-wide">
                    {m.label}
                  </span>
                  <span
                    className={`text-sm font-extrabold tabular-nums ${
                      isUp ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatPct(m.deltaPct)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-7 relative bg-[#F4F4F4] rounded-lg overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 left-0 flex items-center px-3 text-white font-bold text-xs rounded-lg bg-gradient-to-r from-[#2563EB] to-[#1D4ED8]"
                      style={{ width: `${Math.max(ptW, 4)}%` }}
                    >
                      PT: {formatNumber(m.ptAvg, m.key === "m_min" || m.key === "top_speed" ? 1 : 0)}
                    </div>
                  </div>
                  <div className="h-7 relative bg-[#F4F4F4] rounded-lg overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 left-0 flex items-center px-3 text-white font-bold text-xs rounded-lg bg-gradient-to-r from-[#F26522] to-[#D54E0E]"
                      style={{ width: `${Math.max(stW, 4)}%` }}
                    >
                      ST: {formatNumber(m.stAvg, m.key === "m_min" || m.key === "top_speed" ? 1 : 0)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-[11px] text-[#A3A3A3] mt-4 pt-3 border-t border-[#F4F4F4]">
          Modo: <strong>{mode === "completos" ? "Titulares con ambos tiempos completos" : "Todos los jugadores, métricas relativas por minuto"}</strong>
          {" "}· Muestra: {metrics[0]?.n || 0} observaciones por métrica
        </div>
      </Card>

      <Card className="rounded-xl p-5 bg-white border-[#F0F0F0] shadow-sm">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#F4F4F4]">
          <Minus className="w-4 h-4 text-[#F26522]" />
          <h3 className="text-sm font-bold text-[#0A0A0A]">
            Merma por jugador (titulares completos)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#F8F8F8]">
                <th className="text-left px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">
                  Jugador
                </th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">
                  Δ Dist
                </th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">
                  Δ m/min
                </th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">
                  Δ Z5
                </th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">
                  Δ PL
                </th>
                <th className="text-center px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5]">
                  Δ Top
                </th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#A3A3A3]">
                    Sin titulares con ambos tiempos completos
                  </td>
                </tr>
              )}
              {players.map((p) => (
                <tr key={p.name} className="hover:bg-[#FAFAFA] border-b border-[#F4F4F4]">
                  <td className="px-3 py-2.5 font-semibold text-[#0A0A0A]">
                    {p.name}{" "}
                    <small className="text-[#A3A3A3] font-normal">({p.n})</small>
                  </td>
                  <td className={`text-center px-3 py-2.5 font-extrabold tabular-nums ${p.dist >= -2 ? "text-green-600" : "text-red-600"}`}>
                    {formatPct(p.dist)}
                  </td>
                  <td className={`text-center px-3 py-2.5 font-extrabold tabular-nums ${p.m_min >= -2 ? "text-green-600" : "text-red-600"}`}>
                    {formatPct(p.m_min)}
                  </td>
                  <td className={`text-center px-3 py-2.5 font-extrabold tabular-nums ${p.z5 >= -2 ? "text-green-600" : "text-red-600"}`}>
                    {formatPct(p.z5)}
                  </td>
                  <td className={`text-center px-3 py-2.5 font-extrabold tabular-nums ${p.pl >= -2 ? "text-green-600" : "text-red-600"}`}>
                    {formatPct(p.pl)}
                  </td>
                  <td className={`text-center px-3 py-2.5 font-extrabold tabular-nums ${p.top >= -2 ? "text-green-600" : "text-red-600"}`}>
                    {formatPct(p.top)}
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
