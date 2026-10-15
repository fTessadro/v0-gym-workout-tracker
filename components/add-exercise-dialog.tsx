'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Plus, Loader2, ArrowLeft } from 'lucide-react'
import {
  DAY_TYPES,
  DayType,
  ExerciseDef,
  MuscleGroup,
  MUSCLE_GROUP_LABELS,
  findExerciseDef,
  findSimilarExercises,
  getDayTypes,
  getSuggestions,
  normalizeKey,
} from '@/lib/exercises'

interface AddExerciseDialogProps {
  workoutName: string
  workouts: { name: string; exercises: { name: string }[] }[]
  customExercises: ExerciseDef[]
  existingExerciseNames: string[]
  isLoading?: boolean
  onAddExercise: (name: string) => void
  onCreateCustomExercise: (name: string, muscle: MuscleGroup, suggestedIn: DayType[]) => Promise<unknown>
}

export function AddExerciseDialog({
  workoutName,
  workouts,
  customExercises,
  existingExerciseNames,
  isLoading = false,
  onAddExercise,
  onCreateCustomExercise,
}: AddExerciseDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [step, setStep] = useState<'pick' | 'muscle'>('pick')

  const suggestions = useMemo(
    () => getSuggestions(workoutName, workouts, customExercises, existingExerciseNames),
    [workoutName, workouts, customExercises, existingExerciseNames]
  )

  const trimmed = name.trim()
  const known = trimmed ? findExerciseDef(trimmed, customExercises) : undefined
  const similar = useMemo(
    () => (trimmed && !known ? findSimilarExercises(trimmed, customExercises, workouts) : []),
    [trimmed, known, customExercises, workouts]
  )
  const matchesSuggestion = suggestions.some((s) => normalizeKey(s.name) === normalizeKey(trimmed))

  const reset = () => {
    setName('')
    setStep('pick')
  }

  const addAndClose = (exerciseName: string) => {
    onAddExercise(exerciseName)
    reset()
    setOpen(false)
  }

  const handleTypedAdd = () => {
    if (!trimmed) return
    // Si coincide con un ejercicio conocido (nombre o alias) se agrega directo; si no, se pide el músculo
    if (known) {
      addAndClose(trimmed)
    } else {
      setStep('muscle')
    }
  }

  const handleMuscle = async (muscle: MuscleGroup) => {
    const suggestedIn = Array.from(new Set<DayType>([
      ...(muscle !== 'otros' ? [muscle as DayType] : []),
      ...getDayTypes(workoutName),
    ]))
    await onCreateCustomExercise(trimmed, muscle, suggestedIn)
    addAndClose(trimmed)
  }

  const filter = (value: string, search: string, keywords?: string[]) => {
    const q = normalizeKey(search)
    if (!q) return 1
    if (value.includes(q)) return 1
    if (keywords?.some((k) => k.includes(q))) return 0.5
    return 0
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          {isLoading ? 'Agregando...' : 'Agregar Ejercicio'}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-sm">
        {step === 'pick' ? (
          <>
            <DialogHeader>
              <DialogTitle>Nuevo ejercicio</DialogTitle>
              <DialogDescription>Elegí uno de la lista o escribí uno nuevo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Command className="rounded-lg border shadow-md" filter={filter}>
                <CommandInput
                  placeholder="Buscar o crear ejercicio..."
                  value={name}
                  onValueChange={setName}
                />
                <CommandList>
                  <CommandEmpty>No hay coincidencias.</CommandEmpty>
                  <CommandGroup heading="Sugerencias">
                    {suggestions.map((exercise) => (
                      <CommandItem
                        key={exercise.name}
                        value={normalizeKey(exercise.name)}
                        keywords={(exercise.aliases || []).map(normalizeKey)}
                        onSelect={() => addAndClose(exercise.name)}
                      >
                        <span className="flex-1">{exercise.name}</span>
                        {exercise.muscle !== 'otros' && (
                          <span className="text-xs text-muted-foreground">
                            {MUSCLE_GROUP_LABELS[exercise.muscle]}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>

              {similar.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">¿Quisiste decir...?</p>
                  <div className="flex flex-wrap gap-2">
                    {similar.map((s) => (
                      <Button key={s} variant="secondary" size="sm" onClick={() => addAndClose(s)}>
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {trimmed !== '' && !matchesSuggestion && (
                <Button onClick={handleTypedAdd} className="w-full">
                  {known ? `Agregar "${known.name}"` : `Crear "${trimmed}"`}
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>¿Qué músculo trabaja?</DialogTitle>
              <DialogDescription>
                "{trimmed}" va a quedar sugerido en los días de ese músculo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              {DAY_TYPES.map((muscle) => (
                <Button key={muscle} variant="outline" onClick={() => handleMuscle(muscle)}>
                  {MUSCLE_GROUP_LABELS[muscle]}
                </Button>
              ))}
              <Button variant="ghost" className="col-span-2" onClick={() => handleMuscle('otros')}>
                Otro / no sé
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="self-start" onClick={() => setStep('pick')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
