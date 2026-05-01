import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface RankingItem {
  rank: number;
  name: string;
  value: number;
  pj: number;
  max: number;
}

interface AthleteRankingProps {
  title: string;
  items: RankingItem[];
  format: (v: number) => string;
}

export function AthleteRanking({ title, items, format }: AthleteRankingProps) {
  const maxV = items[0]?.max || 1;
  return (
    <Card className="rounded-xl p-5 bg-white border-[#F0F0F0] shadow-sm">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#F4F4F4]">
        <Trophy className="w-4 h-4 text-[#F26522]" />
        <h3 className="text-sm font-bold text-[#0A0A0A]">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name} className="group">
            <div className="flex items-center gap-3 mb-1.5">
              <div
                className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-extrabold shrink-0",
                  item.rank === 1
                    ? "bg-amber-100 text-amber-700"
                    : item.rank === 2
                    ? "bg-[#F4F4F4] text-[#707070]"
                    : item.rank === 3
                    ? "bg-orange-50 text-orange-700"
                    : "bg-transparent text-[#C4C4C4]"
                )}
              >
                {item.rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#0A0A0A] truncate">
                  {item.name}
                </p>
                <p className="text-[11px] text-[#A3A3A3]">
                  {item.pj} partido{item.pj > 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-[13px] font-bold text-[#0A0A0A] tabular-nums shrink-0">
                {format(item.value)}
              </div>
            </div>
            <div className="h-2 bg-[#F4F4F4] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#F26522] to-[#D54E0E] transition-all duration-500"
                style={{ width: `${Math.max((item.value / maxV) * 100, 3)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
