'use client'

import { Workout } from '@/hooks/use-workouts'
import { Card } from '@/components/ui/card'
import { Trophy, Dumbbell, Layers } from 'lucide-react'
import { calcWorkoutVolume, calcTotalSets, getPRsInSession } from '@/lib/analytics'

interface SessionSummaryProps {
  workout: Workout
  allWorkouts: Workout[]
}

export function SessionSummary({ workout, allWorkouts }: SessionSummaryProps) {
  const volume = calcWorkoutVolume(workout)
  const totalSets = calcTotalSets(workout)
  const prs = getPRsInSession(workout, allWorkouts)

  if (workout.exercises.length === 0) return null

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Dumbbell className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Resumen de la sesión</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-muted/40 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{Math.round(volume)}</p>
          <p className="text-xs text-muted-foreground">Volumen total (kg)</p>
        </div>
        <div className="bg-muted/40 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{totalSets}</p>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Layers className="w-3 h-3" /> series
          </p>
        </div>
      </div>
      {prs.length > 0 && (
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <p className="text-sm font-semibold">
              {prs.length === 1 ? '¡Nuevo récord!' : `¡${prs.length} nuevos récords!`}
            </p>
          </div>
          <ul className="space-y-1.5">
            {prs.map((pr, i) => (
              <li key={`${pr.exerciseName}-${pr.type}-${i}`} className="text-xs flex items-center justify-between gap-2">
                <span className="capitalize truncate flex-1">{pr.exerciseName}</span>
                <span className="text-muted-foreground shrink-0">
                  {pr.type === 'maxWeight'
                    ? `${Math.round(pr.newValue)}kg × ${pr.set.reps}`
                    : `1RM ${Math.round(pr.newValue)}kg`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
