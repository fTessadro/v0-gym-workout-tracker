'use client'

import { useWorkouts } from '@/hooks/use-workouts'
import { WorkoutList } from '@/components/workout-list'
import { NewWorkoutDialog } from '@/components/new-workout-dialog'
import { SettingsDialog } from '@/components/settings-dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BarChart2 } from 'lucide-react'

export default function Home() {
  const { workouts, isLoaded, createWorkout, deleteWorkout } = useWorkouts()

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center flex-col gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground text-sm">Cargando entrenamientos...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 pt-6 pb-20">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mis Entrenamientos</h1>
            <p className="text-muted-foreground mt-2">Trackea tu progreso en el gimnasio</p>
          </div>
          <SettingsDialog />
        </div>

        {/* Actions */}
        <div className="mb-8 flex gap-3">
          <div className="flex-1">
            <NewWorkoutDialog
              onCreateWorkout={(name) => {
                createWorkout(name)
              }}
            />
          </div>
          <Button variant="outline" size="lg" asChild className="px-3">
            <Link href="/stats">
              <BarChart2 className="w-5 h-5" />
            </Link>
          </Button>
        </div>

        {/* Workouts List */}
        <WorkoutList workouts={workouts} onDelete={deleteWorkout} />
      </div>
    </main>
  )
}
