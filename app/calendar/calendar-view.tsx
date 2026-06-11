'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useWorkouts } from '@/hooks/use-workouts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { ArrowLeft, CalendarDays } from 'lucide-react'

export default function CalendarView() {
  const router = useRouter()
  const { workouts, isLoaded } = useWorkouts()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const toDateKey = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, typeof workouts>()
    workouts.forEach((w) => {
      const key = toDateKey(new Date(w.date))
      const list = map.get(key) || []
      list.push(w)
      map.set(key, list)
    })
    return map
  }, [workouts])

  const workoutDates = useMemo(() => {
    return Array.from(workoutsByDate.keys()).map((key) => new Date(key + 'T00:00:00'))
  }, [workoutsByDate])

  const selectedWorkouts = useMemo(() => {
    if (!selectedDate) return []
    return workoutsByDate.get(toDateKey(selectedDate)) || []
  }, [selectedDate, workoutsByDate])

  const modifiers = useMemo(
    () => ({
      hasWorkout: workoutDates,
    }),
    [workoutDates]
  )

  const modifiersClassNames = {
    hasWorkout: 'relative after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary',
  }

  const totalWorkouts = workouts.length
  const totalDays = workoutDates.length
  const currentMonth = new Date()

  const monthWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      const d = new Date(w.date)
      return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()
    }).length
  }, [workouts])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando calendario...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 pt-6 pb-20">
        {/* Header */}
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
            <h1 className="text-2xl font-bold">Calendario</h1>
            <p className="text-sm text-muted-foreground">Tu historial de entrenamientos</p>
          </div>
        </div>

        {workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <CalendarDays className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">
              Aún no tienes entrenamientos registrados.
            </p>
            <p className="text-sm text-muted-foreground">
              Crea tu primer entrenamiento para verlo aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 text-center">
                <p className="text-2xl font-bold">{totalWorkouts}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-2xl font-bold">{totalDays}</p>
                <p className="text-xs text-muted-foreground">Días</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="text-2xl font-bold">{monthWorkouts}</p>
                <p className="text-xs text-muted-foreground">Este mes</p>
              </Card>
            </div>

            {/* Calendar */}
            <Card className="p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                className="w-full"
              />
            </Card>

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              <span>Día con entrenamiento</span>
            </div>

            {/* Selected day workouts */}
            {selectedDate && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold capitalize">
                    {formatDate(selectedDate)}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {selectedWorkouts.length}{' '}
                    {selectedWorkouts.length === 1 ? 'entrenamiento' : 'entrenamientos'}
                  </span>
                </div>

                {selectedWorkouts.length === 0 ? (
                  <Card className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      No hay entrenamientos este día.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {selectedWorkouts.map((workout) => {
                      const totalSets = workout.exercises.reduce(
                        (acc, ex) => acc + ex.sets.length,
                        0
                      )
                      return (
                        <Link
                          key={workout.id}
                          href={`/workout/${workout.id}`}
                          className="block"
                        >
                          <Card className="p-4 hover:bg-accent transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold">{workout.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatTime(workout.date)} hs
                                </p>
                                <div className="flex gap-3 text-xs mt-2 text-foreground">
                                  <span>
                                    <span className="font-medium">
                                      {workout.exercises.length}
                                    </span>{' '}
                                    ejercicios
                                  </span>
                                  <span>
                                    <span className="font-medium">{totalSets}</span>{' '}
                                    series
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {!selectedDate && (
              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Tocá un día con punto para ver los entrenamientos.
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
