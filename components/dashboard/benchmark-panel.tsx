import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/metrics/format";
import { BenchmarkItem } from "@/types/dashboard";
import { Target } from "lucide-react";

interface BenchmarkPanelProps {
  items: BenchmarkItem[];
}

export function BenchmarkPanel({ items }: BenchmarkPanelProps) {
  return (
    <Card className="rounded-xl p-5 bg-white border-[#F0F0F0] shadow-sm">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#F4F4F4]">
        <Target className="w-4 h-4 text-[#F26522]" />
        <div>
          <h3 className="text-sm font-bold text-[#0A0A0A]">
            Comparativa con referencias
          </h3>
          <p className="text-xs text-[#A3A3A3] mt-0.5">
            Benchmarks orientativos: amateur competitivo y profesional
          </p>
        </div>
      </div>
      <div className="space-y-1">
        <div className="grid grid-cols-[200px_1fr_80px_80px_80px] gap-3 items-center py-2 border-b-2 border-[#E5E5E5] text-[11px] font-bold uppercase text-[#A3A3A3]">
          <div>Métrica</div>
          <div>Posicionamiento del equipo</div>
          <div className="text-center">Equipo</div>
          <div className="text-center">Amateur</div>
          <div className="text-center text-[#2563EB]">Pro</div>
        </div>
        {items.map((b) => {
          const max = Math.max(b.professional * 1.05, b.value * 1.05);
          const pctEquipo = (b.value / max) * 100;
          const pctAm = (b.amateur / max) * 100;
          const pctPro = (b.professional / max) * 100;
          return (
            <div
              key={b.key}
              className="grid grid-cols-[200px_1fr_80px_80px_80px] gap-3 items-center py-3 border-b border-[#F4F4F4]"
            >
              <div className="text-[13px] font-semibold text-[#0A0A0A]">
                {b.label}
              </div>
              <div>
                <div className="h-6 bg-[#F4F4F4] rounded-lg relative overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[#A3A3A3] z-10"
                    style={{ left: `${pctAm}%` }}
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase text-[#A3A3A3]">
                      Amateur
                    </div>
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[#2563EB] z-10"
                    style={{ left: `${pctPro}%` }}
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase text-[#2563EB]">
                      Pro
                    </div>
                  </div>
                  <div
                    className="h-full bg-gradient-to-r from-[#FFE0CC] to-[#F26522] rounded-lg transition-all duration-700"
                    style={{ width: `${pctEquipo}%` }}
                  />
                </div>
              </div>
              <div className="text-center text-[13px] font-bold">
                {formatNumber(b.value, b.key === "top_speed" || b.key === "m_min" ? 1 : 0)}
              </div>
              <div className="text-center text-[13px] text-[#A3A3A3]">
                {formatNumber(b.amateur, 0)}
              </div>
              <div className="text-center text-[13px] text-[#2563EB]">
                {formatNumber(b.professional, 0)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-5 bg-gradient-to-br from-[#FFF7ED] to-white border-l-4 border-[#F26522] rounded-r-xl p-4">
        <h4 className="text-xs font-extrabold text-[#D54E0E] uppercase tracking-wider mb-1.5">
          Cómo leer este panel
        </h4>
        <p className="text-[13px] text-[#404040] leading-relaxed">
          La barra naranja muestra el promedio actual del equipo. La línea gris vertical es la referencia <strong>amateur competitivo</strong> y la línea azul el <strong>profesional</strong>. Son orientativas: cada categoría y competencia tiene matices, pero sirven para ubicar el rendimiento del plantel en contexto.
        </p>
      </div>
    </Card>
  );
}
