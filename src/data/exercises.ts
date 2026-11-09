import type { Exercise, Muscle, Equipment } from '../types'

const e = (id: string, name: string, muscle: Muscle, equipment: Equipment, kind: Exercise['kind'] = 'weight'): Exercise => ({
  id,
  name,
  muscle,
  equipment,
  kind,
})

export const MUSCLES: Muscle[] = [
  'Chest', 'Upper Back', 'Lats', 'Lower Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
  'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Cardio', 'Full Body', 'Other',
]

export const EQUIPMENT: Equipment[] = [
  'Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Kettlebell', 'Band', 'Other',
]

export const BUILTIN_EXERCISES: Exercise[] = [
  // Chest
  e('bench-bb', 'Bench Press (Barbell)', 'Chest', 'Barbell'),
  e('bench-db', 'Bench Press (Dumbbell)', 'Chest', 'Dumbbell'),
  e('incline-bb', 'Incline Bench Press (Barbell)', 'Chest', 'Barbell'),
  e('incline-db', 'Incline Bench Press (Dumbbell)', 'Chest', 'Dumbbell'),
  e('chest-press-m', 'Chest Press (Machine)', 'Chest', 'Machine'),
  e('pec-deck', 'Pec Deck Fly (Machine)', 'Chest', 'Machine'),
  e('cable-fly', 'Cable Fly', 'Chest', 'Cable'),
  e('db-fly', 'Chest Fly (Dumbbell)', 'Chest', 'Dumbbell'),
  e('dips', 'Chest Dip', 'Chest', 'Bodyweight', 'reps'),
  e('pushup', 'Push Up', 'Chest', 'Bodyweight', 'reps'),
  // Back
  e('deadlift-bb', 'Deadlift (Barbell)', 'Lower Back', 'Barbell'),
  e('lat-pulldown', 'Lat Pulldown (Cable)', 'Lats', 'Cable'),
  e('pullup', 'Pull Up', 'Lats', 'Bodyweight', 'reps'),
  e('chinup', 'Chin Up', 'Lats', 'Bodyweight', 'reps'),
  e('row-bb', 'Bent Over Row (Barbell)', 'Upper Back', 'Barbell'),
  e('row-db', 'Single Arm Row (Dumbbell)', 'Upper Back', 'Dumbbell'),
  e('tbar-row', 'T-Bar Row', 'Upper Back', 'Machine'),
  e('seated-row', 'Seated Cable Row', 'Upper Back', 'Cable'),
  e('chest-row-m', 'Chest Supported Row (Machine)', 'Upper Back', 'Machine'),
  e('straight-arm', 'Straight Arm Pulldown (Cable)', 'Lats', 'Cable'),
  e('back-ext', 'Back Extension', 'Lower Back', 'Bodyweight', 'reps'),
  e('shrug-db', 'Shrug (Dumbbell)', 'Upper Back', 'Dumbbell'),
  // Shoulders
  e('ohp-bb', 'Overhead Press (Barbell)', 'Shoulders', 'Barbell'),
  e('ohp-db', 'Shoulder Press (Dumbbell)', 'Shoulders', 'Dumbbell'),
  e('shoulder-press-m', 'Shoulder Press (Machine)', 'Shoulders', 'Machine'),
  e('lat-raise-db', 'Lateral Raise (Dumbbell)', 'Shoulders', 'Dumbbell'),
  e('lat-raise-cable', 'Lateral Raise (Cable)', 'Shoulders', 'Cable'),
  e('rear-delt-fly', 'Reverse Fly (Machine)', 'Shoulders', 'Machine'),
  e('face-pull', 'Face Pull (Cable)', 'Shoulders', 'Cable'),
  // Arms
  e('curl-bb', 'Bicep Curl (Barbell)', 'Biceps', 'Barbell'),
  e('curl-db', 'Bicep Curl (Dumbbell)', 'Biceps', 'Dumbbell'),
  e('hammer-curl', 'Hammer Curl (Dumbbell)', 'Biceps', 'Dumbbell'),
  e('preacher-m', 'Preacher Curl (Machine)', 'Biceps', 'Machine'),
  e('cable-curl', 'Bicep Curl (Cable)', 'Biceps', 'Cable'),
  e('reverse-curl', 'Reverse Curl (Barbell)', 'Forearms', 'Barbell'),
  e('tri-pushdown', 'Triceps Pushdown (Cable)', 'Triceps', 'Cable'),
  e('tri-overhead', 'Overhead Triceps Extension (Cable)', 'Triceps', 'Cable'),
  e('skullcrusher', 'Skullcrusher (Barbell)', 'Triceps', 'Barbell'),
  e('close-grip', 'Close Grip Bench Press', 'Triceps', 'Barbell'),
  e('wrist-curl', 'Wrist Curl (Dumbbell)', 'Forearms', 'Dumbbell'),
  // Legs
  e('squat-bb', 'Squat (Barbell)', 'Quadriceps', 'Barbell'),
  e('front-squat', 'Front Squat (Barbell)', 'Quadriceps', 'Barbell'),
  e('hack-squat', 'Hack Squat (Machine)', 'Quadriceps', 'Machine'),
  e('pendulum', 'Pendulum Squat (Machine)', 'Quadriceps', 'Machine'),
  e('leg-press', 'Leg Press (Machine)', 'Quadriceps', 'Machine'),
  e('leg-ext', 'Leg Extension (Machine)', 'Quadriceps', 'Machine'),
  e('bulgarian', 'Bulgarian Split Squat (Dumbbell)', 'Quadriceps', 'Dumbbell'),
  e('lunge-db', 'Walking Lunge (Dumbbell)', 'Quadriceps', 'Dumbbell'),
  e('goblet', 'Goblet Squat (Kettlebell)', 'Quadriceps', 'Kettlebell'),
  e('rdl-bb', 'Romanian Deadlift (Barbell)', 'Hamstrings', 'Barbell'),
  e('rdl-db', 'Romanian Deadlift (Dumbbell)', 'Hamstrings', 'Dumbbell'),
  e('lying-curl', 'Lying Leg Curl (Machine)', 'Hamstrings', 'Machine'),
  e('seated-curl', 'Seated Leg Curl (Machine)', 'Hamstrings', 'Machine'),
  e('hip-thrust', 'Hip Thrust (Barbell)', 'Glutes', 'Barbell'),
  e('glute-kick', 'Glute Kickback (Cable)', 'Glutes', 'Cable'),
  e('hip-abduct', 'Hip Abduction (Machine)', 'Glutes', 'Machine'),
  e('calf-standing', 'Standing Calf Raise (Machine)', 'Calves', 'Machine'),
  e('calf-db', 'Standing Calf Raise (Dumbbell)', 'Calves', 'Dumbbell'),
  e('calf-seated', 'Seated Calf Raise (Machine)', 'Calves', 'Machine'),
  // Core
  e('crunch-cable', 'Cable Crunch', 'Abs', 'Cable'),
  e('hanging-leg', 'Hanging Leg Raise', 'Abs', 'Bodyweight', 'reps'),
  e('plank', 'Plank', 'Abs', 'Bodyweight', 'time'),
  e('ab-wheel', 'Ab Wheel Rollout', 'Abs', 'Other', 'reps'),
  e('russian-twist', 'Russian Twist', 'Abs', 'Bodyweight', 'reps'),
  // Cardio / other
  e('treadmill', 'Treadmill', 'Cardio', 'Machine', 'time'),
  e('walking', 'Walking', 'Cardio', 'Other', 'time'),
  e('bike', 'Stationary Bike', 'Cardio', 'Machine', 'time'),
  e('rower', 'Rowing Machine', 'Cardio', 'Machine', 'time'),
  e('stairs', 'Stair Climber', 'Cardio', 'Machine', 'time'),
  e('jump-rope', 'Jump Rope', 'Cardio', 'Other', 'time'),
  e('warmup', 'Warm Up', 'Full Body', 'Other', 'time'),
  e('stretching', 'Stretching', 'Other', 'Other', 'time'),
  e('kb-swing', 'Kettlebell Swing', 'Full Body', 'Kettlebell'),
]
