import { useMemo, useState } from 'react'
import { actions, getExercise, useStore } from '../store'
import type { Workout } from '../types'
import { computePRs, fmtDate, fmtDateTime, fmtDuration, fmtNum, relativeDate, setLabel, workoutVolume } from '../utils'
import { ActionSheet, BackButton, Empty, ExerciseAvatar, Header, Icon, Page, useNav } from '../components/ui'

export function usePRs() {
  const workouts = useStore((s) => s.workouts)
  return useMemo(() => computePRs(workouts), [workouts])
}

export function Avatar({ size = 44 }: { size?: number }) {
  const name = useStore((s) => s.profileName)
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {name.trim()[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

export function WorkoutCard({ w, prs, dateStyle = 'relative' }: { w: Workout; prs: number; dateStyle?: 'relative' | 'full' }) {
  const nav = useNav()
  const name = useStore((s) => s.profileName)
  const shown = w.exercises.slice(0, 3)
  return (
    <article className="wo-card" onClick={() => nav.push({ kind: 'workout', id: w.id })}>
      <div className="wo-card-user">
        <Avatar />
        <div>
          <div className="bold">{name}</div>
          <div className="muted small">{dateStyle === 'relative' ? relativeDate(w.startedAt) : fmtDate(w.startedAt)}</div>
        </div>
      </div>
      <h3 className="wo-card-title">{w.name}</h3>
      <div className="stats-row compact">
        <div>
          <div className="stat-label">Time</div>
          <div className="stat-val">{fmtDuration(w.endedAt - w.startedAt)}</div>
        </div>
        <div>
          <div className="stat-label">Volume</div>
          <div className="stat-val">{fmtNum(workoutVolume(w))} kg</div>
        </div>
        {prs > 0 && (
          <div>
            <div className="stat-label">Records</div>
            <div className="stat-val">
              <span className="pr-dot" /> {prs}
            </div>
          </div>
        )}
      </div>
      <div className="wo-card-exs">
        {shown.map((ex, i) => {
          const info = getExercise(ex.exerciseId)
          return (
            <div className="wo-card-ex" key={i}>
              <ExerciseAvatar name={info.name} muscle={info.muscle} size={40} />
              <span>
                {ex.sets.length} set{ex.sets.length === 1 ? '' : 's'} {info.name}
              </span>
            </div>
          )
        })}
        {w.exercises.length > 3 && (
          <div className="muted center small">
            See {w.exercises.length - 3} more exercise{w.exercises.length - 3 > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </article>
  )
}

export function Home() {
  const workouts = useStore((s) => s.workouts)
  const prs = usePRs()
  const nav = useNav()
  return (
    <Page>
      <Header title="Home" />
      <div className="scroll">
        {workouts.length === 0 ? (
          <Empty title="No workouts logged yet">
            <p className="muted">Your training log will show up here.</p>
            <button className="btn btn-primary mt" onClick={() => nav.push({ kind: 'programs' })}>
              Pick a starter program
            </button>
          </Empty>
        ) : (
          workouts.map((w) => <WorkoutCard key={w.id} w={w} prs={prs.get(w.id)?.size ?? 0} />)
        )}
        <div className="tab-spacer" />
      </div>
    </Page>
  )
}

export function WorkoutDetail({ id }: { id: string }) {
  const nav = useNav()
  const w = useStore((s) => s.workouts.find((x) => x.id === id))
  const prs = usePRs().get(id) ?? new Set<string>()
  const [menu, setMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(w?.name ?? '')
  const [notes, setNotes] = useState(w?.notes ?? '')

  if (!w) {
    return (
      <Page>
        <Header left={<BackButton />} title="Workout" center />
        <Empty title="Workout not found" />
      </Page>
    )
  }

  return (
    <Page>
      <Header
        left={<BackButton />}
        title="Workout Detail"
        center
        right={
          editing ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                actions.updateWorkout({ ...w, name: name.trim() || w.name, notes })
                setEditing(false)
              }}
            >
              Done
            </button>
          ) : (
            <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Workout options">
              <Icon.more />
            </button>
          )
        }
      />
      <div className="scroll pad-x">
        {editing ? (
          <>
            <input className="wo-name-input big" value={name} onChange={(e) => setName(e.target.value)} />
            <textarea className="note-input big" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
          </>
        ) : (
          <>
            <h2 className="detail-title">{w.name}</h2>
            <div className="muted small">{fmtDateTime(w.startedAt)}</div>
            {w.notes && <p className="detail-notes">{w.notes}</p>}
          </>
        )}
        <div className="stats-row bordered">
          <div>
            <div className="stat-label">Time</div>
            <div className="stat-val">{fmtDuration(w.endedAt - w.startedAt)}</div>
          </div>
          <div>
            <div className="stat-label">Volume</div>
            <div className="stat-val">{fmtNum(workoutVolume(w))} kg</div>
          </div>
          <div>
            <div className="stat-label">Records</div>
            <div className="stat-val">{prs.size}</div>
          </div>
        </div>
        {w.exercises.map((ex, ei) => {
          const info = getExercise(ex.exerciseId)
          return (
            <div className="detail-ex" key={ei}>
              <button className="ex-title-btn" onClick={() => nav.push({ kind: 'exercise', id: ex.exerciseId })}>
                <ExerciseAvatar name={info.name} muscle={info.muscle} size={40} />
                <span className="ex-title">{info.name}</span>
              </button>
              {ex.notes && <div className="muted small detail-ex-note">{ex.notes}</div>}
              <div className="detail-sets">
                <div className="set-h">SET</div>
                <div className="set-h">WEIGHT & REPS</div>
                {ex.sets.map((s, si) => (
                  <div key={si} style={{ display: 'contents' }}>
                    <div className={'detail-set-num t-' + s.type}>{s.type === 'warmup' ? 'W' : s.type === 'drop' ? 'D' : s.type === 'failure' ? 'F' : si + 1}</div>
                    <div className="detail-set-val">
                      {setLabel(s, info.kind)}
                      {prs.has(`${ei}:${si}`) && <span className="pr-tag">PR</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        <div className="tab-spacer" />
      </div>
      {menu && (
        <ActionSheet
          onClose={() => setMenu(false)}
          actions={[
            { label: 'Edit title & notes', icon: <Icon.edit size={18} />, onClick: () => setEditing(true) },
            {
              label: 'Save as routine',
              icon: <Icon.copy size={18} />,
              onClick: () => {
                actions.routineFromWorkout(w)
                alert(`Saved “${w.name}” to your routines.`)
              },
            },
            {
              label: 'Delete workout',
              danger: true,
              icon: <Icon.trash size={18} />,
              onClick: () => {
                if (confirm('Delete this workout?')) {
                  actions.deleteWorkout(w.id)
                  nav.pop()
                }
              },
            },
          ]}
        />
      )}
    </Page>
  )
}
