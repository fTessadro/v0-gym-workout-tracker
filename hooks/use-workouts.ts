'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  ExerciseDef,
  MuscleGroup,
  DayType,
  DAY_TYPES,
  resolveExerciseName,
  findExerciseDef,
  normalizeKey,
} from '@/lib/exercises'

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

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
  notes: string
  exercises: Exercise[]
}

export interface Template {
  id: string
  name: string
  exercises: { id: string; name: string }[]
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [customExercises, setCustomExercises] = useState<ExerciseDef[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [deviceId, setDeviceId] = useState<string>('')

  // Granular loading states
  const [isCreatingWorkout, setIsCreatingWorkout] = useState(false)
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null)
  const [duplicatingWorkoutId, setDuplicatingWorkoutId] = useState<string | null>(null)
  const [addingExerciseToWorkoutId, setAddingExerciseToWorkoutId] = useState<string | null>(null)
  const [deletingExerciseId, setDeletingExerciseId] = useState<string | null>(null)
  const [addingSetToExerciseId, setAddingSetToExerciseId] = useState<string | null>(null)
  const [deletingSetId, setDeletingSetId] = useState<string | null>(null)
  const [savingTemplateFromWorkoutId, setSavingTemplateFromWorkoutId] = useState<string | null>(null)
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null)

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

  // Fetch workouts and templates from Supabase
  useEffect(() => {
    if (!deviceId) return

    const fetchData = async () => {
      try {
        const [workoutsRes, templatesRes] = await Promise.all([
          supabase
            .from('workouts')
            .select(
              `
              id,
              name,
              notes,
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
            .order('created_at', { ascending: false }),
          supabase
            .from('templates')
            .select(
              `
              id,
              name,
              created_at,
              template_exercises (
                id,
                name
              )
            `
            )
            .eq('device_id', deviceId)
            .order('created_at', { ascending: false }),
        ])

        if (workoutsRes.error) throw workoutsRes.error
        if (templatesRes.error) throw templatesRes.error

        const formattedWorkouts = (workoutsRes.data || []).map((w: any) => ({
          id: w.id,
          name: w.name,
          date: w.created_at,
          notes: w.notes || '',
          exercises: (w.exercises || []).map((e: any) => ({
            id: e.id,
            name: e.name,
            sets: e.sets || [],
          })),
        }))

        const formattedTemplates: Template[] = (templatesRes.data || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          exercises: (t.template_exercises || []).map((e: any) => ({
            id: e.id,
            name: e.name,
          })),
        }))

        setWorkouts(formattedWorkouts)
        setTemplates(formattedTemplates)

        // Ejercicios propios: si la tabla aún no existe (migración 003 sin correr) no rompe la carga
        const customRes = await supabase
          .from('custom_exercises')
          .select('name, muscle_group, suggested_in')
          .eq('device_id', deviceId)
        if (customRes.error) {
          console.warn('No se pudieron cargar los ejercicios propios:', customRes.error.message)
        } else {
          setCustomExercises(
            (customRes.data || []).map((c: any) => ({
              name: c.name,
              muscle: c.muscle_group as MuscleGroup,
              suggestedIn: (c.suggested_in || []) as DayType[],
              custom: true,
            }))
          )
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('No se pudieron cargar los datos. Revisá tu conexión.')
      } finally {
        setIsLoaded(true)
      }
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId])

  const createWorkout = async (name: string) => {
    if (!deviceId) return
    setIsCreatingWorkout(true)
    try {
      const { data, error } = await supabase
        .from('workouts')
        .insert([{ name, device_id: deviceId, notes: '' }])
        .select()

      if (error) throw error

      const newWorkout: Workout = {
        id: data[0].id,
        name: data[0].name,
        date: data[0].created_at,
        notes: data[0].notes || '',
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

  const duplicateWorkout = async (id: string): Promise<Workout | undefined> => {
    setDuplicatingWorkoutId(id)
    try {
      const source = workouts.find((w) => w.id === id)
      if (!source) {
        toast.error('No se encontró el entrenamiento a duplicar.')
        return
      }

      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert([{ name: `${source.name} (copia)`, device_id: deviceId, notes: '' }])
        .select()

      if (workoutError) throw workoutError
      const newWorkoutId = workoutData[0].id

      if (source.exercises.length > 0) {
        const exercisesToInsert = source.exercises.map((ex) => ({
          name: ex.name,
          workout_id: newWorkoutId,
        }))
        const { error: exercisesError } = await supabase
          .from('exercises')
          .insert(exercisesToInsert)

        if (exercisesError) throw exercisesError
      }

      const newWorkout: Workout = {
        id: newWorkoutId,
        name: workoutData[0].name,
        date: workoutData[0].created_at,
        notes: '',
        exercises: source.exercises.map((ex) => ({ id: crypto.randomUUID(), name: ex.name, sets: [] })),
      }

      setWorkouts([newWorkout, ...workouts])
      toast.success(`Entrenamiento "${source.name}" duplicado.`)
      return newWorkout
    } catch (error) {
      console.error('Error duplicating workout:', error)
      toast.error('No se pudo duplicar el entrenamiento. Intentá de nuevo.')
      return
    } finally {
      setDuplicatingWorkoutId(null)
    }
  }

  const addExercise = async (
    workoutId: string,
    exerciseName: string
  ): Promise<Exercise | undefined> => {
    setAddingExerciseToWorkoutId(workoutId)
    try {
      // Unifica el nombre: catálogo/alias, ejercicio propio o el que ya usaste (ignora tildes y mayúsculas)
      exerciseName = resolveExerciseName(exerciseName, customExercises, workouts)
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

  const createCustomExercise = async (
    name: string,
    muscle: MuscleGroup,
    suggestedIn: DayType[]
  ): Promise<ExerciseDef> => {
    const def: ExerciseDef = { name: name.trim(), muscle, suggestedIn, custom: true }
    // Se muestra enseguida; si falla el guardado queda solo en esta sesión
    setCustomExercises((prev) => [def, ...prev])
    try {
      const { error } = await supabase.from('custom_exercises').insert([
        { device_id: deviceId, name: def.name, muscle_group: muscle, suggested_in: suggestedIn },
      ])
      if (error) throw error
    } catch (error) {
      console.error('Error saving custom exercise:', error)
      toast.error('No se pudo guardar el ejercicio propio. ¿Corriste la migración 003 en Supabase?')
    }
    return def
  }

  /**
   * Renombra todas las escrituras `fromNames` a `toName` en tus entrenamientos,
   * plantillas y ejercicios propios. Si `toName` ya existe, equivale a fusionarlos.
   */
  const renameExercise = async (fromNames: string[], toName: string): Promise<boolean> => {
    const target = resolveExerciseName(toName, customExercises, workouts)
    if (!target) return false
    const from = new Set(fromNames.filter((n) => n !== target))
    if (from.size === 0) return true
    const fromList = Array.from(from)

    try {
      const workoutIds = workouts
        .filter((w) => w.exercises.some((e) => from.has(e.name)))
        .map((w) => w.id)
      for (const ids of chunk(workoutIds, 40)) {
        const { error } = await supabase
          .from('exercises')
          .update({ name: target })
          .in('workout_id', ids)
          .in('name', fromList)
        if (error) throw error
      }

      const templateIds = templates
        .filter((t) => t.exercises.some((e) => from.has(e.name)))
        .map((t) => t.id)
      for (const ids of chunk(templateIds, 40)) {
        const { error } = await supabase
          .from('template_exercises')
          .update({ name: target })
          .in('template_id', ids)
          .in('name', fromList)
        if (error) throw error
      }

      // Ejercicios propios: si el destino ya existe se descartan, si no se renombran
      const customFrom = customExercises.filter((c) => from.has(c.name))
      if (customFrom.length > 0) {
        const others = customExercises.filter((c) => !from.has(c.name))
        const targetExists = !!findExerciseDef(target, others)
        if (targetExists) {
          const { error } = await supabase
            .from('custom_exercises')
            .delete()
            .eq('device_id', deviceId)
            .in('name', customFrom.map((c) => c.name))
          if (error) throw error
        } else {
          const { error: delError } = await supabase
            .from('custom_exercises')
            .delete()
            .eq('device_id', deviceId)
            .in('name', customFrom.map((c) => c.name))
          if (delError) throw delError
          const keep = customFrom[0]
          const { error } = await supabase.from('custom_exercises').insert([
            {
              device_id: deviceId,
              name: target,
              muscle_group: keep.muscle,
              suggested_in: keep.suggestedIn,
            },
          ])
          if (error) throw error
        }
        setCustomExercises((prev) => {
          const rest = prev.filter((c) => !from.has(c.name))
          if (targetExists) return rest
          const keep = prev.find((c) => from.has(c.name))
          return keep ? [{ ...keep, name: target }, ...rest] : rest
        })
      }

      const rename = <T extends { name: string }>(e: T): T => (from.has(e.name) ? { ...e, name: target } : e)
      setWorkouts((prev) => prev.map((w) => ({ ...w, exercises: w.exercises.map(rename) })))
      setTemplates((prev) => prev.map((t) => ({ ...t, exercises: t.exercises.map(rename) })))
      toast.success(`Ejercicios unificados como "${target}".`)
      return true
    } catch (error) {
      console.error('Error renaming exercise:', error)
      toast.error('No se pudo completar el cambio. Recargá la página para ver el estado real.')
      return false
    }
  }

  /** Asigna (o cambia) el músculo de un ejercicio propio o sin clasificar. */
  const setExerciseMuscle = async (name: string, muscle: MuscleGroup): Promise<boolean> => {
    const key = normalizeKey(name)
    const existing = customExercises.find((c) => normalizeKey(c.name) === key)
    const dayTypes = (muscle !== 'otros' ? [muscle] : []) as DayType[]
    const suggestedIn = Array.from(
      new Set<DayType>([...dayTypes, ...(existing?.suggestedIn || []).filter((t) => DAY_TYPES.includes(t))])
    )
    try {
      if (existing) {
        const { error } = await supabase
          .from('custom_exercises')
          .update({ muscle_group: muscle, suggested_in: suggestedIn })
          .eq('device_id', deviceId)
          .eq('name', existing.name)
        if (error) throw error
      } else {
        const { error } = await supabase.from('custom_exercises').insert([
          { device_id: deviceId, name: name.trim(), muscle_group: muscle, suggested_in: suggestedIn },
        ])
        if (error) throw error
      }
      setCustomExercises((prev) => {
        const def: ExerciseDef = { name: existing?.name ?? name.trim(), muscle, suggestedIn, custom: true }
        return existing
          ? prev.map((c) => (normalizeKey(c.name) === key ? def : c))
          : [def, ...prev]
      })
      return true
    } catch (error) {
      console.error('Error setting muscle:', error)
      toast.error('No se pudo guardar el músculo.')
      return false
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

  const updateWorkoutNotes = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .update({ notes })
        .eq('id', id)

      if (error) throw error

      setWorkouts(workouts.map((w) => (w.id === id ? { ...w, notes } : w)))
    } catch (error) {
      console.error('Error updating notes:', error)
      toast.error('No se pudieron guardar las notas.')
    }
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

  const saveAsTemplate = async (workoutId: string, templateName?: string): Promise<Template | undefined> => {
    setSavingTemplateFromWorkoutId(workoutId)
    try {
      const source = workouts.find((w) => w.id === workoutId)
      if (!source) {
        toast.error('No se encontró el entrenamiento.')
        return
      }
      if (source.exercises.length === 0) {
        toast.error('El entrenamiento no tiene ejercicios para guardar como plantilla.')
        return
      }

      const name = (templateName || source.name).trim()
      const { data: templateData, error: templateError } = await supabase
        .from('templates')
        .insert([{ name, device_id: deviceId }])
        .select()

      if (templateError) throw templateError
      const templateId = templateData[0].id

      const exercisesToInsert = source.exercises.map((ex) => ({
        name: ex.name,
        template_id: templateId,
      }))
      const { error: exError } = await supabase
        .from('template_exercises')
        .insert(exercisesToInsert)

      if (exError) throw exError

      const newTemplate: Template = {
        id: templateId,
        name,
        exercises: source.exercises.map((ex) => ({ id: crypto.randomUUID(), name: ex.name })),
      }

      setTemplates([newTemplate, ...templates])
      toast.success(`Plantilla "${name}" guardada.`)
      return newTemplate
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('No se pudo guardar la plantilla. Intentá de nuevo.')
      return
    } finally {
      setSavingTemplateFromWorkoutId(null)
    }
  }

  const deleteTemplate = async (id: string) => {
    setDeletingTemplateId(id)
    try {
      const { error } = await supabase.from('templates').delete().eq('id', id)
      if (error) throw error

      setTemplates(templates.filter((t) => t.id !== id))
      toast.success('Plantilla eliminada.')
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('No se pudo eliminar la plantilla.')
    } finally {
      setDeletingTemplateId(null)
    }
  }

  const createWorkoutFromTemplate = async (templateId: string): Promise<Workout | undefined> => {
    setIsCreatingWorkout(true)
    try {
      const template = templates.find((t) => t.id === templateId)
      if (!template) {
        toast.error('Plantilla no encontrada.')
        return
      }

      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert([{ name: template.name, device_id: deviceId, notes: '' }])
        .select()

      if (workoutError) throw workoutError
      const newWorkoutId = workoutData[0].id

      if (template.exercises.length > 0) {
        const exercisesToInsert = template.exercises.map((ex) => ({
          name: ex.name,
          workout_id: newWorkoutId,
        }))
        const { error: exError } = await supabase
          .from('exercises')
          .insert(exercisesToInsert)
        if (exError) throw exError
      }

      const newWorkout: Workout = {
        id: newWorkoutId,
        name: workoutData[0].name,
        date: workoutData[0].created_at,
        notes: workoutData[0].notes || '',
        exercises: template.exercises.map((ex) => ({ id: crypto.randomUUID(), name: ex.name, sets: [] })),
      }

      setWorkouts([newWorkout, ...workouts])
      toast.success(`Entrenamiento "${template.name}" creado desde plantilla.`)
      return newWorkout
    } catch (error) {
      console.error('Error creating workout from template:', error)
      toast.error('No se pudo crear el entrenamiento desde la plantilla.')
      return
    } finally {
      setIsCreatingWorkout(false)
    }
  }

  return {
    workouts,
    templates,
    customExercises,
    createCustomExercise,
    renameExercise,
    setExerciseMuscle,
    isLoaded,
    createWorkout,
    deleteWorkout,
    duplicateWorkout,
    addExercise,
    deleteExercise,
    addSet,
    deleteSet,
    getWorkout,
    deviceId,
    updateDeviceId,
    updateWorkoutNotes,
    exportData,
    saveAsTemplate,
    deleteTemplate,
    createWorkoutFromTemplate,
    // Granular loading states
    isCreatingWorkout,
    deletingWorkoutId,
    duplicatingWorkoutId,
    addingExerciseToWorkoutId,
    deletingExerciseId,
    addingSetToExerciseId,
    deletingSetId,
    savingTemplateFromWorkoutId,
    deletingTemplateId,
  }
}
