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
import { Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const PREDEFINED_EXERCISES = [
  "Press de Banca",
  "Sentadilla",
  "Peso Muerto",
  "Press Militar",
  "Dominadas",
  "Remo con Barra",
  "Curl de Bíceps",
  "Press Francés",
  "Elevaciones Laterales",
  "Prensa de Piernas",
  "Curl Femoral"
]

interface AddExerciseDialogProps {
  onAddExercise: (name: string) => void
}

export function AddExerciseDialog({ onAddExercise }: AddExerciseDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

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
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Ejercicio
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
                {PREDEFINED_EXERCISES.map((exercise) => (
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
          
          {name.trim() !== '' && !PREDEFINED_EXERCISES.some(e => e.toLowerCase() === name.toLowerCase()) && (
            <Button onClick={handleAdd} className="w-full">
              Agregar "{name}"
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
