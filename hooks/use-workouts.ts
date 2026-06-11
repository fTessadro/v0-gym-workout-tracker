'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export interface Set {
  id: string
  reps: number
  weight: number
}

export interface Exercise {
  id: string
  name: string
  sets: Set[]
}

export interface Workout {
  id: string
  name: string
  date: string
  exercises: Exercise[]
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [deviceId, setDeviceId] = useState<string>('')

  // Granular loading states
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false)
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null)
  const [addingExerciseToWorkoutId, setAddingExerciseToWorkoutId] = useState<string | null>(null)
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null)
  const [addingSetToExerciseId, setAddingSetToExerciseId] = useState<string | null>(null)
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null)

  const supabase = createClient()

  // Initialize device ID from localStorage
  useEffect(() => {
    let id = localStorage.getItem('device-id')
    if (!id) {
      id = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('device-id', id)
    }
    setDeviceId(id)
  }, [])

  // Fetch workouts from Supabase
  useEffect(() => {
    if (!deviceId) return

    const fetchWorkouts = async () => {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select(
            `
            id,
            name,
            created_at,
            exercises (
              id,
              name,
              sets (
                id,
                reps,
                weight
              )
            )
          `
          )
          .eq('device_id', deviceId)
          .order('created_at', { ascending: false })

        if (error) throw error

        const formattedWorkouts = (data || []).map((w: any) => ({
          id: w.id,
          name: w.name,
          date: w.created_at,
          exercises: (w.exercises || []).map((e: any) => ({
            id: e.id,
            name: e.name,
            sets: e.sets || [],
          })),
        }))

        setWorkouts(formattedWorkouts)
      } catch (error) {
        console.error('Error fetching workouts:', error)
        toast.error('No se pudieron cargar los entrenamientos. Revisá tu conexión.')
      } finally {
        setIsLoaded(true)
      }
    }

    fetchWorkouts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId])

  const createWorkout = async (name: string) => {
    if (!deviceId) return
    setIsCreatingWorkout(true)
    try {
      const { data, error } = await supabase
        .from('workouts')
        .insert([{ name, device_id: deviceId }])
        .select()

      if (error) throw error

      const newWorkout: Workout = {
        id: data[0].id,
        name: data[0].name,
        date: data[0].created_at,
        exercises: [],
      }

      setWorkouts([newWorkout, ...workouts])
      toast.success(`¡Entrenamiento "${name}" creado!`)
      return newWorkout
    } catch (error) {
      console.error('Error creating workout:', error)
      toast.error('No se pudo crear el entrenamiento. Intentá de nuevo.')
    } finally {
      setIsCreatingWorkout(false)
    }
  }

  const deleteWorkout = async (id: string) => {
    setDeletingWorkoutId(id)
    try {
      const { error } = await supabase.from('workouts').delete().eq('id', id)

      if (error) throw error

      setWorkouts(workouts.filter((w) => w.id !== id))
      toast.success('Entrenamiento eliminado.')
    } catch (error) {
      console.error('Error deleting workout:', error)
      toast.error('No se pudo eliminar el entrenamiento. Intentá de nuevo.')
    } finally {
      setDeletingWorkoutId(null)
    }
  }

  const addExercise = async (
    workoutId: string,
    exerciseName: string
  ): Promise<Exercise | undefined> => {
    setAddingExerciseToWorkoutId(workoutId)
    try {
      const { data, error } = await supabase
        .from('exercises')
        .insert([{ name: exerciseName, workout_id: workoutId }])
        .select()

      if (error) throw error

      const newExercise: Exercise = {
        id: data[0].id,
        name: data[0].name,
        sets: [],
      }

      setWorkouts(
        workouts.map((w) =>
          w.id === workoutId
            ? { ...w, exercises: [...w.exercises, newExercise] }
            : w
        )
      )
      toast.success(`Ejercicio "${exerciseName}" agregado.`)
      return newExercise
    } catch (error) {
      console.error('Error adding exercise:', error)
      toast.error('No se pudo agregar el ejercicio. Intentá de nuevo.')
    } finally {
      setAddingExerciseToWorkoutId(null)
    }
  }

  const deleteExercise = async (workoutId: string, exerciseId: string) => {
    setDeletingExerciseId(exerciseId)
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId)

      if (error) throw error

      setWorkouts(
        workouts.map((w) =>
          w.id === workoutId
            ? {
              ...w,
              exercises: w.exercises.filter((e) => e.id !== exerciseId),
            }
            : w
        )
      )
    } catch (error) {
      console.error('Error deleting exercise:', error)
      toast.error('No se pudo eliminar el ejercicio. Intentá de nuevo.')
    } finally {
      setDeletingExerciseId(null)
    }
  }

  const addSet = async (
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number
  ) => {
    setAddingSetToExerciseId(exerciseId)
    try {
      const { data, error } = await supabase
        .from('sets')
        .insert([{ reps, weight, exercise_id: exerciseId }])
        .select()

      if (error) throw error

      const newSet: Set = {
        id: data[0].id,
        reps: data[0].reps,
        weight: data[0].weight,
      }

      setWorkouts(
        workouts.map((w) =>
          w.id === workoutId
            ? {
              ...w,
              exercises: w.exercises.map((e) =>
                e.id === exerciseId
                  ? { ...e, sets: [...e.sets, newSet] }
                  : e
              ),
            }
            : w
        )
      )
    } catch (error) {
      console.error('Error adding set:', error)
      toast.error('No se pudo guardar la serie. Intentá de nuevo.')
    } finally {
      setAddingSetToExerciseId(null)
    }
  }

  const deleteSet = async (
    workoutId: string,
    exerciseId: string,
    setId: string
  ) => {
    setDeletingSetId(setId)
    try {
      const { error } = await supabase.from('sets').delete().eq('id', setId)

      if (error) throw error

      setWorkouts(
        workouts.map((w) =>
          w.id === workoutId
            ? {
              ...w,
              exercises: w.exercises.map((e) =>
                e.id === exerciseId
                  ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
                  : e
              ),
            }
            : w
        )
      )
    } catch (error) {
      console.error('Error deleting set:', error)
      toast.error('No se pudo eliminar la serie. Intentá de nuevo.')
    } finally {
      setDeletingSetId(null)
    }
  }

  const getWorkout = (id: string) => {
    return workouts.find((w) => w.id === id)
  }

  const updateDeviceId = (newId: string) => {
    if (!newId.trim()) return
    localStorage.setItem('device-id', newId.trim())
    setDeviceId(newId.trim())
    setIsLoaded(false)
  }

  const exportData = () => {
    if (workouts.length === 0) {
      toast.error('No hay entrenamientos para exportar.')
      return
    }
    const dataStr = JSON.stringify(workouts, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `entrenamientos-backup-${new Date().toISOString().split('T')[0]}.json`
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    toast.success('Backup exportado correctamente.')
  }

  return {
    workouts,
    isLoaded,
    createWorkout,
    deleteWorkout,
    addExercise,
    deleteExercise,
    addSet,
    deleteSet,
    getWorkout,
    deviceId,
    updateDeviceId,
    exportData,
    // Granular loading states
    isCreatingWorkout,
    deletingWorkoutId,
    addingExerciseToWorkoutId,
    deletingExerciseId,
    addingSetToExerciseId,
    deletingSetId,
  }
}
