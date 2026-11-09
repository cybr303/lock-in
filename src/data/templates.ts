import type { Routine, SetEntry } from '../types'

/** Compact template definition: [exerciseId, sets, reps, restSec?] */
type Line = [string, number, number, number?]

interface Program {
  id: string
  name: string
  description: string
  routines: { name: string; lines: Line[] }[]
}

const set = (reps: number): SetEntry => ({ weight: null, reps, time: null, type: 'normal', done: false })

export const PROGRAMS: Program[] = [
  {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    description: '3–6 days a week. Classic hypertrophy split.',
    routines: [
      {
        name: 'Push',
        lines: [
          ['bench-bb', 3, 8, 180],
          ['incline-db', 3, 10, 120],
          ['pec-deck', 3, 12, 90],
          ['ohp-db', 3, 10, 120],
          ['lat-raise-db', 3, 15, 60],
          ['tri-pushdown', 3, 12, 60],
        ],
      },
      {
        name: 'Pull',
        lines: [
          ['lat-pulldown', 3, 10, 120],
          ['tbar-row', 3, 8, 120],
          ['seated-row', 3, 12, 90],
          ['face-pull', 3, 15, 60],
          ['preacher-m', 3, 12, 60],
          ['hammer-curl', 3, 12, 60],
        ],
      },
      {
        name: 'Legs',
        lines: [
          ['squat-bb', 3, 6, 180],
          ['rdl-bb', 3, 8, 150],
          ['leg-press', 3, 12, 120],
          ['lying-curl', 3, 12, 90],
          ['leg-ext', 3, 15, 90],
          ['calf-standing', 4, 12, 60],
        ],
      },
    ],
  },
  {
    id: 'ul',
    name: 'Upper / Lower',
    description: '4 days a week. Strength + size balance.',
    routines: [
      {
        name: 'Upper',
        lines: [
          ['bench-bb', 4, 6, 180],
          ['row-bb', 4, 8, 150],
          ['ohp-db', 3, 10, 120],
          ['pullup', 3, 8, 120],
          ['curl-db', 3, 12, 60],
          ['tri-overhead', 3, 12, 60],
        ],
      },
      {
        name: 'Lower',
        lines: [
          ['deadlift-bb', 3, 5, 180],
          ['hack-squat', 3, 10, 150],
          ['hip-thrust', 3, 10, 120],
          ['seated-curl', 3, 12, 90],
          ['leg-ext', 3, 15, 90],
          ['calf-db', 4, 15, 60],
        ],
      },
    ],
  },
  {
    id: 'fb',
    name: 'Full Body',
    description: '2–3 days a week. Great for beginners or busy weeks.',
    routines: [
      {
        name: 'Full Body A',
        lines: [
          ['squat-bb', 3, 8, 180],
          ['bench-bb', 3, 8, 150],
          ['row-db', 3, 10, 90],
          ['lat-raise-db', 2, 15, 60],
          ['plank', 3, 0, 60],
        ],
      },
      {
        name: 'Full Body B',
        lines: [
          ['deadlift-bb', 3, 5, 180],
          ['ohp-bb', 3, 8, 150],
          ['lat-pulldown', 3, 10, 90],
          ['bulgarian', 3, 10, 90],
          ['hanging-leg', 3, 12, 60],
        ],
      },
    ],
  },
  {
    id: 'home',
    name: 'No Gym (Bodyweight)',
    description: 'Anywhere, no equipment.',
    routines: [
      {
        name: 'Bodyweight Circuit',
        lines: [
          ['pushup', 4, 15, 60],
          ['pullup', 4, 6, 90],
          ['dips', 3, 10, 60],
          ['back-ext', 3, 15, 60],
          ['russian-twist', 3, 20, 45],
          ['plank', 3, 0, 45],
        ],
      },
    ],
  },
]

export function programToRoutines(p: Program, newId: () => string): Routine[] {
  return p.routines.map((r) => ({
    id: newId(),
    name: r.name,
    notes: '',
    folder: p.name,
    updatedAt: Date.now(),
    exercises: r.lines.map(([exerciseId, sets, reps, rest]) => ({
      exerciseId,
      restSec: rest ?? 90,
      notes: '',
      sets: Array.from({ length: sets }, () =>
        reps > 0 ? set(reps) : { weight: null, reps: null, time: 45, type: 'normal' as const, done: false },
      ),
    })),
  }))
}
