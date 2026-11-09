import { useMemo, useRef, useState } from 'react'
import { actions, allExercises, getExercise, useStore } from '../store'
import { MUSCLES } from '../data/exercises'
import type { Muscle, Workout } from '../types'
import {
  dayKey, e1rm, fmtDate, fmtNum, fmtRest, setLabel, startOfWeek, weekStreak, workoutReps, workoutSets, workoutVolume,
} from '../utils'
import { BackButton, Empty, ExerciseAvatar, Header, Icon, Page, useNav } from '../components/ui'
import { CreateExercise } from '../components/ExercisePicker'
import { Avatar, WorkoutCard, usePRs } from './Home'

type Metric = 'duration' | 'volume' | 'reps'
const WEEK = 7 * 86400000

export function Profile() {
  const nav = useNav()
  const s = useStore((x) => x)
  const prs = usePRs()
  const [metric, setMetric] = useState<Metric>('duration')
  const mondayFirst = s.settings.weekStartsMonday

  const weeks = useMemo(() => {
    const thisWeek = startOfWeek(Date.now(), mondayFirst)
    const buckets = Array.from({ length: 12 }, (_, i) => ({ start: thisWeek - (11 - i) * WEEK, value: 0 }))
    for (const w of s.workouts) {
      const ws = startOfWeek(w.startedAt, mondayFirst)
      const b = buckets.find((x) => Math.abs(x.start - ws) < 2 * 3600000)
      if (!b) continue
      b.value += metric === 'duration' ? (w.endedAt - w.startedAt) / 3600000 : metric === 'volume' ? workoutVolume(w) : workoutReps(w)
    }
    return buckets
  }, [s.workouts, metric, mondayFirst])

  const thisWeekHours = weeks[11].value
  const unit = metric === 'duration' ? 'hrs' : metric === 'volume' ? 'kg' : 'reps'

  return (
    <Page>
      <Header
        title={s.profileName}
        right={
          <button className="icon-btn" onClick={() => nav.push({ kind: 'settings' })} aria-label="Settings">
            <Icon.gear />
          </button>
        }
      />
      <div className="scroll pad-x">
        <div className="profile-top">
          <Avatar size={76} />
          <div className="profile-counts">
            <div>
              <div className="stat-label">Workouts</div>
              <div className="stat-val">{s.workouts.length}</div>
            </div>
            <div>
              <div className="stat-label">Streak</div>
              <div className="stat-val">
                {weekStreak(s.workouts, mondayFirst)} <span className="small muted">wk</span>
              </div>
            </div>
            <div>
              <div className="stat-label">Routines</div>
              <div className="stat-val">{s.routines.length}</div>
            </div>
          </div>
        </div>

        <div className="chart-head">
          <div>
            <span className="bold big">
              {metric === 'duration' ? fmtNum(Math.round(thisWeekHours * 10) / 10) : fmtNum(Math.round(thisWeekHours))} {unit}
            </span>{' '}
            <span className="muted">this week</span>
          </div>
          <span className="muted small">Last 12 weeks</span>
        </div>
        <BarChart data={weeks.map((w) => ({ label: new Date(w.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), value: w.value }))} unit={unit} />
        <div className="seg">
          {(['duration', 'volume', 'reps'] as Metric[]).map((m) => (
            <button key={m} className={'seg-btn' + (metric === m ? ' on' : '')} onClick={() => setMetric(m)}>
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>

        <h2 className="section-title">Dashboard</h2>
        <div className="grid-2">
          <button className="btn btn-card left" onClick={() => nav.push({ kind: 'stats' })}>
            <Icon.chart /> Statistics
          </button>
          <button className="btn btn-card left" onClick={() => nav.push({ kind: 'exercises' })}>
            <Icon.dumbbell /> Exercises
          </button>
          <button className="btn btn-card left" onClick={() => nav.push({ kind: 'calendar' })}>
            <Icon.calendar /> Calendar
          </button>
          <button className="btn btn-card left" onClick={() => nav.push({ kind: 'settings' })}>
            <Icon.gear /> Settings
          </button>
        </div>

        <h2 className="section-title">Workouts</h2>
      </div>
      {s.workouts.slice(0, 10).map((w) => (
        <WorkoutCard key={w.id} w={w} prs={prs.get(w.id)?.size ?? 0} dateStyle="full" />
      ))}
      {s.workouts.length === 0 && <div className="muted center pad">Finish a workout and it'll appear here.</div>}
      <div className="tab-spacer" />
    </Page>
  )
}

function BarChart({ data, unit }: { data: { label: string; value: number }[]; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const nice = unit === 'hrs' ? Math.max(1, Math.ceil(max)) : niceCeil(max)
  return (
    <div className="bar-chart">
      <div className="bar-axis">
        <span>
          {fmtNum(nice)} {unit}
        </span>
        <span>0</span>
      </div>
      <div className="bars">
        {data.map((d, i) => (
          <div className="bar-col" key={i} title={`${d.label}: ${fmtNum(Math.round(d.value * 10) / 10)} ${unit}`}>
            <div className="bar" style={{ height: `${(d.value / nice) * 100}%` }} />
            <div className="bar-label">{i % 3 === 0 ? d.label : ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function niceCeil(n: number) {
  const p = Math.pow(10, Math.floor(Math.log10(n)))
  const f = n / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p
}

// ---------- Calendar ----------

export function CalendarScreen() {
  const workouts = useStore((s) => s.workouts)
  const mondayFirst = useStore((s) => s.settings.weekStartsMonday)
  const nav = useNav()
  const byDay = useMemo(() => {
    const m = new Map<string, Workout[]>()
    for (const w of workouts) m.set(dayKey(w.startedAt), [...(m.get(dayKey(w.startedAt)) ?? []), w])
    return m
  }, [workouts])

  const now = new Date()
  const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - i, 1))
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const daysSoFar = now.getDate()
  const activeDaysThisMonth = new Set(workouts.filter((w) => w.startedAt >= monthStart).map((w) => dayKey(w.startedAt))).size
  const dows = mondayFirst ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Page>
      <Header left={<BackButton />} title="Calendar" center />
      <div className="cal-summary">
        <div>
          <Icon.flame size={18} /> {weekStreak(workouts, mondayFirst)} week streak
        </div>
        <div>
          <span className="accent">☾</span> {daysSoFar - activeDaysThisMonth} rest days
        </div>
      </div>
      <div className="cal-dows">
        {dows.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="scroll">
        {months.map((m) => {
          const offset = mondayFirst ? (m.getDay() + 6) % 7 : m.getDay()
          const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()
          return (
            <div key={m.getTime()} className="cal-month">
              <h3>{m.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
              <div className="cal-grid">
                {Array.from({ length: offset }, (_, i) => (
                  <span key={'x' + i} />
                ))}
                {Array.from({ length: days }, (_, i) => {
                  const d = new Date(m.getFullYear(), m.getMonth(), i + 1)
                  const ws = byDay.get(dayKey(d.getTime()))
                  const today = dayKey(d.getTime()) === dayKey(Date.now())
                  return (
                    <button
                      key={i}
                      className={'cal-day' + (ws ? ' has' : '') + (today ? ' today' : '')}
                      disabled={!ws}
                      onClick={() => ws && nav.push({ kind: 'workout', id: ws[0].id })}
                    >
                      <span className="cal-num">{i + 1}</span>
                      {ws && <span className="cal-label">{ws[0].name}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
        <div className="tab-spacer" />
      </div>
    </Page>
  )
}

// ---------- Exercises ----------

export function ExercisesScreen() {
  const s = useStore((x) => x)
  const nav = useNav()
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<Muscle | ''>('')
  const [creating, setCreating] = useState(false)
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const w of s.workouts) for (const ex of w.exercises) m.set(ex.exerciseId, (m.get(ex.exerciseId) ?? 0) + 1)
    return m
  }, [s.workouts])
  const list = allExercises(s)
    .filter((e) => (!q || e.name.toLowerCase().includes(q.toLowerCase())) && (!muscle || e.muscle === muscle))
    .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.name.localeCompare(b.name))

  return (
    <Page>
      <Header
        left={<BackButton />}
        title="Exercises"
        center
        right={
          <button className="text-btn accent" onClick={() => setCreating(true)}>
            Create
          </button>
        }
      />
      <div className="picker-controls">
        <label className="search">
          <Icon.search size={18} />
          <input placeholder="Search exercise" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select className="select" value={muscle} onChange={(e) => setMuscle(e.target.value as Muscle | '')}>
          <option value="">All Muscles</option>
          {MUSCLES.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="scroll">
        {list.map((e) => (
          <button key={e.id} className="ex-row" onClick={() => nav.push({ kind: 'exercise', id: e.id })}>
            <ExerciseAvatar name={e.name} muscle={e.muscle} />
            <div className="ex-row-text">
              <div className="ex-row-name">{e.name}</div>
              <div className="muted small">
                {e.muscle}
                {counts.get(e.id) ? ` · ${counts.get(e.id)} workouts` : ''}
              </div>
            </div>
            <Icon.chevronRight size={18} />
          </button>
        ))}
        <div className="tab-spacer" />
      </div>
      {creating && <CreateExercise onClose={() => setCreating(false)} initialName={q} />}
    </Page>
  )
}

export function ExerciseDetail({ id }: { id: string }) {
  const workouts = useStore((s) => s.workouts)
  useStore((s) => s.customExercises)
  const info = getExercise(id)
  const nav = useNav()

  const history = useMemo(
    () =>
      workouts
        .map((w) => ({ w, ex: w.exercises.find((x) => x.exerciseId === id) }))
        .filter((h): h is { w: Workout; ex: NonNullable<typeof h.ex> } => !!h.ex),
    [workouts, id],
  )

  const stats = useMemo(() => {
    let heaviest = 0
    let best1rm = 0
    let bestSetVol = 0
    let mostReps = 0
    for (const { ex } of history)
      for (const s of ex.sets) {
        if (!s.done || s.type === 'warmup') continue
        heaviest = Math.max(heaviest, s.weight ?? 0)
        best1rm = Math.max(best1rm, e1rm(s.weight ?? 0, s.reps ?? 0))
        bestSetVol = Math.max(bestSetVol, (s.weight ?? 0) * (s.reps ?? 0))
        mostReps = Math.max(mostReps, s.reps ?? 0)
      }
    return { heaviest, best1rm, bestSetVol, mostReps }
  }, [history])

  const points = history
    .map(({ w, ex }) => ({
      t: w.startedAt,
      v:
        info.kind === 'weight'
          ? Math.max(0, ...ex.sets.filter((s) => s.done).map((s) => e1rm(s.weight ?? 0, s.reps ?? 0)))
          : info.kind === 'reps'
            ? Math.max(0, ...ex.sets.map((s) => s.reps ?? 0))
            : Math.max(0, ...ex.sets.map((s) => s.time ?? 0)),
    }))
    .reverse()

  return (
    <Page>
      <Header left={<BackButton />} title="Exercise" center />
      <div className="scroll pad-x">
        <div className="ex-detail-head">
          <ExerciseAvatar name={info.name} muscle={info.muscle} size={64} />
          <div>
            <h2 className="detail-title">{info.name}</h2>
            <div className="muted">
              {info.muscle} · {info.equipment}
            </div>
          </div>
        </div>

        {history.length === 0 ? (
          <Empty title="No history yet">
            <p className="muted">Log this exercise in a workout to see your progress.</p>
          </Empty>
        ) : (
          <>
            {points.length > 1 && (
              <>
                <div className="section-label">
                  {info.kind === 'weight' ? 'Estimated 1RM (kg)' : info.kind === 'reps' ? 'Most reps' : 'Longest set (s)'}
                </div>
                <LineChart points={points} />
              </>
            )}
            {info.kind === 'weight' && (
              <div className="grid-2 records">
                <Record label="Heaviest weight" value={`${fmtNum(stats.heaviest)} kg`} />
                <Record label="Best est. 1RM" value={`${fmtNum(Math.round(stats.best1rm * 10) / 10)} kg`} />
                <Record label="Best set volume" value={`${fmtNum(stats.bestSetVol)} kg`} />
                <Record label="Most reps" value={`${stats.mostReps}`} />
              </div>
            )}
            <div className="section-label">History</div>
            {history.map(({ w, ex }) => (
              <button key={w.id} className="card hist-card" onClick={() => nav.push({ kind: 'workout', id: w.id })}>
                <div className="bold">{w.name}</div>
                <div className="muted small">{fmtDate(w.startedAt)}</div>
                <div className="hist-sets">
                  {ex.sets.map((s, i) => (
                    <div key={i}>
                      <span className={'muted t-' + s.type}>{s.type === 'warmup' ? 'W' : i + 1}</span> {setLabel(s, info.kind)}
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </>
        )}
        <div className="tab-spacer" />
      </div>
    </Page>
  )
}

function Record({ label, value }: { label: string; value: string }) {
  return (
    <div className="card record">
      <div className="muted small">{label}</div>
      <div className="bold big">{value}</div>
    </div>
  )
}

function LineChart({ points }: { points: { t: number; v: number }[] }) {
  const W = 320
  const H = 140
  const pad = 8
  const vs = points.map((p) => p.v)
  const min = Math.min(...vs)
  const max = Math.max(...vs)
  const span = max - min || 1
  const xy = points.map((p, i) => [pad + (i / (points.length - 1)) * (W - 2 * pad), H - pad - ((p.v - min) / span) * (H - 2 * pad)])
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  return (
    <div className="line-chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Progress chart">
        <path d={`${d} L${xy[xy.length - 1][0]},${H} L${xy[0][0]},${H} Z`} className="line-area" />
        <path d={d} className="line-path" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="line-legend muted small">
        <span>{new Date(points[0].t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
        <span>
          {fmtNum(Math.round(min))} → {fmtNum(Math.round(vs[vs.length - 1]))}
        </span>
        <span>{new Date(points[points.length - 1].t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  )
}

// ---------- Statistics ----------

export function StatsScreen() {
  const workouts = useStore((s) => s.workouts)
  const [range, setRange] = useState(30)
  const since = Date.now() - range * 86400000
  const recent = workouts.filter((w) => w.startedAt >= since)

  const perMuscle = new Map<Muscle, number>()
  const perExercise = new Map<string, number>()
  for (const w of recent)
    for (const ex of w.exercises) {
      const m = getExercise(ex.exerciseId).muscle
      const n = ex.sets.filter((s) => s.done && s.type !== 'warmup').length
      perMuscle.set(m, (perMuscle.get(m) ?? 0) + n)
      perExercise.set(ex.exerciseId, (perExercise.get(ex.exerciseId) ?? 0) + 1)
    }
  const muscles = [...perMuscle.entries()].sort((a, b) => b[1] - a[1])
  const maxSets = Math.max(1, ...muscles.map((m) => m[1]))
  const top = [...perExercise.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)

  // last 7 days strip
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (6 - i))
    return d
  })
  const trained = new Set(workouts.map((w) => dayKey(w.startedAt)))

  return (
    <Page>
      <Header left={<BackButton />} title="Statistics" center />
      <div className="scroll pad-x">
        <div className="section-label">Last 7 days</div>
        <div className="week-strip">
          {days.map((d) => (
            <div key={d.getTime()} className={'week-day' + (trained.has(dayKey(d.getTime())) ? ' on' : '')}>
              <span>{d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span>
              <span className="bold">{d.getDate()}</span>
            </div>
          ))}
        </div>

        <div className="seg mt">
          {[7, 30, 90, 365].map((r) => (
            <button key={r} className={'seg-btn' + (range === r ? ' on' : '')} onClick={() => setRange(r)}>
              {r === 365 ? '1y' : `${r}d`}
            </button>
          ))}
        </div>

        <div className="stats-row bordered">
          <div>
            <div className="stat-label">Workouts</div>
            <div className="stat-val">{recent.length}</div>
          </div>
          <div>
            <div className="stat-label">Sets</div>
            <div className="stat-val">{recent.reduce((a, w) => a + workoutSets(w), 0)}</div>
          </div>
          <div>
            <div className="stat-label">Volume</div>
            <div className="stat-val">{fmtNum(Math.round(recent.reduce((a, w) => a + workoutVolume(w), 0)))} kg</div>
          </div>
        </div>

        <h2 className="section-title">Sets per muscle group</h2>
        {muscles.length === 0 && <div className="muted">No sets logged in this period.</div>}
        {muscles.map(([m, n]) => (
          <div key={m} className="hbar">
            <span className="hbar-label">{m}</span>
            <span className="hbar-track">
              <span className="hbar-fill" style={{ width: `${(n / maxSets) * 100}%` }} />
            </span>
            <span className="hbar-val">{n}</span>
          </div>
        ))}

        <h2 className="section-title">Main exercises</h2>
        {top.map(([id, n]) => {
          const e = getExercise(id)
          return (
            <div key={id} className="ex-row static">
              <ExerciseAvatar name={e.name} muscle={e.muscle} size={36} />
              <div className="ex-row-text">
                <div className="ex-row-name">{e.name}</div>
              </div>
              <span className="muted">{n}×</span>
            </div>
          )
        })}
        <div className="tab-spacer" />
      </div>
    </Page>
  )
}

// ---------- Settings ----------

export function SettingsScreen() {
  const s = useStore((x) => x)
  const fileRef = useRef<HTMLInputElement>(null)

  const exportData = () => {
    const blob = new Blob([actions.exportJson()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lock-in-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Page>
      <Header left={<BackButton />} title="Settings" center />
      <div className="scroll pad-x">
        <label className="field">
          <span>Display name</span>
          <input className="input" value={s.profileName} onChange={(e) => actions.setProfileName(e.target.value)} />
        </label>
        <label className="field">
          <span>Default rest timer for new exercises</span>
          <select className="select" value={s.settings.defaultRestSec} onChange={(e) => actions.setDefaultRest(Number(e.target.value))}>
            {[0, 30, 60, 90, 120, 150, 180, 240, 300].map((x) => (
              <option key={x} value={x}>
                {fmtRest(x)}
              </option>
            ))}
          </select>
        </label>

        <h2 className="section-title">Your data</h2>
        <p className="muted small">Everything is stored on this device only. Export a backup now and then so you don't lose your history.</p>
        <div className="stack">
          <button className="btn btn-card left" onClick={exportData}>
            Export backup (.json)
          </button>
          <button className="btn btn-card left" onClick={() => fileRef.current?.click()}>
            Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              if (!confirm('Replace all current data with this backup?')) return
              try {
                actions.importJson(await f.text())
                alert('Backup restored.')
              } catch (err) {
                alert('Could not import: ' + (err as Error).message)
              }
              e.target.value = ''
            }}
          />
          <button
            className="btn btn-danger-soft btn-block"
            onClick={() => confirm('Delete ALL workouts, routines and custom exercises? This cannot be undone.') && actions.resetAll()}
          >
            Reset all data
          </button>
        </div>
        <p className="muted small mt">
          {s.workouts.length} workouts · {s.routines.length} routines · {s.customExercises.length} custom exercises
        </p>
        <div className="tab-spacer" />
      </div>
    </Page>
  )
}
