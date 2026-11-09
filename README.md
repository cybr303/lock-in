# Lock In

A mobile-first workout logger you can install on your phone's home screen.

## Features

- **Log workouts live**: kg / reps / ✓ per set, with "previous" values from your last session (tap to copy), warm-up / drop / failure sets, per-exercise notes, and an automatic rest timer (−15 / +15 / Skip, with vibration and a beep when it ends).
- **Routines**: build your own, or add ready-made programs (Push/Pull/Legs, Upper/Lower, Full Body, Bodyweight) from **Explore** and edit them. You can change exercises, sets, target weights and reps, rest times and folders.
- **Update routine on finish**: when you save a workout you can push today's numbers back into the routine as the new targets.
- **History feed** with duration, volume and personal records (PRs), plus a workout detail view. You can edit, delete, or save any workout as a routine.
- **Profile**: weekly duration / volume / reps chart, week streak, calendar, per-muscle set counts, and per-exercise progress (estimated 1RM chart, best lifts, full history).
- **75+ built-in exercises**, and you can create custom ones.
- **Offline & private**: data is saved in your browser (localStorage). Export/import a JSON backup from Settings.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Put it on your phone

1. Push to `main` and turn on **Settings → Pages → Source: GitHub Actions** in the repo. The included workflow deploys to `https://<user>.github.io/lock-in/`.
2. Open that URL in Safari → Share → **Add to Home Screen**. It then runs full-screen like a native app.

Data lives on each device. Use **Profile → Settings → Export backup** before you switch phones or clear browser data.

## Code map

| Path | What |
| --- | --- |
| `src/store.ts` | App state, persistence, actions |
| `src/data/exercises.ts` | Exercise library |
| `src/data/templates.ts` | Premade programs |
| `src/screens/ActiveWorkout.tsx` | Live workout + rest timer + save |
| `src/screens/WorkoutTab.tsx` | Routines list, routine editor, program explorer |
| `src/screens/Home.tsx` | Feed + workout detail |
| `src/screens/Profile.tsx` | Profile, calendar, exercises, stats, settings |
| `src/components/ExerciseBlock.tsx` | The set table used in workouts and routines |
