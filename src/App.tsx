import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from './store'
import { Icon, NavContext, type Nav, type Screen } from './components/ui'
import { Home, WorkoutDetail } from './screens/Home'
import { Programs, RoutineEditor, WorkoutTab } from './screens/WorkoutTab'
import { CalendarScreen, ExerciseDetail, ExercisesScreen, Profile, SettingsScreen, StatsScreen } from './screens/Profile'
import { ActiveWorkout } from './screens/ActiveWorkout'
import { fmtElapsed } from './utils'

type Tab = 'home' | 'workout' | 'profile'

function renderScreen(s: Screen) {
  switch (s.kind) {
    case 'routine-edit':
      return <RoutineEditor routineId={s.routineId} />
    case 'exercise':
      return <ExerciseDetail id={s.id} />
    case 'workout':
      return <WorkoutDetail id={s.id} />
    case 'calendar':
      return <CalendarScreen />
    case 'exercises':
      return <ExercisesScreen />
    case 'stats':
      return <StatsScreen />
    case 'settings':
      return <SettingsScreen />
    case 'programs':
      return <Programs />
  }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('workout')
  const [stack, setStack] = useState<Screen[]>([])
  const [activeOpen, setActiveOpen] = useState(false)
  const active = useStore((s) => s.active)

  // close the overlay automatically once a workout is finished / discarded
  useEffect(() => {
    if (!active) setActiveOpen(false)
  }, [active])

  const nav: Nav = useMemo(
    () => ({
      push: (s) => setStack((st) => [...st, s]),
      pop: () => setStack((st) => st.slice(0, -1)),
      openActive: () => setActiveOpen(true),
    }),
    [],
  )

  const switchTab = useCallback((t: Tab) => {
    setTab(t)
    setStack([])
  }, [])

  const top = stack[stack.length - 1]

  return (
    <NavContext.Provider value={nav}>
      <div className="app">
        <main className="main">
          {top ? (
            <div key={stack.length} className="screen-enter">
              {renderScreen(top)}
            </div>
          ) : tab === 'home' ? (
            <Home />
          ) : tab === 'workout' ? (
            <WorkoutTab />
          ) : (
            <Profile />
          )}
        </main>

        {active && !activeOpen && <MiniWorkoutBar onOpen={() => setActiveOpen(true)} />}

        <nav className="tabbar">
          {(
            [
              ['home', 'Home', Icon.home],
              ['workout', 'Workout', Icon.dumbbell],
              ['profile', 'Profile', Icon.user],
            ] as const
          ).map(([id, label, Ic]) => (
            <button key={id} className={'tab' + (tab === id && !top ? ' on' : '')} onClick={() => switchTab(id)}>
              <Ic size={24} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {active && activeOpen && (
          <div className="overlay-enter">
            <ActiveWorkout onMinimize={() => setActiveOpen(false)} />
          </div>
        )}
      </div>
    </NavContext.Provider>
  )
}

function MiniWorkoutBar({ onOpen }: { onOpen: () => void }) {
  const active = useStore((s) => s.active)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!active) return null
  return (
    <button className="mini-bar" onClick={onOpen}>
      <span className="pulse" />
      <span className="grow left">
        <span className="bold">{active.name}</span>
        <span className="muted small"> · Workout in progress</span>
      </span>
      <span className="accent">{fmtElapsed(now - active.startedAt)}</span>
    </button>
  )
}
