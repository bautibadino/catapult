export function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+$/, "")
    .replace(/^_+/, "");
}

export interface ColumnMapping {
  raw: string;
  normalized: string;
  mappedTo: string | null;
}

const COLUMN_ALIASES: Record<string, string[]> = {
  session: ["sesion", "session", "partido", "match", "fecha", "entrenamiento", "training"],
  date: ["fecha", "date", "dia", "day"],
  player: ["jugador", "player", "nombre", "name", "atleta", "athlete", "deportista"],
  team: ["equipo", "team", "club"],
  position: ["posicion", "position", "pos", "rol"],
  duration: ["duracion", "duration", "dur", "tiempo", "time", "min", "minutos"],
  dist: ["distancia_total", "total_distance", "distancia", "distance", "dist", "total_dist"],
  m_min: ["m_min", "mmin", "metros_min", "m_minuto", "distancia_relativa", "relative_distance"],
  z3: ["z3", "z3_distance", "distancia_z3", "zone3", "velocidad_z3"],
  z4: ["z4", "z4_distance", "distancia_z4", "zone4", "velocidad_z4"],
  z5: ["z5", "z5_distance", "distancia_z5", "zone5", "sprint_distance", "sprints", "velocidad_z5"],
  top_speed: ["top_speed", "velocidad_maxima", "max_speed", "v_max", "peak_speed", "maxima_velocidad"],
  a23: ["a23", "acc_23", "aceleraciones_23", "acceleration_23", "acc_2_3"],
  a34: ["a34", "acc_34", "aceleraciones_34", "acceleration_34", "acc_3_4"],
  a4: ["a4", "acc_4", "aceleraciones_4", "acceleration_4", "acc_mayor_4", "acc_gt_4"],
  d23: ["d23", "dec_23", "desaceleraciones_23", "deceleration_23", "dec_2_3"],
  d34: ["d34", "dec_34", "desaceleraciones_34", "deceleration_34", "dec_3_4"],
  d4: ["d4", "dec_4", "desaceleraciones_4", "deceleration_4", "dec_mayor_4", "dec_gt_4"],
  max_acc: ["max_acc", "maxima_aceleracion", "peak_acceleration", "max_acceleration"],
  max_dec: ["max_dec", "maxima_desaceleracion", "peak_deceleration", "max_deceleration"],
  pl: ["pl", "player_load", "carga_mecanica", "carga", "load", "playerload"],
  half: ["half", "tiempo", "mitad", "periodo", "period"],
};

export function detectColumnMapping(columns: string[]): ColumnMapping[] {
  return columns.map((raw) => {
    const normalized = normalizeColumnName(raw);
    let mappedTo: string | null = null;

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (aliases.includes(normalized) || normalized === field) {
        mappedTo = field;
        break;
      }
    }

    return { raw, normalized, mappedTo };
  });
}

export function getMappedValue(
  row: Record<string, string>,
  mapping: ColumnMapping[],
  field: string
): string | undefined {
  const map = mapping.find((m) => m.mappedTo === field);
  if (!map) return undefined;
  return row[map.raw];
}
