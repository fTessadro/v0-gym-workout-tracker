'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
      } finally {
        setIsLoaded(true)
      }
    }

    fetchWorkouts()
  }, [deviceId, supabase])

  const createWorkout = async (name: string) => {
    if (!deviceId) return

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
      return newWorkout
    } catch (error) {
      console.error('Error creating workout:', error)
    }
  }

  const deleteWorkout = async (id: string) => {
    try {
      const { error } = await supabase.from('workouts').delete().eq('id', id)

      if (error) throw error

      setWorkouts(workouts.filter((w) => w.id !== id))
    } catch (error) {
      console.error('Error deleting workout:', error)
    }
  }

  const addExercise = async (
    workoutId: string,
    exerciseName: string
  ): Promise<Exercise | undefined> => {
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
      return newExercise
    } catch (error) {
      console.error('Error adding exercise:', error)
    }
  }

  const deleteExercise = async (workoutId: string, exerciseId: string) => {
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
    }
  }

  const addSet = async (
    workoutId: string,
    exerciseId: string,
    reps: number,
    weight: number
  ) => {
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
    }
  }

  const deleteSet = async (
    workoutId: string,
    exerciseId: string,
    setId: string
  ) => {
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
    }
  }

  const getWorkout = (id: string) => {
    return workouts.find((w) => w.id === id)
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
  }
}
