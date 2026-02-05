import { pickDeterministic } from '../../../utils/analysis/common';
import type { TrendCopy } from './exerciseTrendUiCopyNew';

export const getOverloadCopy = (seedBase: string): TrendCopy => {
  const title = pickDeterministic(`${seedBase}|title`, [
    'Getting stronger',
    'Beast mode',
    'On fire',
    'Making gains',
    'Leveling up',
    'Momentum unlocked',
    'Dialed in',
    'Power building',
    'Trend looks great',
    'Quietly crushing it',
    'Strength stacking',
    'Progress engine',
    'Climbing phase',
  ] as const);

  const description = pickDeterministic(`${seedBase}|desc`, [
    'Nice! Your rep capacity is climbing. Every little bit counts!',
    'Solid work! Strength is trending upward. Keep that momentum.',
    'Good progress! Those reps are adding up nicely.',
    'Looking good! The strength train is chugging along.',
    "Gains are happening - keep doing what you're doing.",
    "Strength is building! Don't mess with success.",
    "You're making progress! The trend is your friend.",
    'Hello, improvement! Nice to see you moving forward.',
    'Rep performance is improving! Keep that energy.',
    'Strength is looking good! The consistency is paying off.',
    'Clean sessions and steady progress. This is what sustainable looks like.',
    "You're building something real here. Keep stacking quality work.",
    'Upward drift confirmed. Stay patient and keep the form tight.',
    'This is the good kind of boring: consistent work, consistent results.',
  ] as const);

  const subtext = pickDeterministic(`${seedBase}|sub`, [
    'Technique still matters, champ. Control those reps and show off your form.',
    'Progress is progress! Don\'t get sloppy - small beats big every time.',
    'Keep this momentum. Add reps slowly or make those eccentrics count.',
    'Nice work! If the bar feels light, maybe it\'s time for the next jump.',
    'Stay consistent! Master this range before getting too ambitious.',
    'Current approach is working! Maybe add a back-off set for extra credit.',
    "Once you own this, we can play with harder variations. Don't rush the process.",
    'Spread the love! Add reps across all sets, not just the hero first set.',
    'Small gains need big recovery. Sleep well and eat like you mean it.',
    "Small jumps, big results. Don't let ego get ahead of reality.",
    "If this feels too easy, either you're holding back or it's time to level up.",
    "Recovery is your secret weapon. Don't sabotage with poor sleep.",
    'Film yourself improving. Future you will appreciate the journey.',
    'Hold the standard: same setup, same depth, cleaner reps. Let strength accumulate.',
    'Add difficulty with intent: +1 rep, +1 set, or a small load jump — not all at once.',
    'Keep sessions repeatable. The goal is momentum, not chaos.',
    "Ride the wave: keep the effort consistent and don't force max attempts.",
  ] as const);

  return { title, description, subtext };
};
