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
import { Plus } from 'lucide-react'

interface NewWorkoutDialogProps {
  onCreateWorkout: (name: string) => void
}

export function NewWorkoutDialog({ onCreateWorkout }: NewWorkoutDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')

  const handleCreate = () => {
    if (name.trim()) {
      onCreateWorkout(name)
      setName('')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Entrenamiento
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-sm">
        <DialogHeader>
          <DialogTitle>Crear nuevo entrenamiento</DialogTitle>
          <DialogDescription>¿Cómo se llamará este entrenamiento?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Ej: Pecho y Tríceps"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreate()
              }
            }}
            autoFocus
          />
          <Button onClick={handleCreate} className="w-full">
            Crear
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
