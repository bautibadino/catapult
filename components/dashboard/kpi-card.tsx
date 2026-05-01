import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: number;
  unit: string;
  sub: string;
  highlight?: boolean;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function KpiCard({ label, value, unit, sub, highlight, trend, trendValue }: KpiCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl p-5 border shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.01]",
        highlight
          ? "bg-gradient-to-br from-[#F26522] to-[#D54E0E] text-white border-transparent"
          : "bg-white border-[#F0F0F0]"
      )}
    >
      <div
        className={cn(
          "text-[11px] font-bold uppercase tracking-wider mb-2",
          highlight ? "text-white/70" : "text-[#A3A3A3]"
        )}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "text-[32px] font-extrabold tracking-tight leading-none",
            highlight ? "text-white" : "text-[#0A0A0A]"
          )}
        >
          {Number(value).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </span>
        {unit && (
          <span className={cn("text-sm font-semibold", highlight ? "text-white/60" : "text-[#A3A3A3]")}>
            {unit}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className={cn("text-xs", highlight ? "text-white/60" : "text-[#A3A3A3]")}>
          {sub}
        </span>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full",
              trend === "up"
                ? "bg-green-100 text-green-700"
                : trend === "down"
                ? "bg-red-100 text-red-700"
                : "bg-[#F4F4F4] text-[#707070]"
            )}
          >
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend === "down" ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {trendValue}
          </span>
        )}
      </div>
    </Card>
  );
}
