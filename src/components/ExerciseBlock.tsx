import { useState } from 'react'
import { emptySet, getExercise, previousSets, useStore } from '../store'
import type { LoggedExercise, SetEntry, SetType } from '../types'
import { fmtNum, fmtRest, parseNum } from '../utils'
import { ActionSheet, ExerciseAvatar, Icon, useNav, type SheetAction } from './ui'

interface Props {
  ex: LoggedExercise
  mode: 'live' | 'plan'
  onChange: (ex: LoggedExercise) => void
  onRemove: () => void
  onReplace: () => void
  onMove: (dir: -1 | 1) => void
  onSetDone?: (restSec: number) => void
}

const REST_OPTIONS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300]
const TYPE_LABEL: Record<SetType, string> = { normal: '', warmup: 'W', drop: 'D', failure: 'F' }

export function ExerciseBlock({ ex, mode, onChange, onRemove, onReplace, onMove, onSetDone }: Props) {
  const nav = useNav()
  useStore((s) => s.workouts) // re-render when history changes
  const info = getExercise(ex.exerciseId)
  const prev = previousSets(ex.exerciseId)
  const [menu, setMenu] = useState<null | 'ex' | 'rest' | number>(null)
  const [showNote, setShowNote] = useState(!!ex.notes)

  const setAt = (i: number, patch: Partial<SetEntry>) =>
    onChange({ ...ex, sets: ex.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)) })

  // number shown in SET column (warmups don't count)
  let n = 0
  const labels = ex.sets.map((s) => {
    if (s.type === 'warmup') return TYPE_LABEL.warmup
    n++
    return s.type === 'normal' ? String(n) : TYPE_LABEL[s.type]
  })

  const kind = info.kind
  const prevLabel = (p?: SetEntry) => {
    if (!p) return '–'
    if (kind === 'time') return p.time ? fmtRest(p.time) : '–'
    if (kind === 'reps') return p.reps != null ? `${p.reps}` : '–'
    return p.weight != null || p.reps != null ? `${fmtNum(p.weight ?? 0)}kg × ${p.reps ?? 0}` : '–'
  }

  const toggleDone = (i: number) => {
    const s = ex.sets[i]
    const p = prev[i]
    if (s.done) return setAt(i, { done: false })
    const filled: Partial<SetEntry> = { done: true }
    if (kind === 'weight' && s.weight == null) filled.weight = p?.weight ?? 0
    if (kind !== 'time' && s.reps == null) filled.reps = p?.reps ?? 0
    if (kind === 'time' && s.time == null) filled.time = p?.time ?? 0
    setAt(i, filled)
    if (ex.restSec) onSetDone?.(ex.restSec)
  }

  const exActions: SheetAction[] = [
    { label: 'Exercise history', onClick: () => nav.push({ kind: 'exercise', id: ex.exerciseId }), icon: <Icon.chart size={18} /> },
    { label: 'Replace exercise', onClick: onReplace, icon: <Icon.copy size={18} /> },
    { label: 'Move up', onClick: () => onMove(-1), icon: <Icon.up size={18} /> },
    { label: 'Move down', onClick: () => onMove(1), icon: <Icon.down size={18} /> },
    { label: 'Remove exercise', onClick: onRemove, danger: true, icon: <Icon.trash size={18} /> },
  ]

  return (
    <section className="ex-block">
      <div className="ex-block-head">
        <button className="ex-title-btn" onClick={() => nav.push({ kind: 'exercise', id: ex.exerciseId })}>
          <ExerciseAvatar name={info.name} muscle={info.muscle} size={40} />
          <span className="ex-title">{info.name}</span>
        </button>
        <button className="icon-btn" onClick={() => setMenu('ex')} aria-label="Exercise options">
          <Icon.more />
        </button>
      </div>

      {showNote && (
        <textarea
          className="note-input"
          placeholder="Add notes here..."
          value={ex.notes}
          rows={1}
          onChange={(e) => onChange({ ...ex, notes: e.target.value })}
        />
      )}

      <div className="chip-row">
        <button className="chip" onClick={() => setMenu('rest')}>
          <Icon.timer size={16} /> Rest: {fmtRest(ex.restSec)}
        </button>
        {!showNote && (
          <button className="chip" onClick={() => setShowNote(true)}>
            <Icon.note size={16} /> Note
          </button>
        )}
      </div>

      <div className={'set-grid ' + mode}>
        <div className="set-h">SET</div>
        <div className="set-h">PREVIOUS</div>
        {kind === 'weight' && <div className="set-h">KG</div>}
        {kind !== 'time' ? <div className={'set-h' + (kind === 'reps' ? ' span2' : '')}>REPS</div> : <div className="set-h span2">SECONDS</div>}
        {mode === 'live' ? (
          <div className="set-h">
            <Icon.check size={18} />
          </div>
        ) : (
          <div className="set-h" />
        )}

        {ex.sets.map((s, i) => {
          const p = prev[i]
          const rowCls = 'set-row' + (s.done ? ' done' : '')
          return (
            <div className={rowCls} key={i} style={{ display: 'contents' }}>
              <button className={'set-num t-' + s.type} onClick={() => setMenu(i)}>
                {labels[i]}
              </button>
              <button
                className="set-prev"
                onClick={() => p && setAt(i, { weight: p.weight, reps: p.reps, time: p.time })}
                title="Tap to copy"
              >
                {prevLabel(p)}
              </button>
              {kind === 'weight' && (
                <NumInput value={s.weight} placeholder={p?.weight != null ? fmtNum(p.weight) : '0'} onChange={(v) => setAt(i, { weight: v })} decimal />
              )}
              {kind !== 'time' ? (
                <NumInput
                  className={kind === 'reps' ? 'span2' : ''}
                  value={s.reps}
                  placeholder={p?.reps != null ? String(p.reps) : '0'}
                  onChange={(v) => setAt(i, { reps: v })}
                />
              ) : (
                <NumInput className="span2" value={s.time} placeholder={p?.time != null ? String(p.time) : '0'} onChange={(v) => setAt(i, { time: v })} />
              )}
              {mode === 'live' ? (
                <button className={'set-check' + (s.done ? ' on' : '')} onClick={() => toggleDone(i)} aria-label="Complete set">
                  <Icon.check size={20} />
                </button>
              ) : (
                <button className="set-del" onClick={() => onChange({ ...ex, sets: ex.sets.filter((_, j) => j !== i) })} aria-label="Delete set">
                  <Icon.close size={16} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button
        className="btn btn-soft btn-block"
        onClick={() => {
          const last = ex.sets[ex.sets.length - 1]
          onChange({ ...ex, sets: [...ex.sets, { ...emptySet(), weight: last?.weight ?? null, reps: last?.reps ?? null, time: last?.time ?? null }] })
        }}
      >
        <Icon.plus size={18} /> Add Set
      </button>

      {menu === 'ex' && <ActionSheet title={info.name} actions={exActions} onClose={() => setMenu(null)} />}
      {menu === 'rest' && (
        <ActionSheet
          title="Rest timer"
          actions={REST_OPTIONS.map((sec) => ({ label: fmtRest(sec) + (sec === ex.restSec ? '  ✓' : ''), onClick: () => onChange({ ...ex, restSec: sec }) }))}
          onClose={() => setMenu(null)}
        />
      )}
      {typeof menu === 'number' && (
        <ActionSheet
          title={`Set ${menu + 1}`}
          actions={[
            { label: 'Normal set', onClick: () => setAt(menu, { type: 'normal' }) },
            { label: 'Warm up set (W)', onClick: () => setAt(menu, { type: 'warmup' }) },
            { label: 'Drop set (D)', onClick: () => setAt(menu, { type: 'drop' }) },
            { label: 'Failure set (F)', onClick: () => setAt(menu, { type: 'failure' }) },
            { label: 'Delete set', danger: true, onClick: () => onChange({ ...ex, sets: ex.sets.filter((_, j) => j !== menu) }) },
          ]}
          onClose={() => setMenu(null)}
        />
      )}
    </section>
  )
}

function NumInput({
  value,
  placeholder,
  onChange,
  decimal,
  className = '',
}: {
  value: number | null
  placeholder: string
  onChange: (v: number | null) => void
  decimal?: boolean
  className?: string
}) {
  const [text, setText] = useState<string | null>(null)
  const shown = text ?? (value == null ? '' : String(value))
  return (
    <input
      className={'set-input ' + className}
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={shown}
      placeholder={placeholder}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setText(e.target.value)
        onChange(parseNum(e.target.value))
      }}
      onBlur={() => setText(null)}
    />
  )
}
