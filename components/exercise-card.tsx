'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Exercise, Set } from '@/hooks/use-workouts'
import { Trash2, Plus, Minus, Info, Loader2, Trophy } from 'lucide-react'

export interface PreviousSession {
  date: string
  sets: { reps: number; weight: number }[]
}

interface ExerciseCardProps {
  exercise: Exercise
  previousSession?: PreviousSession | null
  isAddingSet?: boolean
  deletingSetId?: string | null
  isDeletingExercise?: boolean
  isPRSet?: (set: Set) => boolean
  onAddSet: (reps: number, weight: number) => void
  onDeleteSet: (setId: string) => void
  onDeleteExercise: () => void
}

const WEIGHT_STEP = 2.5

function formatNumber(n: number): string {
  return String(Math.round(Number(n) * 100) / 100)
}

export function ExerciseCard({
  exercise,
  previousSession,
  isAddingSet = false,
  deletingSetId,
  isDeletingExercise = false,
  isPRSet,
  onAddSet,
  onDeleteSet,
  onDeleteExercise,
}: ExerciseCardProps) {
  // Valores sugeridos: la última serie de hoy o, si no hay, la primera de la última vez
  const lastSet = exercise.sets[exercise.sets.length - 1]
  const defaultSet = lastSet ?? previousSession?.sets[0]

  const [reps, setReps] = useState(defaultSet ? formatNumber(defaultSet.reps) : '')
  const [weight, setWeight] = useState(defaultSet ? formatNumber(defaultSet.weight) : '')
  const touched = useRef(false)

  // Si llegan datos después (o se agrega una serie) y no tocaste nada, se actualiza el prellenado
  useEffect(() => {
    if (!touched.current && defaultSet) {
      setReps(formatNumber(defaultSet.reps))
      setWeight(formatNumber(defaultSet.weight))
    }
  }, [defaultSet?.reps, defaultSet?.weight]) // eslint-disable-line react-hooks/exhaustive-deps

  const parseWeight = (v: string) => parseFloat(v.replace(',', '.'))

  const bump = (field: 'reps' | 'weight', delta: number) => {
    touched.current = true
    if (field === 'reps') {
      const next = Math.max(1, (parseInt(reps) || 0) + delta)
      setReps(String(next))
    } else {
      const next = Math.max(0, (parseWeight(weight) || 0) + delta)
      setWeight(formatNumber(next))
    }
  }

  const fillFrom = (s: { reps: number; weight: number }) => {
    touched.current = true
    setReps(formatNumber(s.reps))
    setWeight(formatNumber(s.weight))
  }

  const repsNum = parseInt(reps)
  const weightNum = parseWeight(weight)
  const canSave = repsNum > 0 && weightNum >= 0 && !isAddingSet

  const handleAddSet = () => {
    if (!canSave) return
    onAddSet(repsNum, weightNum)
    // Los valores quedan cargados para repetir la misma serie con un solo toque
    touched.current = false
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddSet()
  }

  const prevDate = previousSession
    ? new Date(previousSession.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    : ''

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold">{exercise.name}</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
          onClick={onDeleteExercise}
          disabled={isDeletingExercise}
        >
          {isDeletingExercise ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Todas las series de la última vez; tocar una la carga en el formulario */}
      {previousSession && previousSession.sets.length > 0 && (
        <div className="mb-4 bg-primary/10 rounded-lg px-3 py-2">
          <p className="text-xs text-primary flex items-center gap-1.5 mb-1.5">
            <Info className="w-3.5 h-3.5" />
            Última vez · {prevDate}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {previousSession.sets.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => fillFrom(s)}
                className="text-xs font-medium bg-background border rounded-md px-2 py-1 active:bg-accent"
              >
                {s.reps}×{formatNumber(s.weight)}kg
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sets List */}
      {exercise.sets.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-sm text-muted-foreground font-medium">Series ({exercise.sets.length}):</p>
          <div className="space-y-2">
            {exercise.sets.map((set, index) => {
              const isSetDeleting = deletingSetId === set.id
              const isPR = isPRSet ? isPRSet(set) : false
              return (
                <div
                  key={set.id}
                  className="flex items-center justify-between bg-muted/50 border border-border p-3 rounded-lg"
                >
                  <div className="flex-1 flex items-center gap-2">
                    <p className="text-sm">
                      <span className="font-semibold text-primary">S{index + 1}:</span>{' '}
                      <span className="font-medium">{set.reps}x{formatNumber(set.weight)}kg</span>
                    </p>
                    {isPR && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-500 hover:bg-yellow-500 text-yellow-950">
                        <Trophy className="w-2.5 h-2.5 mr-0.5" />
                        PR
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 ml-2"
                    onClick={() => onDeleteSet(set.id)}
                    disabled={isSetDeleting}
                  >
                    {isSetDeleting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Formulario siempre abierto */}
      <div className="space-y-3 bg-primary/5 border border-primary/20 p-3 rounded-lg">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Repeticiones</label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-9 shrink-0"
                onClick={() => bump('reps', -1)}
                disabled={isAddingSet}
                aria-label="Menos repeticiones"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="12"
                value={reps}
                onChange={(e) => {
                  touched.current = true
                  setReps(e.target.value)
                }}
                onKeyDown={handleKeyDown}
                className="h-10 min-w-0 px-1 text-center"
                disabled={isAddingSet}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-9 shrink-0"
                onClick={() => bump('reps', 1)}
                disabled={isAddingSet}
                aria-label="Más repeticiones"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Peso (kg)</label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-9 shrink-0"
                onClick={() => bump('weight', -WEIGHT_STEP)}
                disabled={isAddingSet}
                aria-label="Menos peso"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="50"
                value={weight}
                onChange={(e) => {
                  touched.current = true
                  setWeight(e.target.value)
                }}
                onKeyDown={handleKeyDown}
                className="h-10 min-w-0 px-1 text-center"
                disabled={isAddingSet}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-9 shrink-0"
                onClick={() => bump('weight', WEIGHT_STEP)}
                disabled={isAddingSet}
                aria-label="Más peso"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <Button className="w-full" onClick={handleAddSet} disabled={!canSave}>
          {isAddingSet ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {isAddingSet ? 'Guardando...' : `Guardar serie ${exercise.sets.length + 1}`}
        </Button>
      </div>
    </Card>
  )
}
