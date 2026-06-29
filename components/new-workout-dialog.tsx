'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2, BookMarked } from 'lucide-react'
import { Template } from '@/hooks/use-workouts'

interface NewWorkoutDialogProps {
  onCreateWorkout: (name: string) => void
  onCreateFromTemplate: (templateId: string) => Promise<{ id: string } | undefined>
  templates?: Template[]
  isLoading?: boolean
}

export function NewWorkoutDialog({
  onCreateWorkout,
  onCreateFromTemplate,
  templates = [],
  isLoading = false,
}: NewWorkoutDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'blank' | 'template'>('blank')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  const handleCreate = async () => {
    if (mode === 'template') {
      if (!selectedTemplateId) return
      const result = await onCreateFromTemplate(selectedTemplateId)
      if (result?.id) {
        setOpen(false)
        setSelectedTemplateId('')
        router.push(`/workout/${result.id}`)
      }
      return
    }
    if (name.trim()) {
      onCreateWorkout(name)
      setName('')
      setOpen(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setName('')
      setMode('blank')
      setSelectedTemplateId('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Plus className="w-5 h-5 mr-2" />
          )}
          {isLoading ? 'Creando...' : 'Nuevo Entrenamiento'}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-sm">
        <DialogHeader>
          <DialogTitle>Crear nuevo entrenamiento</DialogTitle>
          <DialogDescription>Elegí cómo empezar.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === 'blank' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('blank')}
            >
              Desde cero
            </Button>
            <Button
              type="button"
              variant={mode === 'template' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('template')}
              disabled={templates.length === 0}
            >
              <BookMarked className="w-4 h-4 mr-1" />
              Desde plantilla
            </Button>
          </div>

          {mode === 'blank' ? (
            <>
              <div className="flex flex-wrap gap-2">
                {["Piernas", "Pecho y Tríceps", "Espalda y Bíceps", "Hombros", "Cuerpo Completo"].map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setName(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
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
            </>
          ) : (
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegí una plantilla" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.exercises.length} ejercicios)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={handleCreate}
            className="w-full"
            disabled={isLoading || (mode === 'blank' ? !name.trim() : !selectedTemplateId)}
          >
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Crear
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
