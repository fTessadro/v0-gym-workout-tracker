'use client'

import { useWorkouts } from '@/hooks/use-workouts'
import { WorkoutList } from '@/components/workout-list'
import { NewWorkoutDialog } from '@/components/new-workout-dialog'

export default function Home() {
  const { workouts, isLoaded, createWorkout, deleteWorkout } = useWorkouts()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 pt-6 pb-20">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Mis Entrenamientos</h1>
          <p className="text-muted-foreground mt-2">Trackea tu progreso en el gimnasio</p>
        </div>

        {/* New Workout Button */}
        <div className="mb-8">
          <NewWorkoutDialog
            onCreateWorkout={(name) => {
              createWorkout(name)
            }}
          />
        </div>

        {/* Workouts List */}
        <WorkoutList workouts={workouts} onDelete={deleteWorkout} />
      </div>
    </main>
  )
}
