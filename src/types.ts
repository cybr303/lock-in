export type Muscle =
  | 'Chest' | 'Upper Back' | 'Lats' | 'Lower Back' | 'Shoulders' | 'Biceps' | 'Triceps' | 'Forearms'
  | 'Quadriceps' | 'Hamstrings' | 'Glutes' | 'Calves' | 'Abs' | 'Cardio' | 'Full Body' | 'Other'

export type Equipment = 'Barbell' | 'Dumbbell' | 'Machine' | 'Cable' | 'Bodyweight' | 'Kettlebell' | 'Band' | 'Other'

/** weight = kg × reps, reps = reps only, time = duration in seconds */
export type ExerciseKind = 'weight' | 'reps' | 'time'

export interface Exercise {
  id: string
  name: string
  muscle: Muscle
  equipment: Equipment
  kind: ExerciseKind
  custom?: boolean
}

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure'

export interface SetEntry {
  weight: number | null
  reps: number | null
  /** seconds, for time-based exercises */
  time: number | null
  type: SetType
  done: boolean
}

export interface LoggedExercise {
  exerciseId: string
  restSec: number
  notes: string
  sets: SetEntry[]
}

export interface Routine {
  id: string
  name: string
  notes: string
  exercises: LoggedExercise[]
  folder?: string
  updatedAt: number
}

export interface Workout {
  id: string
  name: string
  notes: string
  routineId?: string
  startedAt: number
  endedAt: number
  exercises: LoggedExercise[]
}

export interface ActiveWorkout {
  id: string
  name: string
  routineId?: string
  startedAt: number
  exercises: LoggedExercise[]
  rest?: { endsAt: number; total: number }
}

export interface Settings {
  defaultRestSec: number
  weekStartsMonday: boolean
}

export interface AppState {
  version: 1
  profileName: string
  customExercises: Exercise[]
  routines: Routine[]
  workouts: Workout[]
  active: ActiveWorkout | null
  settings: Settings
}
