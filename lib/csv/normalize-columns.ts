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
  session: [
    "sesion", "session", "partido", "match", "fecha", "entrenamiento", "training",
    "split_name", "activity", "event", "game"
  ],
  date: [
    "fecha", "date", "dia", "day", "split_start_time", "split_end_time",
    "start_time", "end_time", "timestamp"
  ],
  player: [
    "jugador", "player", "nombre", "name", "atleta", "athlete", "deportista",
    "split_name", "participant", "subject", "athlete_name"
  ],
  team: ["equipo", "team", "club", "squad"],
  position: ["posicion", "position", "pos", "rol"],
  duration: [
    "duracion", "duration", "dur", "tiempo", "time", "min", "minutos",
    "split_duration", "elapsed_time", "total_time"
  ],
  dist: [
    "distancia_total", "total_distance", "distancia", "distance", "dist", "total_dist",
    "distance_metres", "distance_meters", "distance_m", "total_distance_m",
    "dist_total", "distancia_total_m"
  ],
  m_min: [
    "m_min", "mmin", "metros_min", "m_minuto", "distancia_relativa", "relative_distance",
    "distance_per_min", "distance_per_minute", "dist_min", "m_per_min",
    "distance_per_min_m_min"
  ],
  z3: [
    "z3", "z3_distance", "distancia_z3", "zone3", "velocidad_z3",
    "distance_in_speed_zone_3", "speed_zone_3"
  ],
  z4: [
    "z4", "z4_distance", "distancia_z4", "zone4", "velocidad_z4",
    "distance_in_speed_zone_4", "speed_zone_4"
  ],
  z5: [
    "z5", "z5_distance", "distancia_z5", "zone5", "velocidad_z5",
    "sprint_distance", "sprints", "velocidad_z5",
    "distance_in_speed_zone_5", "speed_zone_5", "sprint_distance_m",
    "distance_in_speed_zone_5_metres"
  ],
  top_speed: [
    "top_speed", "velocidad_maxima", "max_speed", "v_max", "peak_speed", "maxima_velocidad",
    "top_speed_km_h", "max_speed_km_h", "peak_speed_km_h"
  ],
  a23: [
    "a23", "acc_23", "aceleraciones_23", "acceleration_23", "acc_2_3",
    "accelerations_zone_count_2_3"
  ],
  a34: [
    "a34", "acc_34", "aceleraciones_34", "acceleration_34", "acc_3_4",
    "accelerations_zone_count_3_4"
  ],
  a4: [
    "a4", "acc_4", "aceleraciones_4", "acceleration_4", "acc_mayor_4", "acc_gt_4",
    "accelerations_zone_count_gt_4", "accelerations_zone_count_4",
    "accelerations_zone_count_gt_4_m_s_s", "acceleration_zone_count_gt_4"
  ],
  d23: [
    "d23", "dec_23", "desaceleraciones_23", "deceleration_23", "dec_2_3",
    "deceleration_zone_count_2_3"
  ],
  d34: [
    "d34", "dec_34", "desaceleraciones_34", "deceleration_34", "dec_3_4",
    "deceleration_zone_count_3_4"
  ],
  d4: [
    "d4", "dec_4", "desaceleraciones_4", "deceleration_4", "dec_mayor_4", "dec_gt_4",
    "deceleration_zone_count_gt_4", "deceleration_zone_count_4",
    "deceleration_zone_count_gt_4_m_s_s", "deceleration_zone_count_gt_4_m_s"
  ],
  max_acc: [
    "max_acc", "maxima_aceleracion", "peak_acceleration", "max_acceleration",
    "max_acceleration_m_s_s"
  ],
  max_dec: [
    "max_dec", "maxima_desaceleracion", "peak_deceleration", "max_deceleration",
    "max_deceleration_m_s_s"
  ],
  pl: [
    "pl", "player_load", "carga_mecanica", "carga", "load", "playerload",
    "player_load_au", "load_index"
  ],
  half: ["half", "tiempo", "mitad", "periodo", "period", "split", "phase"],
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

export function getPlayerName(row: Record<string, string>, mapping: ColumnMapping[]): string {
  // Try mapped player column first
  const mapped = getMappedValue(row, mapping, "player");
  if (mapped && mapped.trim()) return mapped.trim();

  // Fallback: look for any column that looks like a name
  const nameLike = Object.entries(row).find(([key, val]) => {
    const norm = normalizeColumnName(key);
    return (
      (norm.includes("name") || norm.includes("nombre") || norm.includes("jugador") || norm.includes("player") || norm.includes("split")) &&
      val &&
      val.trim() &&
      val.trim().length > 2 &&
      isNaN(Number(val.trim()))
    );
  });
  if (nameLike) return nameLike[1].trim();

  return "";
}

export function getDurationFromTimes(row: Record<string, string>, mapping: ColumnMapping[]): number {
  const startRaw = getMappedValue(row, mapping, "date");
  const endRaw = Object.entries(row).find(([key]) => {
    const norm = normalizeColumnName(key);
    return norm.includes("end") && norm.includes("time");
  })?.[1];

  if (startRaw && endRaw) {
    try {
      const start = new Date(startRaw).getTime();
      const end = new Date(endRaw).getTime();
      if (!isNaN(start) && !isNaN(end) && end > start) {
        return Math.round((end - start) / 60000);
      }
    } catch {
      // ignore
    }
  }
  return 0;
}
