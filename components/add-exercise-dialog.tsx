'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Plus, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EXERCISE_CATEGORIES } from '@/lib/exercises'

const ALL_EXERCISES = Array.from(new Set(Object.values(EXERCISE_CATEGORIES).flat()))

interface AddExerciseDialogProps {
  workoutName: string
  isLoading?: boolean
  onAddExercise: (name: string) => void
}

export function AddExerciseDialog({ workoutName, isLoading = false, onAddExercise }: AddExerciseDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const getSuggestions = () => {
    const nameLower = workoutName.toLowerCase()
    const matchedCategories = Object.keys(EXERCISE_CATEGORIES).filter(cat => nameLower.includes(cat))

    if (matchedCategories.length > 0) {
      const suggestions = new Set<string>()
      matchedCategories.forEach(cat => {
        EXERCISE_CATEGORIES[cat].forEach(ex => suggestions.add(ex))
      })
      return Array.from(suggestions)
    }

    return ALL_EXERCISES
  }

  const suggestedExercises = getSuggestions()

  const handleAdd = () => {
    if (name.trim()) {
      onAddExercise(name)
      setName('')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <DialogHeader>
          <DialogTitle>Nuevo ejercicio</DialogTitle>
          <DialogDescription>¿Cuál es el nombre del ejercicio?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Command className="rounded-lg border shadow-md">
            <CommandInput
              placeholder="Buscar o crear ejercicio..."
              value={name}
              onValueChange={setName}
            />
            <CommandList>
              <CommandEmpty>
                {name.trim() !== '' ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={handleAdd}
                  >
                    Crear "{name}"
                  </Button>
                ) : (
                  "No se encontraron ejercicios."
                )}
              </CommandEmpty>
              <CommandGroup heading="Sugerencias">
                {suggestedExercises.map((exercise) => (
                  <CommandItem
                    key={exercise}
                    value={exercise}
                    onSelect={(currentValue) => {
                      // current value from command is always lowercase, so we use the original
                      onAddExercise(exercise)
                      setName('')
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        name.toLowerCase() === exercise.toLowerCase() ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {exercise}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>

          {name.trim() !== '' && !suggestedExercises.some(e => e.toLowerCase() === name.toLowerCase()) && (
            <Button onClick={handleAdd} className="w-full">
              Agregar "{name}"
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
