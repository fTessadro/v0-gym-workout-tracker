'use client'

import { useState, useEffect, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { StickyNote, Loader2, Check } from 'lucide-react'

interface WorkoutNotesProps {
  notes: string
  onSave: (notes: string) => Promise<void> | void
}

export function WorkoutNotes({ notes, onSave }: WorkoutNotesProps) {
  const [value, setValue] = useState(notes)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef(notes)

  useEffect(() => {
    setValue(notes)
    lastSavedRef.current = notes
  }, [notes])

  const handleChange = (next: string) => {
    setValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (next === lastSavedRef.current) {
      setStatus('idle')
      return
    }
    setStatus('saving')
    debounceRef.current = setTimeout(async () => {
      await onSave(next)
      lastSavedRef.current = next
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1500)
    }, 800)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Notas de la sesión</h3>
        </div>
        <div className="text-xs text-muted-foreground h-4 flex items-center gap-1">
          {status === 'saving' && (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Guardando...</span>
            </>
          )}
          {status === 'saved' && (
            <>
              <Check className="w-3 h-3 text-green-500" />
              <span>Guardado</span>
            </>
          )}
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Cómo te sentiste, peso corporal, recordatorios, próximos objetivos..."
        rows={3}
        className="resize-none text-sm"
      />
    </Card>
  )
}
