import type { LoggedExercise, SetEntry, Workout } from './types'

export const fmtNum = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 1 })

export function setVolume(s: SetEntry) {
  return s.done && s.weight && s.reps ? s.weight * s.reps : 0
}

export function exerciseVolume(ex: LoggedExercise) {
  return ex.sets.reduce((a, s) => a + setVolume(s), 0)
}

export function workoutVolume(w: { exercises: LoggedExercise[] }) {
  return w.exercises.reduce((a, ex) => a + exerciseVolume(ex), 0)
}

export function workoutSets(w: { exercises: LoggedExercise[] }) {
  return w.exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.done).length, 0)
}

export function workoutReps(w: { exercises: LoggedExercise[] }) {
  return w.exercises.reduce((a, ex) => a + ex.sets.reduce((b, s) => b + (s.done ? s.reps ?? 0 : 0), 0), 0)
}

/** Epley estimated one-rep max */
export function e1rm(weight: number, reps: number) {
  if (!weight || !reps) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

export function fmtDuration(ms: number) {
  const totalMin = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h ? `${h}h ${m}min` : `${m}min`
}

export function fmtClock(sec: number) {
  sec = Math.max(0, Math.round(sec))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function fmtElapsed(ms: number) {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h ? `${h}h ${m}min ${s}s` : `${m}min ${s}s`
}

export function fmtRest(sec: number) {
  if (!sec) return 'Off'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m ? `${m}min ${s}s` : `${s}s`
}

export function relativeDate(ts: number) {
  const diff = Date.now() - ts
  const day = 86400000
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.round(diff / 60000))} min ago`
  if (diff < day) return `${Math.round(diff / 3600000)} hours ago`
  if (diff < 2 * day) return 'Yesterday'
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`
  if (diff < 30 * day) {
    const n = Math.floor(diff / (7 * day))
    return `${n} week${n > 1 ? 's' : ''} ago`
  }
  if (diff < 365 * day) {
    const n = Math.floor(diff / (30 * day))
    return `${n} month${n > 1 ? 's' : ''} ago`
  }
  return new Date(ts).toLocaleDateString()
}

export function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtDateTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function dayKey(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function startOfWeek(ts: number, mondayFirst = true) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay()
  const diff = mondayFirst ? (dow + 6) % 7 : dow
  d.setDate(d.getDate() - diff)
  return d.getTime()
}

/** Consecutive weeks (ending this week or last week) with at least one workout. */
export function weekStreak(workouts: Workout[], mondayFirst = true) {
  const weeks = new Set(workouts.map((w) => startOfWeek(w.startedAt, mondayFirst)))
  const WEEK = 7 * 86400000
  let cur = startOfWeek(Date.now(), mondayFirst)
  if (!weeks.has(cur)) cur -= WEEK
  let n = 0
  while (weeks.has(cur)) {
    n++
    cur = startOfWeek(cur - WEEK / 2, mondayFirst)
  }
  return n
}

export function setLabel(s: SetEntry, kind: 'weight' | 'reps' | 'time') {
  if (kind === 'time') return s.time ? fmtRest(s.time) : '–'
  if (kind === 'reps') return s.reps ? `${s.reps} reps` : '–'
  if (s.weight == null && s.reps == null) return '–'
  return `${fmtNum(s.weight ?? 0)}kg × ${s.reps ?? 0}`
}

export function parseNum(v: string): number | null {
  if (v.trim() === '') return null
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/**
 * Personal records: walks history oldest → newest and flags sets that beat the
 * previous best weight or estimated 1RM for that exercise.
 * Returns workoutId → set of "exerciseIndex:setIndex" keys.
 */
export function computePRs(workouts: Workout[]) {
  const best = new Map<string, { w: number; e: number }>()
  const out = new Map<string, Set<string>>()
  const chrono = [...workouts].sort((a, b) => a.startedAt - b.startedAt)
  for (const w of chrono) {
    const flags = new Set<string>()
    w.exercises.forEach((ex, ei) => {
      const prev = best.get(ex.exerciseId)
      let topW = prev?.w ?? 0
      let topE = prev?.e ?? 0
      ex.sets.forEach((s, si) => {
        if (!s.done || s.type === 'warmup' || !s.weight || !s.reps) return
        const est = e1rm(s.weight, s.reps)
        if (prev && (s.weight > topW || est > topE + 0.01)) flags.add(`${ei}:${si}`)
        topW = Math.max(topW, s.weight)
        topE = Math.max(topE, est)
      })
      if (topW || topE) best.set(ex.exerciseId, { w: topW, e: topE })
    })
    out.set(w.id, flags)
  }
  return out
}
