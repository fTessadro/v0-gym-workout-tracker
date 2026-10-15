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

// Tipos de día de entrenamiento: los mismos grupos, sin "otros"
export type DayType = Exclude<MuscleGroup, "otros">
export const DAY_TYPES = MUSCLE_GROUPS.filter((g) => g !== "otros") as DayType[]

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
  pecho: "#ef4444",
  espalda: "#3b82f6",
  piernas: "#22c55e",
  hombros: "#f59e0b",
  bíceps: "#a855f7",
  tríceps: "#ec4899",
  abdominales: "#14b8a6",
  otros: "#94a3b8",
}

/**
 * Un ejercicio del catálogo.
 * - `muscle`: UN solo músculo principal, es lo que usan las estadísticas.
 * - `suggestedIn`: en qué tipos de día se sugiere (puede ser más de uno,
 *   por ej. las elevaciones laterales también se sugieren en día de pecho).
 */
export interface ExerciseDef {
  name: string
  muscle: MuscleGroup
  suggestedIn: DayType[]
  aliases?: string[]
  custom?: boolean
}

export const BASE_EXERCISES: ExerciseDef[] = [
  // Pecho
  { name: "Press de Banca", muscle: "pecho", suggestedIn: ["pecho"], aliases: ["press banca", "banca", "bench press"] },
  { name: "Aperturas con Mancuernas", muscle: "pecho", suggestedIn: ["pecho"], aliases: ["aperturas"] },
  { name: "Press Inclinado", muscle: "pecho", suggestedIn: ["pecho"], aliases: ["press inclinado con mancuernas"] },
  { name: "Cruces en Polea", muscle: "pecho", suggestedIn: ["pecho"], aliases: ["cruces", "cruces polea", "cruce de poleas"] },
  // Espalda
  { name: "Dominadas", muscle: "espalda", suggestedIn: ["espalda"], aliases: ["dominada", "pull ups"] },
  { name: "Convergente", muscle: "espalda", suggestedIn: ["espalda"] },
  { name: "Jalón al Pecho", muscle: "espalda", suggestedIn: ["espalda"], aliases: ["jalon", "polea al pecho"] },
  { name: "Remo en Polea Baja", muscle: "espalda", suggestedIn: ["espalda"], aliases: ["remo polea", "remo en polea"] },
  { name: "Remo Máquina", muscle: "espalda", suggestedIn: ["espalda"], aliases: ["remo en maquina"] },
  // Piernas
  { name: "Pendular", muscle: "piernas", suggestedIn: ["piernas"] },
  { name: "Prensa de Piernas", muscle: "piernas", suggestedIn: ["piernas"], aliases: ["prensa"] },
  { name: "Extensiones de Cuádriceps", muscle: "piernas", suggestedIn: ["piernas"], aliases: ["extensiones de cuadriceps", "sillon de cuadriceps", "cuadriceps"] },
  { name: "Curl Femoral", muscle: "piernas", suggestedIn: ["piernas"], aliases: ["femorales", "isquios"] },
  { name: "Búlgaras", muscle: "piernas", suggestedIn: ["piernas"], aliases: ["sentadilla bulgara", "bulgaras"] },
  { name: "Peso Muerto Rumano", muscle: "piernas", suggestedIn: ["piernas"], aliases: ["rumano"] },
  // Hombros
  { name: "Press Militar", muscle: "hombros", suggestedIn: ["hombros"], aliases: ["press de hombros", "militar"] },
  { name: "Elevaciones Laterales", muscle: "hombros", suggestedIn: ["pecho", "hombros"], aliases: ["vuelos laterales", "laterales"] },
  { name: "Pájaros", muscle: "hombros", suggestedIn: ["hombros"], aliases: ["pajaros", "vuelos posteriores", "vuelos traseros"] },
  { name: "Elevaciones Frontales", muscle: "hombros", suggestedIn: ["hombros"], aliases: ["frontales"] },
  // Bíceps
  { name: "Curl de Bíceps", muscle: "bíceps", suggestedIn: ["hombros", "bíceps"], aliases: ["curl", "curl biceps", "curl con barra"] },
  { name: "Curl Martillo", muscle: "bíceps", suggestedIn: ["bíceps"], aliases: ["martillo"] },
  { name: "Curl Predicador", muscle: "bíceps", suggestedIn: ["hombros", "bíceps"], aliases: ["predicador"] },
  // Tríceps
  { name: "Press Francés", muscle: "tríceps", suggestedIn: ["tríceps"], aliases: ["press frances", "frances"] },
  { name: "Extensiones en Polea", muscle: "tríceps", suggestedIn: ["hombros", "tríceps"], aliases: ["extension en polea", "triceps en polea", "jalon de triceps"] },
  { name: "Fondos de Tríceps", muscle: "tríceps", suggestedIn: ["tríceps"], aliases: ["fondos", "fondos de triceps"] },
  { name: "Katana", muscle: "tríceps", suggestedIn: ["hombros", "tríceps"] },
  // Abdominales
  { name: "Crunch", muscle: "abdominales", suggestedIn: ["abdominales"], aliases: ["abdominales"] },
  { name: "Plancha", muscle: "abdominales", suggestedIn: ["abdominales"] },
  { name: "Elevación de Piernas", muscle: "abdominales", suggestedIn: ["abdominales"], aliases: ["elevacion de piernas"] },
]

/** Clave normalizada: sin tildes, minúsculas, espacios colapsados. Sirve para agrupar nombres. */
export function normalizeKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

