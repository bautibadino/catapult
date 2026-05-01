import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface AthleteTableRow {
  _id: string;
  name: string;
  pj: number;
  dur: number;
  dist: number;
  m_min: number;
  z5: number;
  top: number;
  a4: number;
  d4: number;
  pl: number;
}

interface GpsDataTableProps {
  athletes: AthleteTableRow[];
}

export function GpsDataTable({ athletes }: GpsDataTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof AthleteTableRow>("dist");
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = athletes.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "number" && typeof bv === "number") {
      return sortDesc ? bv - av : av - bv;
    }
    return sortDesc
      ? String(bv).localeCompare(String(av))
      : String(av).localeCompare(String(bv));
  });

  function toggleSort(key: keyof AthleteTableRow) {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  const headers: { key: keyof AthleteTableRow; label: string }[] = [
    { key: "name", label: "Jugador" },
    { key: "pj", label: "PJ" },
    { key: "dur", label: "Min" },
    { key: "dist", label: "Dist (m)" },
    { key: "m_min", label: "m/min" },
    { key: "z5", label: "Z5 (m)" },
    { key: "top", label: "Top Speed" },
    { key: "a4", label: "Acc 4+" },
    { key: "d4", label: "Dec 4+" },
    { key: "pl", label: "Player Load" },
  ];

  const maxDist = Math.max(...athletes.map((a) => a.dist));
  const maxZ5 = Math.max(...athletes.map((a) => a.z5));
  const maxPL = Math.max(...athletes.map((a) => a.pl));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
          <Input
            placeholder="Buscar jugador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm border-[#E5E5E5] focus:border-[#F26522] focus:ring-[#F26522]"
          />
        </div>
        <Badge variant="secondary" className="text-xs font-medium">
          {filtered.length} jugadores
        </Badge>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#F0F0F0] bg-white">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#F8F8F8]">
              {headers.map((h) => (
                <th
                  key={h.key}
                  onClick={() => toggleSort(h.key)}
                  className="text-left px-3 py-2.5 text-[11px] font-bold text-[#707070] uppercase tracking-wider border-b border-[#E5E5E5] cursor-pointer hover:bg-[#F0F0F0] transition-colors select-none whitespace-nowrap"
                >
                  <span className="flex items-center gap-1">
                    {h.label}
                    {sortKey === h.key && (
                      <span className="text-[#F26522]">
                        {sortDesc ? "↓" : "↑"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => (
              <tr
                key={a._id}
                className="hover:bg-[#FAFAFA] border-b border-[#F4F4F4] transition-colors"
              >
                <td className="px-3 py-2.5 font-semibold text-[#0A0A0A]">
                  <a
                    href={`/athletes/${a._id}`}
                    className="hover:text-[#F26522] hover:underline transition-colors"
                  >
                    {a.name}
                  </a>
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums">{a.pj}</td>
                <td className="px-3 py-2.5 text-center tabular-nums">
                  {Math.round(a.dur)}
                </td>
                <td
                  className={`px-3 py-2.5 text-center tabular-nums font-medium ${
                    a.dist === maxDist ? "text-[#F26522] font-bold" : ""
                  }`}
                >
                  {Math.round(a.dist).toLocaleString("es-AR")}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums">
                  {a.m_min.toFixed(1)}
                </td>
                <td
                  className={`px-3 py-2.5 text-center tabular-nums font-medium ${
                    a.z5 === maxZ5 ? "text-[#F26522] font-bold" : ""
                  }`}
                >
                  {Math.round(a.z5).toLocaleString("es-AR")}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums">
                  {a.top.toFixed(1)}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums">
                  {Math.round(a.a4)}
                </td>
                <td className="px-3 py-2.5 text-center tabular-nums">
                  {Math.round(a.d4)}
                </td>
                <td
                  className={`px-3 py-2.5 text-center tabular-nums font-bold ${
                    a.pl === maxPL ? "text-[#F26522]" : ""
                  }`}
                >
                  {Math.round(a.pl).toLocaleString("es-AR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
