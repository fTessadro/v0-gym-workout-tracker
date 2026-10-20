'use client'

import { useParams, useRouter } from 'next/navigation'
import { useWorkouts } from '@/hooks/use-workouts'
import { AddExerciseDialog } from '@/components/add-exercise-dialog'
import { ExerciseCard, PreviousSession } from '@/components/exercise-card'
import { WorkoutNotes } from '@/components/workout-notes'
import { SessionSummary } from '@/components/session-summary'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { isSetPR, formatWorkoutAsText, calcTotalSets } from '@/lib/analytics'
import { normalizeKey } from '@/lib/exercises'

export default function WorkoutDetailPage() {
  const params = useParams()
  const router = useRouter()
  const {
    workouts,
    getWorkout,
    addExercise,
    customExercises,
    createCustomExercise,
    addSet,
    deleteSet,
    deleteExercise,
    updateWorkoutNotes,
    addingExerciseToWorkoutId,
    deletingExerciseId,
    addingSetToExerciseId,
    deletingSetId,
  } = useWorkouts()

  const workout = getWorkout(params.id as string)

  if (!workout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Entrenamiento no encontrado</p>
      </div>
    )
  }

  const handleCopy = async () => {
    const text = formatWorkoutAsText(workout)
    if (calcTotalSets(workout) === 0) {
      toast.error('Todavía no hay series cargadas para copiar.')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Fallback para navegadores sin Clipboard API
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      if (!ok) {
        toast.error('No se pudo copiar.')
        return
      }
    }
    toast.success('Entrenamiento copiado.')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Todas las series de la sesión más reciente anterior que tenga este ejercicio
  const getPreviousSession = (exerciseName: string, currentWorkoutDate: string): PreviousSession | null => {
    const key = normalizeKey(exerciseName)
    const olderWorkouts = workouts
      .filter((w) => new Date(w.date) < new Date(currentWorkoutDate))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    for (const w of olderWorkouts) {
      const prev = w.exercises.find((e) => normalizeKey(e.name) === key && e.sets.length > 0)
      if (prev) {
        return {
          date: w.date,
          sets: prev.sets.map((s) => ({ reps: s.reps, weight: Number(s.weight) })),
        }
      }
    }
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 pt-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{workout.name}</h1>
            <p className="text-sm text-muted-foreground">{formatDate(workout.date)}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0"
            aria-label="Copiar entrenamiento"
            onClick={handleCopy}
          >
            <Copy className="w-5 h-5" />
          </Button>
        </div>

        {/* Add Exercise Button */}
        <div className="mb-6">
          <AddExerciseDialog
            workoutName={workout.name}
            workouts={workouts}
            customExercises={customExercises}
            existingExerciseNames={workout.exercises.map((e) => e.name)}
            onCreateCustomExercise={createCustomExercise}
            isLoading={addingExerciseToWorkoutId === workout.id}
            onAddExercise={(name) => {
              addExercise(workout.id, name)
            }}
          />
        </div>

        {/* Session Summary */}
        <SessionSummary workout={workout} allWorkouts={workouts} />

        {/* Notes */}
        <div className="mb-6">
          <WorkoutNotes
            notes={workout.notes}
            onSave={(notes) => updateWorkoutNotes(workout.id, notes)}
          />
        </div>

        {/* Exercises List */}
        {workout.exercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Aún no has agregado ejercicios a este entrenamiento.
            </p>
            <p className="text-sm text-muted-foreground">
              Empieza a agregar ejercicios para trackear tu entrenamiento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workout.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                previousSession={getPreviousSession(exercise.name, workout.date)}
                isAddingSet={addingSetToExerciseId === exercise.id}
                deletingSetId={deletingSetId}
                isDeletingExercise={deletingExerciseId === exercise.id}
                isPRSet={(set) => isSetPR(set, exercise.name, workouts, workout.id)}
                onAddSet={(reps, weight) => {
                  addSet(workout.id, exercise.id, reps, weight)
                }}
                onDeleteSet={(setId) => {
                  deleteSet(workout.id, exercise.id, setId)
                }}
                onDeleteExercise={() => {
                  deleteExercise(workout.id, exercise.id)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
