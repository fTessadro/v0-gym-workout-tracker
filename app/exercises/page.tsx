'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkouts } from '@/hooks/use-workouts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Pencil, Loader2, Merge, Search } from 'lucide-react'
import {
  ExerciseSummary,
  MuscleGroup,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  areSimilarNames,
  normalizeKey,
  summarizeExercises,
} from '@/lib/exercises'

export default function ExercisesPage() {
  const router = useRouter()
  const { workouts, templates, customExercises, isLoaded, renameExercise, setExerciseMuscle } = useWorkouts()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ExerciseSummary | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const summaries = useMemo(
    () => summarizeExercises(workouts, templates, customExercises),
    [workouts, templates, customExercises]
  )

  // Mismo ejercicio escrito de varias formas ("Remo maquina" / "Remo Máquina")
  const multiSpelling = summaries.filter((s) => s.variants.length > 1)

  // Nombres distintos pero parecidos: puede ser el mismo ejercicio
  const similarPairs = useMemo(() => {
    const pairs: [ExerciseSummary, ExerciseSummary][] = []
    for (let i = 0; i < summaries.length; i++) {
      for (let j = i + 1; j < summaries.length; j++) {
        const a = summaries[i]
        const b = summaries[j]
        if (a.isCatalog && b.isCatalog) continue
        if (dismissed.has(`${a.key}|${b.key}`)) continue
        if (areSimilarNames(a.name, b.name)) pairs.push([a, b])
      }
    }
    return pairs.slice(0, 8)
  }, [summaries, dismissed])

  const filtered = useMemo(() => {
    const q = normalizeKey(search)
    return q ? summaries.filter((s) => s.key.includes(q)) : summaries
  }, [summaries, search])

  const unify = async (s: ExerciseSummary, target: string) => {
    setBusyKey(s.key)
    await renameExercise(s.variants, target)
    setBusyKey(null)
  }

  const merge = async (from: ExerciseSummary, into: ExerciseSummary) => {
    setBusyKey(from.key)
    await renameExercise(from.variants, into.name)
    setBusyKey(null)
  }

  const changeMuscle = async (s: ExerciseSummary, muscle: MuscleGroup) => {
    setBusyKey(s.key)
    await setExerciseMuscle(s.name, muscle)
    setBusyKey(null)
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando ejercicios...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 pt-6 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Mis ejercicios</h1>
            <p className="text-sm text-muted-foreground">Unificá nombres y asigná el músculo</p>
          </div>
        </div>

        {summaries.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Todavía no usaste ningún ejercicio.</p>
        ) : (
          <div className="space-y-6">
            {multiSpelling.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold">Escritos de varias formas</h2>
                {multiSpelling.map((s) => (
                  <Card key={s.key} className="p-3 space-y-2">
                    <p className="text-sm">
                      {s.variants.map((v) => `"${v}"`).join(', ')}
                    </p>
                    <Button
                      size="sm"
                      className="w-full"
                      disabled={busyKey === s.key}
                      onClick={() => unify(s, s.name)}
                    >
                      {busyKey === s.key ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Merge className="w-4 h-4 mr-2" />}
                      Unificar como "{s.name}"
                    </Button>
                  </Card>
                ))}
              </section>
            )}

            {similarPairs.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold">¿Son el mismo ejercicio?</h2>
                {similarPairs.map(([a, b]) => {
                  const busy = busyKey === a.key || busyKey === b.key
                  return (
                    <Card key={`${a.key}|${b.key}`} className="p-3 space-y-2">
                      <p className="text-sm">
                        "{a.name}" <span className="text-muted-foreground">y</span> "{b.name}"
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => merge(b, a)}>
                          Unir en "{a.name}"
                        </Button>
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => merge(a, b)}>
                          Unir en "{b.name}"
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={() => setDismissed((d) => new Set(d).add(`${a.key}|${b.key}`))}
                      >
                        No, son distintos
                      </Button>
                    </Card>
                  )
                })}
              </section>
            )}

            <section className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar ejercicio..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Card className="divide-y">
                {filtered.map((s) => (
                  <div key={s.key} className="p-3 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.sessions} {s.sessions === 1 ? 'sesión' : 'sesiones'}
                      </p>
                    </div>
                    {s.isCatalog ? (
                      <span className="text-xs text-muted-foreground">{MUSCLE_GROUP_LABELS[s.muscle]}</span>
                    ) : (
                      <Select
                        value={s.muscle}
                        onValueChange={(v) => changeMuscle(s, v as MuscleGroup)}
                        disabled={busyKey === s.key}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MUSCLE_GROUPS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m === 'otros' ? 'Sin clasificar' : MUSCLE_GROUP_LABELS[m]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      aria-label={`Renombrar ${s.name}`}
                      onClick={() => setEditing(s)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p className="p-4 text-sm text-center text-muted-foreground">Sin resultados.</p>
                )}
              </Card>
            </section>
          </div>
        )}
      </div>

      {editing && (
        <RenameDialog
          exercise={editing}
          others={summaries.filter((s) => s.key !== editing.key)}
          onClose={() => setEditing(null)}
          onSave={async (name) => {
            const ok = await renameExercise(editing.variants, name)
            if (ok) setEditing(null)
          }}
        />
      )}
    </main>
  )
}

function RenameDialog({
  exercise,
  others,
  onClose,
  onSave,
}: {
  exercise: ExerciseSummary
  others: ExerciseSummary[]
  onClose: () => void
  onSave: (name: string) => Promise<void>
}) {
  const [name, setName] = useState(exercise.name)
  const [saving, setSaving] = useState(false)
  const trimmed = name.trim()
  const key = normalizeKey(trimmed)
  const existing = others.find((o) => o.key === key)
  const unchanged = trimmed === exercise.name && exercise.variants.length === 1

  const save = async () => {
    setSaving(true)
    await onSave(trimmed)
    setSaving(false)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[90vw] max-w-sm">
        <DialogHeader>
          <DialogTitle>Renombrar ejercicio</DialogTitle>
          <DialogDescription>
            Se cambia en todos tus entrenamientos y plantillas. Si el nombre ya existe, se unen.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && trimmed && !unchanged && save()}
          autoFocus
        />
        {existing && (
          <p className="text-xs text-muted-foreground">
            Ya existe "{existing.name}" ({existing.sessions} {existing.sessions === 1 ? 'sesión' : 'sesiones'}): se van a unir.
          </p>
        )}
        <Button onClick={save} disabled={!trimmed || unchanged || saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {existing ? 'Unir' : 'Guardar'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
