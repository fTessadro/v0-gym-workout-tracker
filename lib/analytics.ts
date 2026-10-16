import { Exercise, Workout, Set } from "@/hooks/use-workouts"
import { getMuscleGroup, normalizeKey, ExerciseDef, MuscleGroup, MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from "@/lib/exercises"

export function calcSetVolume(set: { reps: number; weight: number }): number {
  return set.reps * set.weight
}

export function calcExerciseVolume(exercise: Exercise): number {
  return exercise.sets.reduce((acc, s) => acc + calcSetVolume(s), 0)
}

export function calcWorkoutVolume(workout: Workout): number {
  return workout.exercises.reduce((acc, ex) => acc + calcExerciseVolume(ex), 0)
}

// Texto plano para copiar: nombre del entrenamiento, y por ejercicio una línea por serie ("8 x 45kg")
export function formatWorkoutAsText(workout: Workout): string {
  const lines = [workout.name]
  for (const ex of workout.exercises) {
    if (ex.sets.length === 0) continue
    lines.push(ex.name)
    for (const s of ex.sets) lines.push(`${s.reps} x ${Number(s.weight)}kg`)
  }
  return lines.join("\n")
}

export function calcTotalSets(workout: Workout): number {
  return workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
}

// 1RM estimado con fórmula de Epley: weight * (1 + reps/30)
export function calc1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export function bestSet1RM(sets: Set[]): number {
  if (sets.length === 0) return 0
  return Math.max(...sets.map((s) => calc1RM(s.weight, s.reps)))
}

export function maxWeight(sets: Set[]): number {
  if (sets.length === 0) return 0
  return Math.max(...sets.map((s) => s.weight))
}

export interface ExercisePR {
  exerciseName: string
  maxWeight: number
  maxWeightReps: number
  maxWeightDate: string
  best1RM: number
  best1RMWeight: number
  best1RMReps: number
  best1RMDate: string
  totalSessions: number
}

function getExerciseNameKey(name: string): string {
  return normalizeKey(name)
}

export function getPRs(workouts: Workout[]): ExercisePR[] {
  const map = new Map<string, ExercisePR>()

  const sorted = [...workouts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  for (const w of sorted) {
    for (const ex of w.exercises) {
      if (ex.sets.length === 0) continue
      const key = getExerciseNameKey(ex.name)
      const current = map.get(key) || {
        exerciseName: ex.name,
        maxWeight: 0,
        maxWeightReps: 0,
        maxWeightDate: w.date,
        best1RM: 0,
        best1RMWeight: 0,
        best1RMReps: 0,
        best1RMDate: w.date,
        totalSessions: 0,
      }

      current.totalSessions += 1

      for (const s of ex.sets) {
        if (s.weight > current.maxWeight) {
          current.maxWeight = s.weight
          current.maxWeightReps = s.reps
          current.maxWeightDate = w.date
        }
        const oneRM = calc1RM(s.weight, s.reps)
        if (oneRM > current.best1RM) {
          current.best1RM = oneRM
          current.best1RMWeight = s.weight
          current.best1RMReps = s.reps
          current.best1RMDate = w.date
        }
      }

      map.set(key, current)
    }
  }

  return Array.from(map.values()).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName))
}

export interface PRHit {
  exerciseName: string
  set: Set
  type: "maxWeight" | "best1RM"
  previousValue: number
  newValue: number
}

export function getPRsInSession(workout: Workout, allWorkouts: Workout[]): PRHit[] {
  const hits: PRHit[] = []
  const otherWorkouts = allWorkouts.filter((w) => w.id !== workout.id)
  const prs = getPRs(otherWorkouts)
  const prsByName = new Map(prs.map((p) => [getExerciseNameKey(p.exerciseName), p]))

  for (const ex of workout.exercises) {
    if (ex.sets.length === 0) continue
    const previous = prsByName.get(getExerciseNameKey(ex.name))
    let bestWeightInSession = 0
    let best1RMInSession = 0

    for (const s of ex.sets) {
      if (s.weight > bestWeightInSession) bestWeightInSession = s.weight
      const oneRM = calc1RM(s.weight, s.reps)
      if (oneRM > best1RMInSession) best1RMInSession = oneRM
    }

    if (bestWeightInSession > 0) {
      const prevMax = previous?.maxWeight || 0
      if (bestWeightInSession > prevMax) {
        const topSet = ex.sets.find((s) => s.weight === bestWeightInSession) || ex.sets[0]
        hits.push({
          exerciseName: ex.name,
          set: topSet,
          type: "maxWeight",
          previousValue: prevMax,
          newValue: bestWeightInSession,
        })
      }
    }

    if (best1RMInSession > 0) {
      const prev1RM = previous?.best1RM || 0
      if (best1RMInSession > prev1RM) {
        const topSet = ex.sets.reduce(
          (best, s) => (calc1RM(s.weight, s.reps) > calc1RM(best.weight, best.reps) ? s : best),
          ex.sets[0]
        )
        hits.push({
          exerciseName: ex.name,
          set: topSet,
          type: "best1RM",
          previousValue: prev1RM,
          newValue: best1RMInSession,
        })
      }
    }
  }

  return hits
}

export function isSetPR(
  set: Set,
  exerciseName: string,
  allWorkouts: Workout[],
  currentWorkoutId: string
): boolean {
  const otherWorkouts = allWorkouts.filter((w) => w.id !== currentWorkoutId)
  const prs = getPRs(otherWorkouts)
  const pr = prs.find((p) => getExerciseNameKey(p.exerciseName) === getExerciseNameKey(exerciseName))
  if (!pr) return set.weight > 0
  const oneRM = calc1RM(set.weight, set.reps)
  return set.weight >= pr.maxWeight || oneRM >= pr.best1RM
}

export interface VolumeByMuscle {
  group: MuscleGroup
  label: string
  volume: number
  percentage: number
}

export function getVolumeByMuscle(workouts: Workout[], customExercises: ExerciseDef[] = []): VolumeByMuscle[] {
  const totals: Record<string, number> = {}
  MUSCLE_GROUPS.forEach((g) => (totals[g] = 0))

  for (const w of workouts) {
    for (const ex of w.exercises) {
      const group = getMuscleGroup(ex.name, customExercises)
      totals[group] = (totals[group] || 0) + calcExerciseVolume(ex)
    }
  }

  const total = Object.values(totals).reduce((a, b) => a + b, 0)
  return MUSCLE_GROUPS.map((g) => ({
    group: g,
    label: MUSCLE_GROUP_LABELS[g],
    volume: totals[g],
    percentage: total > 0 ? (totals[g] / total) * 100 : 0,
  })).filter((item) => item.volume > 0)
}

export function filterWorkoutsByRange(
  workouts: Workout[],
  range: "all" | "month" | "week"
): Workout[] {
  if (range === "all") return workouts
  const now = new Date()
  const cutoff = new Date(now)
  if (range === "month") cutoff.setMonth(now.getMonth() - 1)
  if (range === "week") cutoff.setDate(now.getDate() - 7)
  return workouts.filter((w) => new Date(w.date) >= cutoff)
}
