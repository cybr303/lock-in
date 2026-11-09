import { useMemo, useState } from 'react'
import { actions, allExercises, useStore } from '../store'
import { EQUIPMENT, MUSCLES } from '../data/exercises'
import type { Equipment, Exercise, ExerciseKind, Muscle } from '../types'
import { ExerciseAvatar, Icon, Modal } from './ui'

interface Props {
  onClose: () => void
  /** Called with the chosen ids (in tap order). If `single`, called on first tap. */
  onPick: (ids: string[]) => void
  single?: boolean
  title?: string
}

export function ExercisePicker({ onClose, onPick, single, title = 'Add Exercise' }: Props) {
  const state = useStore((s) => s)
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<Muscle | ''>('')
  const [equip, setEquip] = useState<Equipment | ''>('')
  const [chosen, setChosen] = useState<string[]>([])
  const [creating, setCreating] = useState(false)

  const list = useMemo(() => {
    const all = allExercises(state)
    const needle = q.trim().toLowerCase()
    return all.filter(
      (e) => (!needle || e.name.toLowerCase().includes(needle)) && (!muscle || e.muscle === muscle) && (!equip || e.equipment === equip),
    )
  }, [state, q, muscle, equip])

  const recentIds = useMemo(() => {
    const seen: string[] = []
    for (const w of state.workouts) for (const ex of w.exercises) if (!seen.includes(ex.exerciseId)) seen.push(ex.exerciseId)
    return seen.slice(0, 8)
  }, [state.workouts])

  const showRecent = !q && !muscle && !equip && recentIds.length > 0
  const recent = showRecent ? list.filter((e) => recentIds.includes(e.id)).sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id)) : []

  const toggle = (id: string) => {
    if (single) {
      onPick([id])
      onClose()
      return
    }
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  }

  const row = (e: Exercise) => {
    const idx = chosen.indexOf(e.id)
    return (
      <button key={e.id} className={'ex-row' + (idx >= 0 ? ' selected' : '')} onClick={() => toggle(e.id)}>
        <ExerciseAvatar name={e.name} muscle={e.muscle} />
        <div className="ex-row-text">
          <div className="ex-row-name">{e.name}</div>
          <div className="muted small">
            {e.muscle} · {e.equipment}
            {e.custom ? ' · Custom' : ''}
          </div>
        </div>
        {idx >= 0 && <span className="pick-badge">{idx + 1}</span>}
      </button>
    )
  }

  return (
    <div className="fullscreen">
      <header className="hdr">
        <div className="hdr-left">
          <button className="text-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
        <h1 className="hdr-title">{title}</h1>
        <div className="hdr-right">
          <button className="text-btn accent" onClick={() => setCreating(true)}>
            Create
          </button>
        </div>
      </header>
      <div className="picker-controls">
        <label className="search">
          <Icon.search size={18} />
          <input placeholder="Search exercise" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        </label>
        <div className="row-2">
          <select className="select" value={equip} onChange={(e) => setEquip(e.target.value as Equipment | '')}>
            <option value="">All Equipment</option>
            {EQUIPMENT.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select className="select" value={muscle} onChange={(e) => setMuscle(e.target.value as Muscle | '')}>
            <option value="">All Muscles</option>
            {MUSCLES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="scroll picker-list">
        {showRecent && (
          <>
            <div className="section-label">Recent</div>
            {recent.map(row)}
            <div className="section-label">All Exercises</div>
          </>
        )}
        {list.map(row)}
        {list.length === 0 && <div className="muted center pad">No exercises match. Tap Create to add your own.</div>}
      </div>
      {!single && chosen.length > 0 && (
        <div className="bottom-cta">
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              onPick(chosen)
              onClose()
            }}
          >
            Add {chosen.length} exercise{chosen.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
      {creating && (
        <CreateExercise
          initialName={q}
          onClose={() => setCreating(false)}
          onCreated={(ex) => {
            setCreating(false)
            toggle(ex.id)
          }}
        />
      )}
    </div>
  )
}

export function CreateExercise({ onClose, onCreated, initialName = '' }: { onClose: () => void; onCreated?: (e: Exercise) => void; initialName?: string }) {
  const [name, setName] = useState(initialName)
  const [muscle, setMuscle] = useState<Muscle>('Chest')
  const [equipment, setEquipment] = useState<Equipment>('Barbell')
  const [kind, setKind] = useState<ExerciseKind>('weight')
  return (
    <Modal onClose={onClose}>
      <h2 className="modal-title">New exercise</h2>
      <label className="field">
        <span>Name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Incline Cable Fly" autoFocus />
      </label>
      <label className="field">
        <span>Primary muscle</span>
        <select className="select" value={muscle} onChange={(e) => setMuscle(e.target.value as Muscle)}>
          {MUSCLES.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Equipment</span>
        <select className="select" value={equipment} onChange={(e) => setEquipment(e.target.value as Equipment)}>
          {EQUIPMENT.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Tracking</span>
        <select className="select" value={kind} onChange={(e) => setKind(e.target.value as ExerciseKind)}>
          <option value="weight">Weight & reps</option>
          <option value="reps">Reps only</option>
          <option value="time">Duration</option>
        </select>
      </label>
      <div className="row-2 mt">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          disabled={!name.trim()}
          onClick={() => {
            const ex = actions.addCustomExercise({ name: name.trim(), muscle, equipment, kind })
            onCreated?.(ex)
            onClose()
          }}
        >
          Save
        </button>
      </div>
    </Modal>
  )
}
