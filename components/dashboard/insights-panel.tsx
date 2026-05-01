import { Lightbulb } from "lucide-react";

interface InsightsPanelProps {
  insights: { title: string; text: string }[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {insights.map((insight, i) => (
        <div
          key={i}
          className="bg-gradient-to-br from-[#FFF7ED] to-white border border-[#FFE0CC] rounded-xl p-5 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-[#F26522]" />
            <h4 className="text-xs font-extrabold text-[#D54E0E] uppercase tracking-wider">
              {insight.title}
            </h4>
          </div>
          <p
            className="text-[13px] text-[#404040] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: insight.text }}
          />
        </div>
      ))}
    </div>
  );
}
