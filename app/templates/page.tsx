'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkouts } from '@/hooks/use-workouts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Trash2, Loader2, BookMarked, Play, Calendar } from 'lucide-react'

export default function TemplatesPage() {
  const router = useRouter()
  const { templates, isLoaded, deleteTemplate, createWorkoutFromTemplate, deletingTemplateId, isCreatingWorkout } = useWorkouts()
  const [creatingFromId, setCreatingFromId] = useState<string | null>(null)

  const sortedTemplates = useMemo(() => {
    return [...templates]
  }, [templates])

  const handleUse = async (templateId: string) => {
    setCreatingFromId(templateId)
    try {
      const result = await createWorkoutFromTemplate(templateId)
      if (result?.id) {
        router.push(`/workout/${result.id}`)
      }
    } finally {
      setCreatingFromId(null)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando plantillas...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 pt-6 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Plantillas</h1>
            <p className="text-sm text-muted-foreground">
              Rutinas guardadas para reutilizar
            </p>
          </div>
        </div>

        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <BookMarked className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Aún no tenés plantillas guardadas.
            </p>
            <p className="text-sm text-muted-foreground">
              Desde un entrenamiento, tocá el botón "Plantilla" para guardarlo.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTemplates.map((template) => {
              const isDeleting = deletingTemplateId === template.id
              const isCreating = creatingFromId === template.id || isCreatingWorkout
              return (
                <Card key={template.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{template.name}</h3>
                      <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          {template.exercises.length} ejercicios
                        </span>
                      </div>
                    </div>
                  </div>

                  {template.exercises.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.exercises.slice(0, 4).map((ex) => (
                        <span
                          key={ex.id}
                          className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md"
                        >
                          {ex.name}
                        </span>
                      ))}
                      {template.exercises.length > 4 && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md">
                          +{template.exercises.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 border-t pt-3">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleUse(template.id)}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Calendar className="w-4 h-4 mr-1" />
                      )}
                      Usar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`¿Eliminar la plantilla "${template.name}"?`)) {
                          deleteTemplate(template.id)
                        }
                      }}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-1" />
                      )}
                      Eliminar
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
