'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Workout } from '@/hooks/use-workouts'
import { Trash2 } from 'lucide-react'

interface WorkoutListProps {
  workouts: Workout[]
  onDelete: (id: string) => void
}

export function WorkoutList({ workouts, onDelete }: WorkoutListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <p className="text-muted-foreground text-center mb-4">
          No tienes entrenamientos registrados. ¡Crea uno nuevo!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-4">
      {workouts.map((workout) => {
        const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
        
        return (
          <Card key={workout.id} className="p-0 overflow-hidden">
            <Link href={`/workout/${workout.id}`} className="block">
              <div className="p-4 hover:bg-accent transition-colors cursor-pointer">
                <h3 className="font-semibold text-lg">{workout.name}</h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-3">
                  <span>
                    {formatDate(workout.date)} • {formatTime(workout.date)}
                  </span>
                </div>
                <div className="flex gap-4 text-sm mt-2 text-foreground">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">{workout.exercises.length}</span> ejercicios
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">{totalSets}</span> series
                  </span>
                </div>
              </div>
            </Link>
            <div className="border-t px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:bg-destructive/10"
                onClick={() => {
                  if (confirm('¿Eliminar este entrenamiento?')) {
                    onDelete(workout.id)
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
