'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkouts } from '@/hooks/use-workouts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Trophy, TrendingUp, Activity } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getPRs, calcWorkoutVolume, calc1RM, getVolumeByMuscle, filterWorkoutsByRange } from '@/lib/analytics'
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_COLORS, MuscleGroup } from '@/lib/exercises'
import { PieChart, Pie, Cell } from 'recharts'

export default function StatsPage() {
  const router = useRouter()
  const { workouts, isLoaded } = useWorkouts()
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [muscleRange, setMuscleRange] = useState<'all' | 'month' | 'week'>('month')

  const uniqueExercises = useMemo(() => {
    const exercises = new Set<string>()
    workouts.forEach((w) => {
      w.exercises.forEach((e) => {
        const trimmedName = e.name.trim().toLowerCase()
        if (trimmedName) exercises.add(trimmedName)
      })
    })
    return Array.from(exercises).sort()
  }, [workouts])

  const chartData = useMemo(() => {
    if (!selectedExercise) return []
    const data: { date: string; time: number; weight: number; oneRM: number }[] = []
    const sortedWorkouts = [...workouts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    sortedWorkouts.forEach((w) => {
      const exercise = w.exercises.find(
        (e) => e.name.trim().toLowerCase() === selectedExercise
      )
      if (exercise && exercise.sets.length > 0) {
        const maxWeight = Math.max(...exercise.sets.map((s) => s.weight))
        const best1RM = Math.max(...exercise.sets.map((s) => calc1RM(s.weight, s.reps)))
        const d = new Date(w.date)
        const dateStr = d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
        data.push({ date: dateStr, time: d.getTime(), weight: maxWeight, oneRM: best1RM })
      }
    })
    return data
  }, [workouts, selectedExercise])

  const prs = useMemo(() => getPRs(workouts), [workouts])

  const totals = useMemo(() => {
    const totalVolume = workouts.reduce((acc, w) => acc + calcWorkoutVolume(w), 0)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthVolume = workouts
      .filter((w) => new Date(w.date) >= monthStart)
      .reduce((acc, w) => acc + calcWorkoutVolume(w), 0)
    return {
      totalVolume: Math.round(totalVolume),
      monthVolume: Math.round(monthVolume),
      totalPRs: prs.length,
    }
  }, [workouts, prs])

  const volumeByMuscle = useMemo(() => {
    const filtered = filterWorkoutsByRange(workouts, muscleRange)
    return getVolumeByMuscle(filtered)
  }, [workouts, muscleRange])

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
            {/* Tarjetas resumen */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3 text-center">
                <Activity className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{totals.totalVolume}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Vol. total (kg)</p>
              </Card>
              <Card className="p-3 text-center">
                <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-lg font-bold">{totals.monthVolume}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Este mes (kg)</p>
              </Card>
              <Card className="p-3 text-center">
                <Trophy className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                <p className="text-lg font-bold">{totals.totalPRs}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">PRs totales</p>
              </Card>
            </div>

            {/* Selector de ejercicio + chart */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Progreso por ejercicio:</label>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige un ejercicio" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueExercises.map((ex) => (
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
                  {selectedExercise}
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
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'var(--background)',
                          }}
                          formatter={(value: number, name: string) => [
                            `${Math.round(value)} kg`,
                            name === 'weight' ? 'Peso máx' : '1RM est.',
                          ]}
                          labelStyle={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: 12 }}
                          formatter={(v) => (v === 'weight' ? 'Peso máx' : '1RM estimado')}
                        />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="var(--chart-1)"
                          strokeWidth={3}
                          dot={{ r: 4, fill: 'var(--chart-1)', strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="oneRM"
                          stroke="var(--chart-2)"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 3, fill: 'var(--chart-2)', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Récords personales */}
            {prs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Récords personales
                </h3>
                <Card className="divide-y">
                  {prs.map((pr) => (
                    <div key={pr.exerciseName} className="p-3 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium capitalize truncate text-sm">{pr.exerciseName}</p>
                        <p className="text-xs text-muted-foreground">
                          {pr.totalSessions} sesiones
                        </p>
                      </div>
                      <div className="text-right text-xs shrink-0">
                        <p>
                          <span className="font-semibold">{pr.maxWeight}kg</span>
                          <span className="text-muted-foreground"> × {pr.maxWeightReps}</span>
                        </p>
                        <p className="text-muted-foreground">
                          1RM est. {Math.round(pr.best1RM)}kg
                        </p>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* Volumen por grupo muscular */}
            {volumeByMuscle.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Volumen por grupo muscular</h3>
                  <Select value={muscleRange} onValueChange={(v) => setMuscleRange(v as 'all' | 'month' | 'week')}>
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">7 días</SelectItem>
                      <SelectItem value="month">30 días</SelectItem>
                      <SelectItem value="all">Total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Card className="p-4">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={volumeByMuscle}
                          dataKey="volume"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                        >
                          {volumeByMuscle.map((entry) => (
                            <Cell
                              key={entry.group}
                              fill={MUSCLE_GROUP_COLORS[entry.group as MuscleGroup]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'var(--background)',
                          }}
                          formatter={(value: number) => [`${Math.round(value)} kg`, 'Volumen']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-3">
                    {volumeByMuscle.map((entry) => (
                      <div key={entry.group} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: MUSCLE_GROUP_COLORS[entry.group as MuscleGroup] }}
                        />
                        <span className="truncate">
                          {entry.label} ({Math.round(entry.percentage)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