function allDefs(custom: ExerciseDef[]): ExerciseDef[] {
  return [...custom, ...BASE_EXERCISES]
}

export function findExerciseDef(name: string, custom: ExerciseDef[] = []): ExerciseDef | undefined {
  const key = normalizeKey(name)
  if (!key) return undefined
  const defs = allDefs(custom)
  return (
    defs.find((d) => normalizeKey(d.name) === key) ||
    defs.find((d) => d.aliases?.some((a) => normalizeKey(a) === key))
  )
}

export function getMuscleGroup(exerciseName: string, custom: ExerciseDef[] = []): MuscleGroup {
  return findExerciseDef(exerciseName, custom)?.muscle ?? "otros"
}

/**
 * Nombre canónico para guardar: el del catálogo/ejercicio propio si coincide
 * (nombre o alias), o el que ya usaste antes en tu historial, o el texto limpio.
 */
export function resolveExerciseName(
  name: string,
  custom: ExerciseDef[] = [],
  history: { exercises: { name: string }[] }[] = []
): string {
  const clean = name.trim().replace(/\s+/g, " ")
  const def = findExerciseDef(clean, custom)
  if (def) return def.name
  const key = normalizeKey(clean)
  for (const w of history) {
    const hit = w.exercises.find((e) => normalizeKey(e.name) === key)
    if (hit) return hit.name
  }
  return clean
}

const DAY_KEYWORDS: [string, DayType[]][] = [
  ["pecho", ["pecho"]],
  ["espalda", ["espalda"]],
  ["pierna", ["piernas"]],
  ["hombro", ["hombros"]],
  ["bicep", ["bíceps"]],
  ["tricep", ["tríceps"]],
  ["brazo", ["bíceps", "tríceps"]],
  ["abdominal", ["abdominales"]],
  ["core", ["abdominales"]],
]

/** Tipos de día que se deducen del nombre del entrenamiento ("Pecho y Tríceps" → pecho + tríceps). */
export function getDayTypes(workoutName: string): DayType[] {
  const n = normalizeKey(workoutName)
  const found = new Set<DayType>()
  for (const [kw, types] of DAY_KEYWORDS) {
    if (n.includes(kw)) types.forEach((t) => found.add(t))
  }
  return Array.from(found)
}

interface HistoryWorkout {
  name: string
  exercises: { name: string }[]
}

/**
 * Sugerencias para un entrenamiento: ejercicios del catálogo y propios que
 * corresponden a ese tipo de día, más los que ya usaste en días de ese tipo.
 * Se ordenan por cuántas veces los usaste en ese tipo de día.
 * Sin tipo de día reconocido ("Cuerpo Completo", "Martes") se ofrece todo.
 */
export function getSuggestions(
  workoutName: string,
  history: HistoryWorkout[],
  custom: ExerciseDef[] = [],
  excludeNames: string[] = []
): ExerciseDef[] {
  const dayTypes = getDayTypes(workoutName)
  const excluded = new Set(excludeNames.map(normalizeKey))
  const defs = allDefs(custom)

  // Uso por ejercicio, dentro de los días del mismo tipo (o total si no hay tipo)
  const usage = new Map<string, number>()
  const historyNames = new Map<string, string>()
  for (const w of history) {
    const wTypes = getDayTypes(w.name)
    const relevant = dayTypes.length === 0 || wTypes.some((t) => dayTypes.includes(t))
    for (const ex of w.exercises) {
      const key = normalizeKey(ex.name)
      if (!key) continue
      if (!historyNames.has(key)) historyNames.set(key, ex.name)
      if (relevant) usage.set(key, (usage.get(key) || 0) + 1)
    }
  }

  const result = new Map<string, ExerciseDef>()
  const add = (def: ExerciseDef) => {
    const key = normalizeKey(def.name)
    if (!excluded.has(key) && !result.has(key)) result.set(key, def)
  }

  for (const def of defs) {
    if (dayTypes.length === 0 || def.suggestedIn.some((t) => dayTypes.includes(t))) add(def)
  }
  // Ejercicios aprendidos del historial que no están en el catálogo
  for (const [key, name] of historyNames) {
    if (usage.has(key) && !findExerciseDef(name, custom)) {
      add({ name, muscle: "otros", suggestedIn: [] })
    }
  }

  const order = Array.from(result.values())
  return order
    .map((def, i) => ({ def, i, score: usage.get(normalizeKey(def.name)) || 0 }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((x) => x.def)
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
  }
  return dp[a.length][b.length]
}

/** Ejercicios conocidos con nombre parecido al escrito (para "¿Quisiste decir...?"). */
export function findSimilarExercises(
  name: string,
  custom: ExerciseDef[] = [],
  history: HistoryWorkout[] = [],
  limit = 2
): string[] {
  const key = normalizeKey(name)
  if (key.length < 3) return []
  const candidates = new Map<string, string>()
  for (const d of allDefs(custom)) candidates.set(normalizeKey(d.name), d.name)
  for (const w of history) for (const e of w.exercises) candidates.set(normalizeKey(e.name), e.name)

  const scored: { name: string; dist: number }[] = []
  for (const [cKey, cName] of candidates) {
    if (cKey === key) return []
    const dist = levenshtein(key, cKey)
    const tolerance = Math.max(2, Math.floor(cKey.length * 0.25))
    const contained = key.length >= 4 && (cKey.includes(key) || key.includes(cKey))
    if (dist <= tolerance || contained) scored.push({ name: cName, dist: contained ? 0 : dist })
  }
  return scored.sort((a, b) => a.dist - b.dist).slice(0, limit).map((s) => s.name)
}
