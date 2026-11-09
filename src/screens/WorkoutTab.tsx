import { useState } from 'react'
import { actions, getExercise, getState, newLogged, uid, useStore } from '../store'
import type { Routine } from '../types'
import { ActionSheet, BackButton, Empty, Header, Icon, Page, useNav } from '../components/ui'
import { PROGRAMS, programToRoutines } from '../data/templates'
import { ExerciseBlock } from '../components/ExerciseBlock'
import { ExercisePicker } from '../components/ExercisePicker'

export function startOrConfirm(routine: Routine | undefined, openActive: () => void) {
  if (getState().active && !confirm('You already have a workout in progress. Discard it and start a new one?')) {
    openActive()
    return
  }
  actions.startWorkout(routine)
  openActive()
}

export function WorkoutTab() {
  const nav = useNav()
  const routines = useStore((s) => s.routines)
  const [menu, setMenu] = useState<Routine | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const groups = new Map<string, Routine[]>()
  for (const r of routines) {
    const k = r.folder || 'My Routines'
    groups.set(k, [...(groups.get(k) ?? []), r])
  }
  const orderedGroups = [...groups.entries()].sort(([a], [b]) => (a === 'My Routines' ? -1 : b === 'My Routines' ? 1 : a.localeCompare(b)))

  return (
    <Page>
      <Header title="Workout" />
      <div className="scroll pad-x">
        <button className="btn btn-card btn-block left" onClick={() => startOrConfirm(undefined, nav.openActive)}>
          <Icon.plus /> Start Empty Workout
        </button>

        <div className="section-head">
          <h2>Routines</h2>
        </div>
        <div className="row-2">
          <button className="btn btn-card" onClick={() => nav.push({ kind: 'routine-edit' })}>
            <Icon.list /> New Routine
          </button>
          <button className="btn btn-card" onClick={() => nav.push({ kind: 'programs' })}>
            <Icon.search /> Explore
          </button>
        </div>

        {routines.length === 0 && (
          <Empty title="No routines yet">
            <p className="muted">Build your own, or grab a ready-made program from Explore and tweak it.</p>
            <button className="btn btn-primary mt" onClick={() => nav.push({ kind: 'programs' })}>
              Browse programs
            </button>
          </Empty>
        )}

        {orderedGroups.map(([folder, rs]) => (
          <div key={folder}>
            <button className="folder-toggle" onClick={() => setCollapsed((c) => ({ ...c, [folder]: !c[folder] }))}>
              <span className={'caret' + (collapsed[folder] ? ' closed' : '')}>▾</span>
              {folder} ({rs.length})
            </button>
            {!collapsed[folder] &&
              rs.map((r) => (
                <div className="card routine-card" key={r.id}>
                  <div className="routine-card-head">
                    <button className="routine-name" onClick={() => nav.push({ kind: 'routine-edit', routineId: r.id })}>
                      {r.name}
                    </button>
                    <button className="icon-btn" onClick={() => setMenu(r)} aria-label="Routine options">
                      <Icon.more />
                    </button>
                  </div>
                  <div className="muted clamp-2">{r.exercises.map((e) => getExercise(e.exerciseId).name).join(', ') || 'No exercises'}</div>
                  <button className="btn btn-primary btn-block mt-s" onClick={() => startOrConfirm(r, nav.openActive)}>
                    Start Routine
                  </button>
                </div>
              ))}
          </div>
        ))}
        <div className="tab-spacer" />
      </div>
      {menu && (
        <ActionSheet
          title={menu.name}
          onClose={() => setMenu(null)}
          actions={[
            { label: 'Edit routine', icon: <Icon.edit size={18} />, onClick: () => nav.push({ kind: 'routine-edit', routineId: menu.id }) },
            { label: 'Duplicate', icon: <Icon.copy size={18} />, onClick: () => actions.duplicateRoutine(menu.id) },
            {
              label: 'Delete routine',
              danger: true,
              icon: <Icon.trash size={18} />,
              onClick: () => confirm(`Delete “${menu.name}”?`) && actions.deleteRoutine(menu.id),
            },
          ]}
        />
      )}
    </Page>
  )
}

