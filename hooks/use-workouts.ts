'use client'

import { useState, useEffect } from 'react'

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

const STORAGE_KEY = 'gym-workouts'

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setWorkouts(JSON.parse(stored))
      } catch (error) {
        console.error('Error loading workouts:', error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever workouts change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
    }
  }, [workouts, isLoaded])

  const createWorkout = (name: string): Workout => {
    const newWorkout: Workout = {
      id: Date.now().toString(),
      name,
      date: new Date().toISOString(),
      exercises: [],
    }
    setWorkouts([newWorkout, ...workouts])
    return newWorkout
  }

  const deleteWorkout = (id: string) => {
    setWorkouts(workouts.filter((w) => w.id !== id))
  }

  const addExercise = (workoutId: string, exerciseName: string): Exercise => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: exerciseName,
      sets: [],
    }
    setWorkouts(
      workouts.map((w) =>
        w.id === workoutId ? { ...w, exercises: [...w.exercises, newExercise] } : w
      )
    )
    return newExercise
  }

  const deleteExercise = (workoutId: string, exerciseId: string) => {
    setWorkouts(
      workouts.map((w) =>
        w.id === workoutId
          ? { ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) }
          : w
      )
    )
  }

  const addSet = (workoutId: string, exerciseId: string, reps: number, weight: number) => {
    setWorkouts(
      workouts.map((w) =>
        w.id === workoutId
          ? {
              ...w,
              exercises: w.exercises.map((e) =>
                e.id === exerciseId
                  ? {
                      ...e,
                      sets: [
                        ...e.sets,
                        {
                          id: Date.now().toString(),
                          reps,
                          weight,
                        },
                      ],
                    }
                  : e
              ),
            }
          : w
      )
    )
  }

  const deleteSet = (workoutId: string, exerciseId: string, setId: string) => {
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
