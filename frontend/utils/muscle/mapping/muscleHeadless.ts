export const HEADLESS_MUSCLE_IDS = [
  'chest',
  'biceps',
  'triceps',
  'forearms',
  'shoulders',
  'traps',
  'lats',
  'lowerback',
  'abdominals',
  'obliques',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'adductors',
] as const;

export type HeadlessMuscleId = typeof HEADLESS_MUSCLE_IDS[number];

export const HEADLESS_MUSCLE_NAMES: Readonly<Record<HeadlessMuscleId, string>> = {
  chest: 'Chest',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  shoulders: 'Shoulders',
  traps: 'Traps',
  lats: 'Lats',
  lowerback: 'Lower Back',
  abdominals: 'Abs',
  obliques: 'Obliques',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  adductors: 'Adductors',
};

const roundToOneDecimal = (n: number): number => Math.round(n * 10) / 10;

/** Build radar chart series from headless volume map: order by value descending (highest first), rounded values. */
export function getHeadlessRadarSeries(headlessVolumes: Map<string, number>): { subject: string; value: number }[] {
  const raw = HEADLESS_MUSCLE_IDS.map((id) => ({
    subject: HEADLESS_MUSCLE_NAMES[id],
    value: roundToOneDecimal(headlessVolumes.get(id) ?? 0),
  }));
  return [...raw].sort((a, b) => b.value - a.value);
}
