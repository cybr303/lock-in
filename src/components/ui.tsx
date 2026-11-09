import { createContext, useContext, useEffect, type ReactNode } from 'react'
import type { Muscle } from '../types'

// ---------- Navigation ----------

export type Screen =
  | { kind: 'routine-edit'; routineId?: string; folder?: string }
  | { kind: 'exercise'; id: string }
  | { kind: 'workout'; id: string }
  | { kind: 'calendar' }
  | { kind: 'exercises' }
  | { kind: 'stats' }
  | { kind: 'settings' }
  | { kind: 'programs' }

export interface Nav {
  push: (s: Screen) => void
  pop: () => void
  openActive: () => void
}

export const NavContext = createContext<Nav>({ push: () => {}, pop: () => {}, openActive: () => {} })
export const useNav = () => useContext(NavContext)

// ---------- Icons ----------

const I = ({ d, size = 22, fill = false }: { d: string; size?: number; fill?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
)

export const Icon = {
  home: (p: { size?: number }) => <I {...p} d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  dumbbell: (p: { size?: number }) => <I {...p} d="M6 7v10M3 9.5v5M18 7v10M21 9.5v5M6 12h12" />,
  user: (p: { size?: number }) => <I {...p} d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9c0-4 3.6-6 8-6s8 2 8 6" />,
  plus: (p: { size?: number }) => <I {...p} d="M12 5v14M5 12h14" />,
  back: (p: { size?: number }) => <I {...p} d="M19 12H5m6-7-7 7 7 7" />,
  chevronDown: (p: { size?: number }) => <I {...p} d="m6 9 6 6 6-6" />,
  chevronRight: (p: { size?: number }) => <I {...p} d="m9 6 6 6-6 6" />,
  more: (p: { size?: number }) => <I {...p} fill d="M5 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />,
  check: (p: { size?: number }) => <I {...p} d="m5 12.5 4.5 4.5L19 7.5" />,
  timer: (p: { size?: number }) => <I {...p} d="M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm0-12v4l2.5 2.5M9 2h6" />,
  search: (p: { size?: number }) => <I {...p} d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.35-4.35" />,
  close: (p: { size?: number }) => <I {...p} d="M18 6 6 18M6 6l12 12" />,
  calendar: (p: { size?: number }) => <I {...p} d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm0 4h16M8 2v4m8-4v4" />,
  chart: (p: { size?: number }) => <I {...p} d="M3 3v18h18M7 15l4-4 3 3 6-6" />,
  list: (p: { size?: number }) => <I {...p} d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  gear: (p: { size?: number }) => <I {...p} d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.3 7.3 0 0 0-2-1.2L14.5 3h-4l-.4 2.6a7.3 7.3 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.3 7.3 0 0 0 2 1.2l.4 2.6h4l.4-2.6a7.3 7.3 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" />,
  trash: (p: { size?: number }) => <I {...p} d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  edit: (p: { size?: number }) => <I {...p} d="M4 20h4L19 9l-4-4L4 16zm9-13 4 4" />,
  copy: (p: { size?: number }) => <I {...p} d="M9 9h11v11H9zM5 15H4V4h11v1" />,
  flame: (p: { size?: number }) => <I {...p} d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4 3 7 7 7z" />,
  trophy: (p: { size?: number }) => <I {...p} d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3m10-5h3v2a3 3 0 0 1-3 3" />,
  folder: (p: { size?: number }) => <I {...p} d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />,
  up: (p: { size?: number }) => <I {...p} d="m6 15 6-6 6 6" />,
  down: (p: { size?: number }) => <I {...p} d="m6 9 6 6 6-6" />,
  note: (p: { size?: number }) => <I {...p} d="M5 4h10l4 4v12H5zm9 0v5h5M8 13h8M8 17h5" />,
}

// ---------- Layout ----------

export function Header({ title, left, right, center }: { title?: ReactNode; left?: ReactNode; right?: ReactNode; center?: boolean }) {
  return (
    <header className={'hdr' + (center ? ' hdr-center' : '')}>
      <div className="hdr-left">{left}</div>
      {title != null && <h1 className="hdr-title">{title}</h1>}
      <div className="hdr-right">{right}</div>
    </header>
  )
}

export function BackButton() {
  const nav = useNav()
  return (
    <button className="icon-btn" onClick={nav.pop} aria-label="Back">
      <Icon.back />
    </button>
  )
}

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={'page ' + className}>{children}</div>
}

// ---------- Action sheet ----------

export interface SheetAction {
  label: string
  onClick: () => void
  danger?: boolean
  icon?: ReactNode
}

export function ActionSheet({ title, actions, onClose }: { title?: string; actions: SheetAction[]; onClose: () => void }) {
  useEscape(onClose)
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog">
        {title && <div className="sheet-title">{title}</div>}
        {actions.map((a) => (
          <button
            key={a.label}
            className={'sheet-item' + (a.danger ? ' danger' : '')}
            onClick={() => {
              onClose()
              a.onClick()
            }}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
        <button className="sheet-item sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEscape(onClose)
  return (
    <div className="backdrop backdrop-center" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
        {children}
      </div>
    </div>
  )
}

export function useEscape(fn: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && fn()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [fn])
}

// ---------- Exercise avatar ----------

const MUSCLE_HUE: Record<Muscle, number> = {
  Chest: 0, 'Upper Back': 200, Lats: 215, 'Lower Back': 230, Shoulders: 30, Biceps: 280, Triceps: 300, Forearms: 320,
  Quadriceps: 140, Hamstrings: 160, Glutes: 175, Calves: 120, Abs: 50, Cardio: 350, 'Full Body': 260, Other: 0,
}

export function ExerciseAvatar({ name, muscle, size = 44 }: { name: string; muscle: Muscle; size?: number }) {
  const initials = name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  const hue = MUSCLE_HUE[muscle]
  const sat = muscle === 'Other' ? 0 : 70
  return (
    <div
      className="ex-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `hsl(${hue} ${sat}% 18%)`,
        color: `hsl(${hue} ${sat}% 72%)`,
        borderColor: `hsl(${hue} ${sat}% 30%)`,
      }}
    >
      {initials}
    </div>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      {children}
    </div>
  )
}
