export const EXERCISE_ALIASES: Record<string, string[]> = {
  // Face pulls
  'face pull': ['Face Pull', 'Cable Face Pull'],
  'face pull cable': ['Face Pull', 'Cable Face Pull'],

  // Triceps
  'triceps pushdown': ['Triceps Pushdown', 'Tricep Pushdown (Cable - Straight Bar)', 'Tricep Pushdown'],
  'tricep pushdown': ['Triceps Pushdown', 'Tricep Pushdown'],
  'triceps pushdown cable straight bar': ['Triceps Pushdown', 'Tricep Pushdown (Cable - Straight Bar)'],
  'rope pushdown': ['Tricep Pushdown (Cable - Rope)', 'Rope Pushdown'],
  'tricep rope pushdown': ['Tricep Pushdown (Cable - Rope)', 'Rope Pushdown'],
  'cable tricep pushdown': ['Triceps Pushdown', 'Tricep Pushdown'],
  'overhead triceps extension': ['Overhead Triceps Extension', 'Tricep Extension'],
  'skull crushers': ['Skull Crusher (Barbell)', 'Skullcrusher'],
  'skullcrusher': ['Skull Crusher (Barbell)', 'Skullcrusher'],

  // Dips
  'weighted dips': ['Chest Dip (Weighted)', 'Dip', 'Weighted Dip'],
  'dips': ['Dip', 'Chest Dip'],
  'chest dip': ['Chest Dip', 'Dip'],
  'tricep dips': ['Tricep Dip', 'Dip'],

  // Lat pulldowns
  'lat pulldown': ['Lat Pulldown (Cable)', 'Lat Pulldown', 'Cable Lat Pulldown'],
  'lat pull down': ['Lat Pulldown (Cable)', 'Lat Pulldown'],
  'lat pull in': ['Lat Pulldown (Cable)', 'Lat Pulldown'],
  'wide grip lat pulldown': ['Wide Grip Lat Pulldown', 'Lat Pulldown'],
  'close grip lat pulldown': ['Close Grip Lat Pulldown', 'Lat Pulldown'],

  // Chest flys
  'incline cable chest fly': ['Seated Chest Flys (Cable)', 'Incline Cable Fly', 'Cable Fly'],
  'cable fly': ['Cable Fly', 'Seated Chest Flys (Cable)'],
  'chest fly': ['Chest Fly (Dumbbell)', 'Dumbbell Fly', 'Fly'],
  'pec fly': ['Pec Deck', 'Chest Fly Machine', 'Machine Fly'],
  'pec deck': ['Pec Deck', 'Machine Fly'],

  // Curls - comprehensive coverage
  'ez bar curl': ['EZ Bar Biceps Curl', 'EZ Barbell Curl', 'Curl'],
  'ez bar bicep curl': ['EZ Bar Biceps Curl', 'EZ Barbell Curl'],
  'ez bar biceps curl': ['EZ Bar Biceps Curl', 'EZ Barbell Curl'],
  'ez barbell curl': ['EZ Barbell Curl', 'EZ Bar Biceps Curl'],
  'ez curl': ['EZ Bar Biceps Curl', 'EZ Barbell Curl', 'Curl'],
  'barbell curl': ['Barbell Curl', 'Biceps Curl (Barbell)'],
  'bicep curl': ['Bicep Curl (Dumbbell)', 'Dumbbell Bicep Curl', 'Biceps Curl'],
  'biceps curl': ['Biceps Curl', 'Bicep Curl (Dumbbell)'],
  'dumbbell curl': ['Bicep Curl (Dumbbell)', 'Dumbbell Bicep Curl', 'Dumbbell Curl'],
  'hammer curl': ['Hammer Curl (Dumbbell)', 'Dumbbell Hammer Curl', 'Hammer Curl'],
  'preacher curl': ['Preacher Curl (Dumbbell)', 'EZ Barbell Preacher Curl', 'Preacher Curl'],
  'cable curl': ['Cable Curl', 'Biceps Curl (Cable)'],
  'incline curl': ['Incline Dumbbell Curl', 'Incline Curl'],
  'concentration curl': ['Concentration Curl', 'Dumbbell Concentration Curl'],

  // Planks
  'plank': ['Plank', 'Front Plank'],
  'advanced plank': ['Plank', 'Front Plank'],
  'front plank': ['Front Plank', 'Plank'],
  'side plank': ['Side Plank'],
  'reverse plank': ['Reverse Plank', 'Reverse plank'],
  'weighted plank': ['Weighted Front Plank', 'Plank'],

  // Jump rope
  'jump rope': ['Jump Rope'],
  'jump rope timed': ['Jump Rope'],
  'skipping': ['Jump Rope', 'Bodyweight Skipping (male)'],
  'skipping rope': ['Jump Rope'],
  'rope jumping': ['Jump Rope'],

  // Reverse fly / Rear delt
  'reverse fly': ['Dumbbell Reverse Fly', 'Rear Fly', 'Reverse Fly'],
  'reverse fly dumbbell': ['Rear Delt Reverse Fly (Dumbbell)', 'Dumbbell Reverse Fly', 'Dumbbell Rear Delt Fly'],
  'dumbbell reverse fly': ['Dumbbell Reverse Fly', 'Rear Delt Reverse Fly (Dumbbell)'],
  'rear delt fly': ['Dumbbell Rear Delt Fly', 'Rear Delt Reverse Fly (Dumbbell)', 'Rear Fly'],
  'rear delt reverse fly': ['Rear Delt Reverse Fly (Dumbbell)', 'Dumbbell Rear Delt Fly'],
  'rear delt fly dumbbell': ['Dumbbell Rear Delt Fly', 'Rear Delt Reverse Fly (Dumbbell)'],
  'rear fly': ['Rear Fly', 'Dumbbell Rear Delt Fly'],
  'reverse fly cable': ['Rear Delt Reverse Fly (Cable)', 'Cable Standing Cross-over High Reverse Fly'],
  'rear delt cable fly': ['Rear Delt Reverse Fly (Cable)', 'Cable Seated Rear Delt Fly with Chest Support'],
  'rear lateral raise': ['Rear Lateral Raise', 'Incline Rear Lateral Raise'],

  // Toe touches / Flexibility
  'straight leg toe touch': ['Toe Touch', 'Standing Toe Touch', 'Hamstring Stretch'],
  'toe touch': ['Toe Touch', 'Standing Toe Touch'],

  // Rows
  'cable row': ['Seated Cable Row', 'Cable Row'],
  'seated row': ['Seated Cable Row', 'Seated Row (Machine)'],
  'bent over row': ['Bent Over Row (Barbell)', 'Barbell Row'],
  'barbell row': ['Bent Over Row (Barbell)', 'Barbell Row'],
  'dumbbell row': ['Dumbbell Row', 'Bent Over Row (Dumbbell)'],
  't bar row': ['T-Bar Row', 'T Bar Row'],
  'pendlay row': ['Pendlay Row', 'Bent Over Row (Barbell)'],

  // Bench press variations
  'bench press': ['Bench Press (Barbell)', 'Barbell Bench Press', 'Bench Press'],
  'barbell bench press': ['Bench Press (Barbell)', 'Barbell Bench Press'],
  'incline bench press': ['Incline Bench Press (Barbell)', 'Incline Barbell Bench Press'],
  'decline bench press': ['Decline Bench Press (Barbell)', 'Decline Barbell Bench Press'],
  'dumbbell bench press': ['Dumbbell Bench Press', 'Bench Press (Dumbbell)'],
  'incline dumbbell press': ['Incline Dumbbell Bench Press', 'Incline Bench Press (Dumbbell)'],
  'close grip bench press': ['Close Grip Bench Press', 'Close-Grip Bench Press'],

  // Shoulder press
  'shoulder press': ['Shoulder Press (Dumbbell)', 'Overhead Press'],
  'overhead press': ['Overhead Press (Barbell)', 'Overhead Press'],
  'military press': ['Overhead Press (Barbell)', 'Military Press'],
  'dumbbell shoulder press': ['Shoulder Press (Dumbbell)', 'Dumbbell Shoulder Press'],
  'seated shoulder press': ['Seated Shoulder Press (Dumbbell)', 'Seated Overhead Press'],
  'arnold press': ['Arnold Press', 'Arnold Dumbbell Press'],

  // Lateral raises
  'lateral raise': ['Lateral Raise (Dumbbell)', 'Dumbbell Lateral Raise', 'Side Raise'],
  'side raise': ['Lateral Raise (Dumbbell)', 'Side Raise'],
  'dumbbell lateral raise': ['Lateral Raise (Dumbbell)', 'Dumbbell Lateral Raise'],
  'cable lateral raise': ['Cable Lateral Raise', 'Lateral Raise (Cable)'],
  'front raise': ['Front Raise (Dumbbell)', 'Dumbbell Front Raise'],

  // Squats
  'squat': ['Squat (Barbell)', 'Barbell Squat', 'Squat'],
  'barbell squat': ['Squat (Barbell)', 'Barbell Squat'],
  'back squat': ['Squat (Barbell)', 'Barbell Back Squat'],
  'front squat': ['Front Squat (Barbell)', 'Barbell Front Squat'],
  'goblet squat': ['Goblet Squat', 'Kettlebell Goblet Squat'],
  'leg press': ['Leg Press', 'Leg Press (Machine)'],
  'hack squat': ['Hack Squat', 'Hack Squat (Machine)'],
  'bulgarian split squat': ['Bulgarian Split Squat', 'Split Squat'],

  // Deadlifts
  'deadlift': ['Deadlift (Barbell)', 'Barbell Deadlift', 'Conventional Deadlift'],
  'barbell deadlift': ['Deadlift (Barbell)', 'Barbell Deadlift'],
  'sumo deadlift': ['Sumo Deadlift (Barbell)', 'Sumo Deadlift'],
  'romanian deadlift': ['Romanian Deadlift (Barbell)', 'RDL', 'Romanian Deadlift'],
  'rdl': ['Romanian Deadlift (Barbell)', 'Romanian Deadlift'],
  'stiff leg deadlift': ['Stiff Leg Deadlift (Barbell)', 'Stiff Legged Deadlift'],

  // Lunges
  'lunge': ['Lunge (Dumbbell)', 'Walking Lunge', 'Lunge'],
  'walking lunge': ['Walking Lunge (Dumbbell)', 'Walking Lunge'],
  'reverse lunge': ['Reverse Lunge (Dumbbell)', 'Reverse Lunge'],
  'dumbbell lunge': ['Lunge (Dumbbell)', 'Dumbbell Lunge'],

  // Leg curls / extensions
  'leg curl': ['Leg Curl (Machine)', 'Lying Leg Curl', 'Seated Leg Curl'],
  'lying leg curl': ['Lying Leg Curl (Machine)', 'Lying Leg Curl'],
  'seated leg curl': ['Seated Leg Curl (Machine)', 'Seated Leg Curl'],
  'leg extension': ['Leg Extension (Machine)', 'Leg Extension'],
  'hamstring curl': ['Leg Curl (Machine)', 'Lying Leg Curl'],

  // Pull-ups / Chin-ups
  'pullup': ['Pull Up', 'Pull-Up', 'Pullup'],
  'pull up': ['Pull Up', 'Pull-Up'],
  'chinup': ['Chin Up', 'Chin-Up', 'Chinup'],
  'chin up': ['Chin Up', 'Chin-Up'],
  'weighted pullup': ['Pull Up (Weighted)', 'Weighted Pull Up'],
  'weighted chinup': ['Chin Up (Weighted)', 'Weighted Chin Up'],
  'lat pullup': ['Pull Up', 'Wide Grip Pull Up'],

  // Shrugs
  'shrug': ['Shrug (Dumbbell)', 'Dumbbell Shrug', 'Barbell Shrug'],
  'dumbbell shrug': ['Shrug (Dumbbell)', 'Dumbbell Shrug'],
  'barbell shrug': ['Shrug (Barbell)', 'Barbell Shrug'],

  // Calf raises
  'calf raise': ['Calf Raise (Standing)', 'Standing Calf Raise', 'Calf Raise'],
  'standing calf raise': ['Standing Calf Raise', 'Calf Raise (Standing)'],
  'seated calf raise': ['Seated Calf Raise', 'Seated Calf Raise (Machine)'],

  // Ab exercises
  'crunch': ['Crunch', 'Ab Crunch'],
  'ab crunch': ['Crunch', 'Ab Crunch'],
  'sit up': ['Sit Up', 'Situp'],
  'situp': ['Sit Up', 'Situp'],
  'leg raise': ['Leg Raise', 'Hanging Leg Raise', 'Lying Leg Raise'],
  'hanging leg raise': ['Hanging Leg Raise'],
  'cable crunch': ['Cable Crunch', 'Kneeling Cable Crunch'],
  'ab rollout': ['Ab Wheel Rollout', 'Ab Rollout'],
  'ab wheel': ['Ab Wheel Rollout', 'Ab Wheel'],
  'russian twist': ['Russian Twist', 'Seated Russian Twist'],
  'mountain climber': ['Mountain Climber', 'Mountain Climbers'],

  // Push-ups
  'pushup': ['Push Up', 'Push-Up', 'Pushup'],
  'push up': ['Push Up', 'Push-Up'],
  'diamond pushup': ['Diamond Push Up', 'Close Grip Push Up'],
  'incline pushup': ['Incline Push Up', 'Incline Push-Up'],
  'decline pushup': ['Decline Push Up', 'Decline Push-Up'],
  'wide pushup': ['Wide Grip Push Up', 'Wide Push-Up'],
};

export const STRONG_EXERCISE_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(EXERCISE_ALIASES).map(([k, v]) => [k, v[0]])
);
