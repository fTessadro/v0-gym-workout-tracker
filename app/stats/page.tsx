'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkouts } from '@/hooks/use-workouts'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function StatsPage() {
  const router = useRouter()
  const { workouts, isLoaded } = useWorkouts()
  const [selectedExercise, setSelectedExercise] = useState<string>('')

  // Get unique exercise names from all workouts
  const uniqueExercises = useMemo(() => {
    const exercises = new Set<string>()
    workouts.forEach(w => {
      w.exercises.forEach(e => {
        if (e.name.trim()) exercises.add(e.name.toLowerCase())
      })
    })
    return Array.from(exercises).sort()
  }, [workouts])

  // Compute chart data for selected exercise
  const chartData = useMemo(() => {
    if (!selectedExercise) return []

    const data: { date: string; time: number; weight: number }[] = []

    // Workouts are sorted descending by date, but for a chart we want chronological order
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    sortedWorkouts.forEach(w => {
      const exercise = w.exercises.find(e => e.name.toLowerCase() === selectedExercise)
      if (exercise && exercise.sets.length > 0) {
        // Find max weight in this session
        const maxWeight = Math.max(...exercise.sets.map(s => s.weight))
        
        // Format date for X-axis
        const d = new Date(w.date)
        const dateStr = d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })

        data.push({
          date: dateStr,
          time: d.getTime(),
          weight: maxWeight
        })
      }
    })

    return data
  }, [workouts, selectedExercise])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando estadísticas...</p>
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
            <h1 className="text-2xl font-bold">Progreso</h1>
          </div>
        </div>

        {uniqueExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Aún no tienes ejercicios registrados.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecciona un ejercicio:</label>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige un ejercicio" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueExercises.map(ex => (
                    <SelectItem key={ex} value={ex} className="capitalize">
                      {ex}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedExercise && (
              <div className="bg-card border rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold mb-4 text-center capitalize">
                  Peso Máximo: {selectedExercise}
                </h3>
                
                {chartData.length < 2 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Necesitas al menos 2 sesiones de este ejercicio para ver el progreso.
                  </p>
                ) : (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          formatter={(value: number) => [`${value} kg`, 'Peso']}
                          labelStyle={{ fontWeight: 'bold', color: '#000', textTransform: 'capitalize' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
