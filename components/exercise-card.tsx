'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Exercise } from '@/hooks/use-workouts'
import { Trash2, Plus } from 'lucide-react'

interface ExerciseCardProps {
  exercise: Exercise
  onAddSet: (reps: number, weight: number) => void
  onDeleteSet: (setId: string) => void
  onDeleteExercise: () => void
}

export function ExerciseCard({
  exercise,
  onAddSet,
  onDeleteSet,
  onDeleteExercise,
}: ExerciseCardProps) {
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleAddSet = () => {
    const repsNum = parseInt(reps)
    const weightNum = parseFloat(weight)
    if (repsNum > 0 && weightNum >= 0) {
      onAddSet(repsNum, weightNum)
      setReps('')
      setWeight('')
      setShowForm(false)
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold">{exercise.name}</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
          onClick={onDeleteExercise}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Sets List */}
      {exercise.sets.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-sm text-muted-foreground font-medium">Series ({exercise.sets.length}):</p>
          <div className="space-y-2">
            {exercise.sets.map((set, index) => (
              <div
                key={set.id}
                className="flex items-center justify-between bg-muted/50 border border-border p-3 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-semibold text-primary">S{index + 1}:</span>{' '}
                    <span className="font-medium">{set.reps}x{set.weight}kg</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 ml-2"
                  onClick={() => onDeleteSet(set.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Set Form */}
      {!showForm ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Serie
        </Button>
      ) : (
        <div className="space-y-3 bg-primary/5 border border-primary/20 p-4 rounded-lg">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Repeticiones</label>
              <Input
                type="number"
                placeholder="12"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                min="1"
                className="w-full"
                autoFocus
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">Peso (kg)</label>
              <Input
                type="number"
                placeholder="50"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                min="0"
                step="0.5"
                className="w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={handleAddSet}
              disabled={!reps || !weight}
            >
              Guardar
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowForm(false)
                setReps('')
                setWeight('')
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