export function RoutineEditor({ routineId }: { routineId?: string }) {
  const nav = useNav()
  const existing = useStore((s) => s.routines.find((r) => r.id === routineId))
  const [r, setR] = useState<Routine>(
    () => (existing ? structuredClone(existing) : { id: uid(), name: '', notes: '', exercises: [], updatedAt: Date.now() }),
  )
  const [picker, setPicker] = useState<null | { replace?: number }>(null)

  const save = () => {
    if (!r.name.trim()) return alert('Give your routine a name.')
    actions.saveRoutine({ ...r, name: r.name.trim() })
    nav.pop()
  }

  return (
    <Page>
      <Header
        center
        left={
          <button className="text-btn" onClick={nav.pop}>
            Cancel
          </button>
        }
        title={existing ? 'Edit Routine' : 'Create Routine'}
        right={
          <button className="btn btn-primary btn-sm" onClick={save}>
            Save
          </button>
        }
      />
      <div className="scroll">
        <div className="pad-x">
          <input className="wo-name-input big" placeholder="Routine title" value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} autoFocus={!existing} />
          <input className="input" placeholder="Folder (optional)" value={r.folder ?? ''} onChange={(e) => setR({ ...r, folder: e.target.value || undefined })} />
        </div>
        {r.exercises.length === 0 && (
          <div className="empty">
            <Icon.dumbbell size={40} />
            <div className="muted">Add exercises, then set target weights and reps.</div>
          </div>
        )}
        {r.exercises.map((ex, i) => (
          <ExerciseBlock
            key={i + ex.exerciseId}
            ex={ex}
            mode="plan"
            onChange={(e) => setR({ ...r, exercises: r.exercises.map((x, j) => (j === i ? e : x)) })}
            onRemove={() => setR({ ...r, exercises: r.exercises.filter((_, j) => j !== i) })}
            onReplace={() => setPicker({ replace: i })}
            onMove={(d) => {
              const j = i + d
              if (j < 0 || j >= r.exercises.length) return
              const xs = [...r.exercises]
              ;[xs[i], xs[j]] = [xs[j], xs[i]]
              setR({ ...r, exercises: xs })
            }}
          />
        ))}
        <div className="pad-x stack">
          <button className="btn btn-primary btn-block" onClick={() => setPicker({})}>
            <Icon.plus size={18} /> Add Exercise
          </button>
          {existing && (
            <button
              className="btn btn-danger-soft btn-block"
              onClick={() => {
                if (confirm(`Delete “${existing.name}”?`)) {
                  actions.deleteRoutine(existing.id)
                  nav.pop()
                }
              }}
            >
              Delete Routine
            </button>
          )}
        </div>
        <div className="tab-spacer" />
      </div>
      {picker && (
        <ExercisePicker
          single={picker.replace != null}
          onClose={() => setPicker(null)}
          onPick={(ids) => {
            if (picker.replace != null) {
              const i = picker.replace
              const old = r.exercises[i]
              setR({ ...r, exercises: r.exercises.map((x, j) => (j === i ? { ...newLogged(ids[0], old.restSec), sets: old.sets.map((s) => ({ ...s, weight: null })) } : x)) })
            } else {
              setR({ ...r, exercises: [...r.exercises, ...ids.map((id) => newLogged(id))] })
            }
          }}
        />
      )}
    </Page>
  )
}

export function Programs() {
  const nav = useNav()
  const [added, setAdded] = useState<string[]>([])
  return (
    <Page>
      <Header left={<BackButton />} title="Explore Programs" center />
      <div className="scroll pad-x">
        <p className="muted">Add a program to your routines, then edit anything — exercises, sets, weights, rest times.</p>
        {PROGRAMS.map((p) => (
          <div className="card" key={p.id}>
            <div className="routine-name">{p.name}</div>
            <div className="muted small">{p.description}</div>
            {p.routines.map((r) => (
              <div key={r.name} className="program-routine">
                <div className="bold">{r.name}</div>
                <div className="muted small">
                  {r.lines.map(([id, sets, reps]) => `${getExercise(id).name} ${sets}×${reps || '45s'}`).join(' · ')}
                </div>
              </div>
            ))}
            <button
              className={'btn btn-block mt-s ' + (added.includes(p.id) ? 'btn-soft' : 'btn-primary')}
              onClick={() => {
                actions.addRoutines(programToRoutines(p, uid))
                setAdded((a) => [...a, p.id])
              }}
            >
              {added.includes(p.id) ? 'Added ✓ (tap to add again)' : 'Add to My Routines'}
            </button>
          </div>
        ))}
        <button className="btn btn-soft btn-block" onClick={nav.pop}>
          Done
        </button>
        <div className="tab-spacer" />
      </div>
    </Page>
  )
}
