'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Workout } from '@/hooks/use-workouts'
import { Trash2, Copy, BookmarkPlus, Loader2, StickyNote } from 'lucide-react'

interface WorkoutListProps {
  workouts: Workout[]
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onSaveAsTemplate: (id: string) => void
  deletingWorkoutId?: string | null
  duplicatingWorkoutId?: string | null
  savingTemplateFromWorkoutId?: string | null
}

export function WorkoutList({
  workouts,
  onDelete,
  onDuplicate,
  onSaveAsTemplate,
  deletingWorkoutId,
  duplicatingWorkoutId,
  savingTemplateFromWorkoutId,
}: WorkoutListProps) {
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
        const isDeleting = deletingWorkoutId === workout.id
        const isDuplicating = duplicatingWorkoutId === workout.id
        const isSavingTemplate = savingTemplateFromWorkoutId === workout.id
        const hasNotes = workout.notes && workout.notes.trim().length > 0

        return (
          <Card key={workout.id} className="p-0 overflow-hidden">
            <Link href={`/workout/${workout.id}`} className="block">
              <div className="p-4 hover:bg-accent transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{workout.name}</h3>
                  {hasNotes && (
                    <StickyNote className="w-4 h-4 text-muted-foreground" aria-label="Tiene notas" />
                  )}
                </div>
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
            <div className="border-t grid grid-cols-3">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none text-muted-foreground hover:bg-muted"
                disabled={isDuplicating}
                onClick={() => onDuplicate(workout.id)}
              >
                {isDuplicating ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                <span className="text-xs">Duplicar</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none text-muted-foreground hover:bg-muted border-l"
                disabled={isSavingTemplate}
                onClick={() => onSaveAsTemplate(workout.id)}
              >
                {isSavingTemplate ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <BookmarkPlus className="w-4 h-4 mr-1" />
                )}
                <span className="text-xs">Plantilla</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none text-destructive hover:bg-destructive/10 border-l"
                disabled={isDeleting}
                onClick={() => {
                  if (confirm('¿Eliminar este entrenamiento?')) {
                    onDelete(workout.id)
                  }
                }}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                <span className="text-xs">Eliminar</span>
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
