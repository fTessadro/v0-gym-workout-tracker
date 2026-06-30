export const EXERCISE_CATEGORIES: Record<string, string[]> = {
  pecho: ["Press de Banca", "Aperturas con Mancuernas", "Press Inclinado", "Cruces en Polea", "Elevaciones Laterales"],
  espalda: ["Dominadas", "Convergente", "Jalón al Pecho", "Remo en Polea Baja", "Remo maquina"],
  piernas: ["Pendular", "Prensa de Piernas", "Extensiones de Cuádriceps", "Curl Femoral", "Búlgaras", "Peso Muerto Rumano"],
  hombros: ["Press Militar", "Elevaciones Laterales", "Pájaros", "Elevaciones Frontales", "Curl de Bíceps", "Katana", "Extensiones en Polea", "Curl Predicador"],
  bíceps: ["Curl de Bíceps", "Curl Martillo", "Curl Predicador"],
  biceps: ["Curl de Bíceps", "Curl Martillo", "Curl Predicador"],
  tríceps: ["Press Francés", "Extensiones en Polea", "Fondos de Tríceps", "Katana"],
  triceps: ["Press Francés", "Extensiones en Polea", "Fondos de Tríceps", "Katana"],
  brazos: ["Curl de Bíceps", "Press Francés", "Curl Martillo", "Extensiones en Polea"],
  abdominales: ["Crunch", "Plancha", "Elevación de Piernas"],
  core: ["Crunch", "Plancha", "Elevación de Piernas"],
}

export const MUSCLE_GROUPS = [
  "pecho",
  "espalda",
  "piernas",
  "hombros",
  "bíceps",
  "tríceps",
  "abdominales",
  "otros",
] as const

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  piernas: "Piernas",
  hombros: "Hombros",
  bíceps: "Bíceps",
  tríceps: "Tríceps",
  abdominales: "Abdominales",
  otros: "Otros",
}

export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  pecho: "var(--chart-1)",
  espalda: "var(--chart-2)",
  piernas: "var(--chart-3)",
  hombros: "var(--chart-4)",
  bíceps: "var(--chart-5)",
  tríceps: "var(--chart-1)",
  abdominales: "var(--chart-2)",
  otros: "var(--chart-3)",
}

export function getMuscleGroup(exerciseName: string): MuscleGroup {
  const name = exerciseName.trim().toLowerCase()
  for (const [group, exercises] of Object.entries(EXERCISE_CATEGORIES)) {
    if (exercises.some((ex) => ex.toLowerCase() === name)) {
      const normalized = group.toLowerCase()
      if (normalized === "biceps") return "bíceps"
      if (normalized === "triceps") return "tríceps"
      if (normalized === "brazos") return "bíceps"
      if (normalized === "core") return "abdominales"
      if (MUSCLE_GROUPS.includes(normalized as MuscleGroup)) {
        return normalized as MuscleGroup
      }
    }
  }
  return "otros"
}
