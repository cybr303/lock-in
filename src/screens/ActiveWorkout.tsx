import { useEffect, useRef, useState } from 'react'
import { actions, newLogged, useStore } from '../store'
import type { ActiveWorkout as AW, LoggedExercise } from '../types'
import { fmtClock, fmtElapsed, fmtNum, workoutSets, workoutVolume } from '../utils'
import { ExerciseBlock } from '../components/ExerciseBlock'
import { ExercisePicker } from '../components/ExercisePicker'
import { ActionSheet, Icon } from '../components/ui'

function useNow(interval = 500) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

function beep() {
  try {
    navigator.vibrate?.([200, 100, 200])
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    ;[0, 0.25].forEach((t) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = 880
      g.gain.setValueAtTime(0.2, ctx.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2)
      o.connect(g).connect(ctx.destination)
      o.start(ctx.currentTime + t)
      o.stop(ctx.currentTime + t + 0.2)
    })
  } catch {
    /* audio unavailable */
  }
}

export function ActiveWorkout({ onMinimize }: { onMinimize: () => void }) {
  const active = useStore((s) => s.active)
  const now = useNow()
  const [picker, setPicker] = useState<null | { replace?: number }>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [timerMenu, setTimerMenu] = useState(false)
  const beeped = useRef<number | null>(null)

  const rest = active?.rest
  const restLeft = rest ? (rest.endsAt - now) / 1000 : 0

  useEffect(() => {
    if (rest && restLeft <= 0 && beeped.current !== rest.endsAt) {
      beeped.current = rest.endsAt
      beep()
      actions.updateActive((a) => ({ ...a, rest: undefined }))
    }
  }, [rest, restLeft])

  if (!active) return null
  if (saving) return <SaveWorkout active={active} onBack={() => setSaving(false)} />

  const update = (fn: (a: AW) => AW) => actions.updateActive(fn)
  const setEx = (i: number, ex: LoggedExercise) => update((a) => ({ ...a, exercises: a.exercises.map((x, j) => (j === i ? ex : x)) }))
  const startRest = (sec: number) => update((a) => ({ ...a, rest: { endsAt: Date.now() + sec * 1000, total: sec } }))

  const vol = workoutVolume(active)
  const sets = workoutSets(active)

  return (
    <div className="fullscreen active-wo">
      <header className="hdr">
        <div className="hdr-left">
          <button className="icon-btn" onClick={onMinimize} aria-label="Minimise">
            <Icon.chevronDown />
          </button>
          <span className="elapsed">{fmtElapsed(now - active.startedAt)}</span>
        </div>
        <div className="hdr-right">
          <button className="icon-btn" onClick={() => setTimerMenu(true)} aria-label="Rest timer">
            <Icon.timer />
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (sets === 0) {
                alert('Tick off at least one set before finishing — or discard the workout.')
                return
              }
              setSaving(true)
            }}
          >
            Finish
          </button>
        </div>
      </header>
      {rest && <div className="rest-progress" style={{ width: `${Math.max(0, (restLeft / rest.total) * 100)}%` }} />}

      <div className="scroll">
        <input className="wo-name-input" value={active.name} onChange={(e) => update((a) => ({ ...a, name: e.target.value }))} aria-label="Workout name" />
        <div className="stats-row">
          <div>
            <div className="stat-label">Duration</div>
            <div className="stat-val accent">{fmtElapsed(now - active.startedAt).replace(/ \d+s$/, '')}</div>
          </div>
          <div>
            <div className="stat-label">Volume</div>
            <div className="stat-val">{fmtNum(vol)} kg</div>
          </div>
          <div>
            <div className="stat-label">Sets</div>
            <div className="stat-val">{sets}</div>
          </div>
        </div>

        {active.exercises.length === 0 && (
          <div className="empty">
            <Icon.dumbbell size={40} />
            <div className="empty-title">Get started</div>
            <div className="muted">Add an exercise to start your workout</div>
          </div>
        )}

        {active.exercises.map((ex, i) => (
          <ExerciseBlock
            key={i + ex.exerciseId}
            ex={ex}
            mode="live"
            onChange={(e) => setEx(i, e)}
            onRemove={() => update((a) => ({ ...a, exercises: a.exercises.filter((_, j) => j !== i) }))}
            onReplace={() => setPicker({ replace: i })}
            onMove={(d) =>
              update((a) => {
                const j = i + d
                if (j < 0 || j >= a.exercises.length) return a
                const xs = [...a.exercises]
                ;[xs[i], xs[j]] = [xs[j], xs[i]]
                return { ...a, exercises: xs }
              })
            }
            onSetDone={startRest}
          />
        ))}

        <div className="stack pad-x">
          <button className="btn btn-primary btn-block" onClick={() => setPicker({})}>
            <Icon.plus size={18} /> Add Exercise
          </button>
          <button className="btn btn-danger-soft btn-block" onClick={() => setConfirmDiscard(true)}>
            Discard Workout
          </button>
        </div>
        <div style={{ height: rest ? 120 : 40 }} />
      </div>

      {rest && (
        <div className="rest-bar">
          <button className="btn btn-soft" onClick={() => update((a) => (a.rest ? { ...a, rest: { ...a.rest, endsAt: a.rest.endsAt - 15000 } } : a))}>
            −15
          </button>
          <div className="rest-clock">{fmtClock(restLeft)}</div>
          <button
            className="btn btn-soft"
            onClick={() => update((a) => (a.rest ? { ...a, rest: { endsAt: a.rest.endsAt + 15000, total: a.rest.total + 15 } } : a))}
          >
            +15
          </button>
          <button className="btn btn-primary" onClick={() => update((a) => ({ ...a, rest: undefined }))}>
            Skip
          </button>
        </div>
      )}

      {picker && (
        <ExercisePicker
          single={picker.replace != null}
          title={picker.replace != null ? 'Replace Exercise' : 'Add Exercise'}
          onClose={() => setPicker(null)}
          onPick={(ids) =>
            update((a) => {
              if (picker.replace != null) {
                const i = picker.replace
                const old = a.exercises[i]
                const fresh = newLogged(ids[0], old.restSec)
                fresh.sets = old.sets.map((s) => ({ ...s, weight: null, done: false }))
                return { ...a, exercises: a.exercises.map((x, j) => (j === i ? fresh : x)) }
              }
              return { ...a, exercises: [...a.exercises, ...ids.map((id) => newLogged(id))] }
            })
          }
        />
      )}
      {confirmDiscard && (
        <ActionSheet
          title="Discard this workout? Nothing will be saved."
          actions={[{ label: 'Discard Workout', danger: true, onClick: () => actions.discardActive() }]}
          onClose={() => setConfirmDiscard(false)}
        />
      )}
      {timerMenu && (
        <ActionSheet
          title="Start a rest timer"
          actions={[30, 60, 90, 120, 180, 300].map((s) => ({ label: fmtClock(s), onClick: () => startRest(s) }))}
          onClose={() => setTimerMenu(false)}
        />
      )}
    </div>
  )
}

