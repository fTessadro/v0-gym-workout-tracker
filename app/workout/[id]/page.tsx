'use client'

import { useParams, useRouter } from 'next/navigation'
import { useWorkouts } from '@/hooks/use-workouts'
import { AddExerciseDialog } from '@/components/add-exercise-dialog'
import { ExerciseCard } from '@/components/exercise-card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function WorkoutDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { workouts, getWorkout, addExercise, addSet, deleteSet, deleteExercise } = useWorkouts()

  const workout = getWorkout(params.id as string)

  if (!workout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Entrenamiento no encontrado</p>
      </div>
    )
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

  const getPreviousExerciseData = (exerciseName: string, currentWorkoutDate: string) => {
    if (!workouts || workouts.length === 0) return null;
    const olderWorkouts = workouts.filter(w => new Date(w.date) < new Date(currentWorkoutDate));
    
    for (const w of olderWorkouts) {
      const prevExercise = w.exercises.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
      if (prevExercise && prevExercise.sets.length > 0) {
        const maxWeightData = prevExercise.sets.reduce((max, set) => set.weight > max.weight ? set : max, prevExercise.sets[0]);
        const setsWithMaxWeight = prevExercise.sets.filter(s => s.weight === maxWeightData.weight && s.reps === maxWeightData.reps);
        return `${setsWithMaxWeight.length}x${maxWeightData.reps} con ${maxWeightData.weight}kg`;
      }
    }
    return null;
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
        </div>

        {/* Add Exercise Button */}
        <div className="mb-6">
          <AddExerciseDialog
            workoutName={workout.name}
            onAddExercise={(name) => {
              addExercise(workout.id, name)
            }}
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
                previousData={getPreviousExerciseData(exercise.name, workout.date)}
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
