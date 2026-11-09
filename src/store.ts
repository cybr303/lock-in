import { useSyncExternalStore } from 'react'
import type { AppState, Exercise, LoggedExercise, Routine, Workout, ActiveWorkout, SetEntry } from './types'
import { BUILTIN_EXERCISES } from './data/exercises'

const KEY = 'lockin:v1'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

const initial: AppState = {
  version: 1,
  profileName: 'Athlete',
  customExercises: [],
  routines: [],
  workouts: [],
  active: null,
  settings: { defaultRestSec: 120, weekStartsMonday: true },
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial
    const parsed = JSON.parse(raw) as Partial<AppState>
    return { ...initial, ...parsed, settings: { ...initial.settings, ...parsed.settings } }
  } catch {
    return initial
  }
}

let state: AppState = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked – keep in memory */
  }
}

export function setState(fn: (s: AppState) => AppState) {
  state = fn(state)
  persist()
  listeners.forEach((l) => l())
}

export function getState() {
  return state
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => selector(state),
  )
}

// ---------- Exercise lookup ----------

const builtinMap = new Map(BUILTIN_EXERCISES.map((e) => [e.id, e]))

export function allExercises(s: AppState = state): Exercise[] {
  return [...BUILTIN_EXERCISES, ...s.customExercises].sort((a, b) => a.name.localeCompare(b.name))
}

export function getExercise(id: string, s: AppState = state): Exercise {
  return (
    builtinMap.get(id) ??
    s.customExercises.find((e) => e.id === id) ?? {
      id,
      name: 'Unknown exercise',
      muscle: 'Other',
      equipment: 'Other',
      kind: 'weight',
    }
  )
}

// ---------- Helpers ----------

export const emptySet = (): SetEntry => ({ weight: null, reps: null, time: null, type: 'normal', done: false })

export function newLogged(exerciseId: string, restSec = state.settings.defaultRestSec): LoggedExercise {
  const prev = previousSets(exerciseId)
  const n = Math.max(prev.length, 3)
  return {
    exerciseId,
    restSec,
    notes: '',
    sets: Array.from({ length: n }, (_, i) => ({ ...emptySet(), type: prev[i]?.type ?? 'normal' })),
  }
}

/** The sets of the most recent completed workout that included this exercise. */
export function previousSets(exerciseId: string, s: AppState = state): SetEntry[] {
  for (const w of s.workouts) {
    const ex = w.exercises.find((x) => x.exerciseId === exerciseId)
    if (ex) return ex.sets.filter((st) => st.done)
  }
  return []
}

// ---------- Actions ----------

export const actions = {
  startWorkout(routine?: Routine) {
    const active: ActiveWorkout = {
      id: uid(),
      name: routine?.name ?? 'Workout',
      routineId: routine?.id,
      startedAt: Date.now(),
      exercises: routine
        ? structuredClone(routine.exercises).map((ex) => ({
            ...ex,
            sets: ex.sets.map((st) => ({ ...st, done: false })),
          }))
        : [],
    }
    setState((s) => ({ ...s, active }))
  },

  updateActive(fn: (a: ActiveWorkout) => ActiveWorkout) {
    setState((s) => (s.active ? { ...s, active: fn(s.active) } : s))
  },

  discardActive() {
    setState((s) => ({ ...s, active: null }))
  },

  finishActive(opts: { name: string; notes: string; updateRoutine: boolean; startedAt: number; endedAt: number }) {
    setState((s) => {
      const a = s.active
      if (!a) return s
      // drop sets that were never ticked, then empty exercises
      const exercises = a.exercises
        .map((ex) => ({ ...ex, sets: ex.sets.filter((st) => st.done) }))
        .filter((ex) => ex.sets.length > 0)
      const workout: Workout = {
        id: a.id,
        name: opts.name.trim() || a.name,
        notes: opts.notes,
        routineId: a.routineId,
        startedAt: opts.startedAt,
        endedAt: opts.endedAt,
        exercises,
      }
      let routines = s.routines
      if (opts.updateRoutine && a.routineId) {
        routines = routines.map((r) =>
          r.id === a.routineId
            ? {
                ...r,
                updatedAt: Date.now(),
                exercises: a.exercises.map((ex) => ({
                  ...ex,
                  sets: ex.sets.map((st) => ({ ...st, done: false })),
                })),
              }
            : r,
        )
      }
      const workouts = [workout, ...s.workouts].sort((x, y) => y.startedAt - x.startedAt)
      return { ...s, workouts, routines, active: null }
    })
  },

  saveRoutine(r: Routine) {
    setState((s) => {
      const exists = s.routines.some((x) => x.id === r.id)
      const next = { ...r, updatedAt: Date.now() }
      return { ...s, routines: exists ? s.routines.map((x) => (x.id === r.id ? next : x)) : [...s.routines, next] }
    })
  },

  addRoutines(rs: Routine[]) {
    setState((s) => ({ ...s, routines: [...s.routines, ...rs] }))
  },

  deleteRoutine(id: string) {
    setState((s) => ({ ...s, routines: s.routines.filter((r) => r.id !== id) }))
  },

  duplicateRoutine(id: string) {
    setState((s) => {
      const r = s.routines.find((x) => x.id === id)
      if (!r) return s
      return { ...s, routines: [...s.routines, { ...structuredClone(r), id: uid(), name: r.name + ' (copy)' }] }
    })
  },

  routineFromWorkout(w: Workout) {
    const r: Routine = {
      id: uid(),
      name: w.name,
      notes: '',
      updatedAt: Date.now(),
      exercises: w.exercises.map((ex) => ({ ...ex, sets: ex.sets.map((st) => ({ ...st, done: false })) })),
    }
    setState((s) => ({ ...s, routines: [...s.routines, r] }))
  },

  deleteWorkout(id: string) {
    setState((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== id) }))
  },

  updateWorkout(w: Workout) {
    setState((s) => ({ ...s, workouts: s.workouts.map((x) => (x.id === w.id ? w : x)) }))
  },

  addCustomExercise(ex: Omit<Exercise, 'id' | 'custom'>): Exercise {
    const full: Exercise = { ...ex, id: 'c-' + uid(), custom: true }
    setState((s) => ({ ...s, customExercises: [...s.customExercises, full] }))
    return full
  },

  setProfileName(name: string) {
    setState((s) => ({ ...s, profileName: name }))
  },

  setDefaultRest(sec: number) {
    setState((s) => ({ ...s, settings: { ...s.settings, defaultRestSec: sec } }))
  },

  exportJson(): string {
    return JSON.stringify(state, null, 2)
  },

  importJson(json: string) {
    const parsed = JSON.parse(json) as AppState
    if (!parsed || !Array.isArray(parsed.workouts) || !Array.isArray(parsed.routines)) {
      throw new Error('Not a Lock In backup file')
    }
    setState(() => ({ ...initial, ...parsed, settings: { ...initial.settings, ...parsed.settings } }))
  },

  resetAll() {
    setState(() => initial)
  },
}