function toLocalInput(ts: number) {
  const d = new Date(ts)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function SaveWorkout({ active, onBack }: { active: AW; onBack: () => void }) {
  const routine = useStore((s) => s.routines.find((r) => r.id === active.routineId))
  const [endedAt] = useState(Date.now())
  const [name, setName] = useState(active.name)
  const [notes, setNotes] = useState('')
  const [start, setStart] = useState(toLocalInput(active.startedAt))
  const [minutes, setMinutes] = useState(String(Math.max(1, Math.round((endedAt - active.startedAt) / 60000))))
  const [updateRoutine, setUpdateRoutine] = useState(false)

  const changed =
    routine &&
    JSON.stringify(routine.exercises.map((e) => [e.exerciseId, e.sets.length])) !==
      JSON.stringify(active.exercises.map((e) => [e.exerciseId, e.sets.length]))

  const save = () => {
    const startedAt = new Date(start).getTime() || active.startedAt
    const dur = Math.max(1, Number(minutes) || 1) * 60000
    actions.finishActive({ name, notes, updateRoutine, startedAt, endedAt: startedAt + dur })
  }

  return (
    <div className="fullscreen">
      <header className="hdr hdr-center">
        <div className="hdr-left">
          <button className="icon-btn" onClick={onBack} aria-label="Back">
            <Icon.back />
          </button>
        </div>
        <h1 className="hdr-title">Save Workout</h1>
        <div className="hdr-right">
          <button className="btn btn-primary btn-sm" onClick={save}>
            Save
          </button>
        </div>
      </header>
      <div className="scroll pad-x">
        <input className="wo-name-input big" value={name} onChange={(e) => setName(e.target.value)} placeholder="Workout title" />
        <textarea className="note-input big" rows={2} placeholder="How did your workout go?" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="stats-row bordered">
          <div>
            <div className="stat-label">Duration</div>
            <div className="stat-val accent">
              <input className="inline-num" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} /> min
            </div>
          </div>
          <div>
            <div className="stat-label">Volume</div>
            <div className="stat-val">{fmtNum(workoutVolume(active))} kg</div>
          </div>
          <div>
            <div className="stat-label">Sets</div>
            <div className="stat-val">{workoutSets(active)}</div>
          </div>
        </div>
        <label className="list-row">
          <Icon.calendar />
          <span className="grow">Date</span>
          <input type="datetime-local" className="date-input" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        {routine && (
          <label className="list-row">
            <Icon.list />
            <span className="grow">
              Update “{routine.name}” routine
              <div className="muted small">{changed ? 'You changed exercises or sets in this workout.' : 'Save today’s weights & reps as the new targets.'}</div>
            </span>
            <input type="checkbox" className="toggle" checked={updateRoutine} onChange={(e) => setUpdateRoutine(e.target.checked)} />
          </label>
        )}
        <p className="muted small mt">Sets you didn't tick off won't be saved.</p>
        <button className="btn btn-danger-soft btn-block mt" onClick={() => confirm('Discard this workout?') && actions.discardActive()}>
          Discard Workout
        </button>
      </div>
    </div>
  )
}
