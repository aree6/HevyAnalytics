import type { ElementType } from 'react';
import { AlertTriangle, Hourglass, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { ExerciseHistoryEntry, ExerciseStats } from '../../types';
import { analyzeExerciseTrendCore, ExerciseTrendStatus, MIN_SESSIONS_FOR_TREND } from '../../utils/analysis/exerciseTrend';
import { pickDeterministic } from '../../utils/analysis/messageVariations';
import { convertWeight, getStandardWeightIncrementKg } from '../../utils/format/units';
import type { ExerciseTrendMode, WeightUnit } from '../../utils/storage/localStorage';

const getLatestHistoryKey = (history: ExerciseHistoryEntry[]): string => {
  let maxTs = -Infinity;
  for (const h of history) {
    const ts = h.date?.getTime?.() ?? NaN;
    if (Number.isFinite(ts) && ts > maxTs) maxTs = ts;
  }
  return Number.isFinite(maxTs) ? String(maxTs) : '0';
};

export interface StatusResult {
  status: ExerciseTrendStatus;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: ElementType;
  title: string;
  description: string;
  subtext?: string;
  confidence?: 'low' | 'medium' | 'high';
  evidence?: string[];
  label: string;
  isBodyweightLike: boolean;
  prematurePr?: boolean;
}

export const analyzeExerciseTrend = (
  stats: ExerciseStats,
  weightUnit: WeightUnit,
  options?: { trendMode?: ExerciseTrendMode }
): StatusResult => {
  const core = analyzeExerciseTrendCore(stats, { trendMode: options?.trendMode });
  const seedBase = `${stats.name}|${core.status}|${getLatestHistoryKey(stats.history)}`;

  const progressRate = core.diffPct ? Math.abs(core.diffPct) : 0;
  const isRapidProgress = progressRate >= 3.0;
  const isModestProgress = progressRate >= 1.0 && progressRate < 3.0;
  const isSevereRegression = progressRate >= 5.0;
  const isModestRegression = progressRate >= 1.0 && progressRate < 5.0;

  if (core.status === 'new') {
    const sessionsCount = stats.history.length;
    const title = pickDeterministic(`${seedBase}|title`, [
      'Just getting started', 'First timer', 'Rookie numbers', 'Building your base', 'Day one energy',
      'Fresh slate', 'Warm-up phase', 'Foundation loading', 'Calibration mode', 'New chapter'
    ] as const);
    const description = pickDeterministic(`${seedBase}|desc`, [
      'First session in the books! We\'re figuring out what you\'ve got.',
      'Welcome to the party! Let\'s see what these muscles can do.',
      'Two sessions down! Starting to see your patterns emerge.',
      'Look at you, all consistent! The data gods are pleased.',
      `Building your profile. ${MIN_SESSIONS_FOR_TREND - sessionsCount} more sessions until we can read your mind.`,
      `Crunching the numbers. ${MIN_SESSIONS_FOR_TREND - sessionsCount} sessions to unlock the good stuff.`,
      'Early signs are promising! Keep showing up and we\'ll make magic happen.',
      'Ooh, I like what I\'m seeing! Don\'t get weird on me now.',
      `So close! ${MIN_SESSIONS_FOR_TREND - sessionsCount} session${MIN_SESSIONS_FOR_TREND - sessionsCount === 1 ? '' : 's'} to go before the real fun begins.`,
      `Almost there! ${MIN_SESSIONS_FOR_TREND - sessionsCount} session${MIN_SESSIONS_FOR_TREND - sessionsCount === 1 ? '' : 's'} left to impress me.`,
      `Keep logging - the algorithm gets hungry after ${MIN_SESSIONS_FOR_TREND}+ snacks.`,
      `Don\'t ghost me now! ${MIN_SESSIONS_FOR_TREND}+ sessions and I\'ll reveal your secrets.`,
      'Early data looks clean. Keep it consistent and we\'ll dial this in fast.',
      'We\'re still learning your baseline. Keep the setup consistent and let the trend form.',
      'Too early to judge - but the habit is forming. Stack a few more sessions.',
      'We\'re collecting signal. Same movement, same intent, better insights soon.'
    ] as const);
    const subtext = pickDeterministic(`${seedBase}|sub`, [
      'Perfect form first, champ. Pick something you can actually finish without crying.',
      'Form over ego, my friend. Choose a weight that won\'t make you question your life choices.',
      'Same setup, same reps, same greatness. Consistency is sexier than variety right now.',
      'Don\'t get creative yet. Stick to the script and we\'ll both be happier.',
      'Grip, stance, depth - make it your signature move. Film it for the highlights reel.',
      'Same setup every time. Your future self will thank present you for not being chaotic.',
      'Once we know your baseline, we can start the real training. Patience, young padawan.',
      'Master the basics first, then we can play with the fancy toys.',
      'No rush to be a hero. Learn the movement before you try to be Instagram famous.',
      'Walk before you run, lift before you ego-lift. The basics are boring for a reason.',
      'Keep the variables boring: same tempo, same depth, same rest. Let progress be the novelty.',
      'Treat every rep like practice. Skill first, strength next.',
      'Pick a repeatable load and own it. Consistency now buys freedom later.',
      'Stay honest with form. Clean reps today become PRs later.'
    ] as const);
    return {
      status: 'new',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      icon: Hourglass,
      title,
      description,
      subtext,
      confidence: core.confidence,
      evidence: core.evidence,
      label: 'baseline',
      isBodyweightLike: core.isBodyweightLike,
      prematurePr: core.prematurePr,
    };
  }

  if (core.status === 'stagnant') {
    const minReps = core.plateau?.minReps ?? 0;
    const maxReps = core.plateau?.maxReps ?? 0;
    const w = core.plateau?.weight ?? 0;
    const plateauWeight = convertWeight(w, weightUnit);
    const suggestedNext = convertWeight(w + getStandardWeightIncrementKg(weightUnit), weightUnit);
    const repRange = maxReps - minReps;
    const isWideRepRange = repRange >= 4;
    const isNarrowRepRange = repRange <= 1;
    const sessionsAtPlateau = Math.min(6, Math.max(1, stats.history.length));

    const title = pickDeterministic(`${seedBase}|title`, [
      'Stuck in neutral', 'Holding steady', 'Plateau city', 'Flatlined', 'Time for a shakeup',
      'Comfort zone detected', 'Same song, same verse', 'Cruise control', 'Pattern locked', 'Stability era'
    ] as const);

    const description = pickDeterministic(`${seedBase}|desc`, [
      `You\'ve been hovering between ${minReps}-${maxReps} reps for ${sessionsAtPlateau}+ sessions. Time to shake things up!`,
      `Stuck at ${minReps}-${maxReps} reps for ${sessionsAtPlateau}+ sessions. Your muscles need a new challenge.`,
      `Load is static at ${plateauWeight}${weightUnit} while reps vary. Let\'s break this pattern!`,
      `Both load (${plateauWeight}${weightUnit}) and reps (${minReps}-${maxReps}) are consistent. Your comfort zone is showing.`,
      `Rep performance is steady at ${maxReps}. Your body adapted and got comfortable.`,
      `Same old: ${minReps}-${maxReps} reps. Progress is taking a coffee break.`,
      `Strength is stable at ${plateauWeight}${weightUnit}. Time to introduce a new stimulus!`,
      `Consistent pattern: ${plateauWeight}${weightUnit} × ${minReps}-${maxReps}. Your muscles need variety.`,
      `Progress is steady but not growing. Time to spice things up!`,
      `Everything\'s consistent: ${plateauWeight}${weightUnit} × ${minReps}-${maxReps}. Let\'s mix it up!`,
      `You\'re repeating the same outcome: ${plateauWeight}${weightUnit} × ${minReps}-${maxReps}. Great control, now chase growth.`,
      `Strong and steady, but not climbing. Time to nudge the system with a new demand.`,
      `You\'ve stabilized at ${plateauWeight}${weightUnit}. Now it\'s time to earn the next level.`,
      `This is a true plateau: consistent output, limited change. Perfect moment for a small, strategic push.`
    ] as const);

    const subtext = pickDeterministic(`${seedBase}|sub`, [
      `Pick ${maxReps} reps and chase ${maxReps + 1} on ALL sets. No playing favorites with the first set only.`,
      `Next session: add 1 rep to your first set, then make the others match. Quality over speed, speed racer.`,
      `Standardize at ${maxReps} reps. Master it across all sets, then level up to ${suggestedNext}${weightUnit}.`,
      `Try ${suggestedNext}${weightUnit} next session. If form gets ugly, repeat current weight like a grown-up and add a rep.`,
      `Get fancy: pause reps, painfully slow eccentrics (3-4 seconds), or cut your rest periods in half.`,
      `Add an extra set (same reps) or channel your inner superhero with a weighted vest.`,
      `Double progression: repeat ${plateauWeight}${weightUnit} but add 1-2 reps across sets, then increase the weight.`,
      `If weight jumps feel scary, repeat ${plateauWeight}${weightUnit} and hunt for +1 rep like it\'s the last donut.`,
      `Mix it up! If doing push-ups, try incline/decline or resistance bands. Keep it tight and controlled.`,
      `Same weight, add reps, then increase load. If bar speed is slower than a turtle, deload 10% for 2 weeks.`,
      `Stay at ${plateauWeight}${weightUnit} and earn a bigger rep buffer. Then jump to ${suggestedNext}${weightUnit} with confidence.`,
      `Add one variable: +1 rep, +1 set, or +5–10% rest reduction. Tiny change, big signal.`,
      `Pick one set to push (without failing), then bring the rest up to match over the next sessions.`,
      `If reps are inconsistent, lock a target rep count and hold it across every set for 2-3 sessions.`
    ] as const);

    return {
      status: 'stagnant',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      icon: AlertTriangle,
      title,
      description,
      subtext,
      confidence: core.confidence,
      evidence: core.evidence,
      label: 'plateauing',
      isBodyweightLike: core.isBodyweightLike,
      prematurePr: core.prematurePr,
    };
  }

  if (core.status === 'overload') {
    const title = pickDeterministic(`${seedBase}|title`, [
      'Getting stronger', 'Beast mode', 'On fire', 'Making gains', 'Leveling up',
      'Momentum unlocked', 'Dialed in', 'Power building', 'Trend looks great', 'Quietly crushing it',
      'Strength stacking', 'Progress engine', 'Climbing phase'
    ] as const);

    const description = pickDeterministic(`${seedBase}|desc`, [
      'Nice! Your rep capacity is climbing. Every little bit counts!',
      'Solid work! Strength is trending upward. Keep that momentum.',
      'Good progress! Those reps are adding up nicely.',
      'Looking good! The strength train is chugging along.',
      'Gains are happening - keep doing what you\'re doing.',
      'Strength is building! Don\'t mess with success.',
      'You\'re making progress! The trend is your friend.',
      'Hello, improvement! Nice to see you moving forward.',
      'Rep performance is improving! Keep that energy.',
      'Strength is looking good! The consistency is paying off.',
      'Clean sessions and steady progress. This is what sustainable looks like.',
      'You\'re building something real here. Keep stacking quality work.',
      'Upward drift confirmed. Stay patient and keep the form tight.',
      'This is the good kind of boring: consistent work, consistent results.'
    ] as const);

    const subtext = pickDeterministic(`${seedBase}|sub`, [
      'Technique still matters, champ. Control those reps and show off your form.',
      'Progress is progress! Don\'t get sloppy - small beats big every time.',
      'Keep this momentum. Add reps slowly or make those eccentrics count.',
      'Nice work! If the bar feels light, maybe it\'s time for the next jump.',
      'Stay consistent! Master this range before getting too ambitious.',
      'Current approach is working! Maybe add a back-off set for extra credit.',
      'Once you own this, we can play with harder variations. Don\'t rush the process.',
      'Spread the love! Add reps across all sets, not just the hero first set.',
      'Small gains need big recovery. Sleep well and eat like you mean it.',
      'Small jumps, big results. Don\'t let ego get ahead of reality.',
      'If this feels too easy, either you\'re holding back or it\'s time to level up.',
      'Recovery is your secret weapon. Don\'t sabotage with poor sleep.',
      'Film yourself improving. Future you will appreciate the journey.',
      'Hold the standard: same setup, same depth, cleaner reps. Let strength accumulate.',
      'Add difficulty with intent: +1 rep, +1 set, or a small load jump — not all at once.',
      'Keep sessions repeatable. The goal is momentum, not chaos.',
      'Ride the wave: keep the effort consistent and don\'t force max attempts.'
    ] as const);

    return {
      status: 'overload',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      icon: TrendingUp,
      title,
      description,
      subtext,
      confidence: core.confidence,
      evidence: core.evidence,
      label: 'gaining',
      isBodyweightLike: core.isBodyweightLike,
      prematurePr: core.prematurePr,
    };
  }

  if (core.status === 'regression') {
    const title = pickDeterministic(`${seedBase}|title`, [
      'Taking a break', 'Fatigue showing', 'Recovery mode', 'Backing off', 'Time to reset',
      'Recovery needed', 'Battery low', 'Time to reload', 'Deload vibes', 'System stressed'
    ] as const);

    const description = pickDeterministic(`${seedBase}|desc`, [
      'Whoa! Rep capacity dropped. Your body\'s sending you a message.',
      'Strength took a dip. This is your body\'s way of saying "take it easy".',
      'Reps are trending down. Could be fatigue, stress, or just an off day.',
      'Strength is slipping. Common causes include life, stress, or needing rest.',
      'Performance is down. Don\'t panic - this is your body asking for a break.',
      'Things are dipping a bit. Time to adjust before it becomes a problem.',
      'Small regression happens. Use it as an excuse to perfect your form.',
      'Your recent output is lower than your usual. That\'s a recovery signal, not a character flaw.',
      'This looks like accumulated fatigue. The fix is usually sleep + smart volume, not rage lifting.',
      'Performance dipped. Treat this as feedback and adjust the next 1-2 sessions.',
      'You\'re underperforming relative to baseline. Let\'s get you back to neutral first.'
    ] as const);

    const subtext = pickDeterministic(`${seedBase}|sub`, [
      'Take 2-3 days completely off. Then return at 80% intensity like a smart athlete.',
      'Deload 15-20% for 1 week. Focus on technique, then rebuild gradually.',
      'Cut volume by 20% or switch to easier variations. Your muscles need recovery.',
      'Light week: 60% volume, 90% intensity. Or drop weight 5-10% for 2 sessions.',
      'Add rest days and reduce training density. Quality over quantity right now.',
      'Check your life: sleep, stress, nutrition. Sometimes the fix isn\'t in the gym.',
      'Film yourself. Maybe your form slipped without you noticing.',
      'Stop training so close to failure! Leave 2-3 reps in reserve. This is marathon, not sprint.',
      'Small dips happen. Sleep 7-9 hours and don\'t overthink it.',
      'Do one "easy win" session: lighter load, crisp reps, leave 3 reps in reserve. Build confidence back.',
      'Reduce intensity for a session and focus on range of motion and bar path. Make it feel good again.',
      'Pick one lever to pull: less volume, more rest, or a small deload. Don\'t change everything at once.',
      'If joints feel cranky, keep the movement but scale the load. Consistency without punishment.'
    ] as const);

    return {
      status: 'regression',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      icon: TrendingDown,
      title,
      description,
      subtext,
      confidence: core.confidence,
      evidence: core.evidence,
      label: 'losing',
      isBodyweightLike: core.isBodyweightLike,
      prematurePr: core.prematurePr,
    };
  }

  if (core.status === 'neutral') {
    const title = pickDeterministic(`${seedBase}|title`, [
      'Cruising along', 'Holding steady', 'Maintenance mode', 'Stable vibes', 'Chill but building',
      'Steady state', 'Consistent output', 'Solid baseline', 'In the pocket', 'Holding the line'
    ] as const);
    const description = pickDeterministic(`${seedBase}|desc`, [
      'Performance is stable. This is your launch pad for the next breakthrough.',
      'Strength is steady. This consistency is setting you up for something big.',
      'Reps are consistent - perfect time to get fancy with technique and work capacity.',
      'Strength is holding steady - time to polish your form before the next climb.',
      'Not a setback, just strategic patience. Choose your next move wisely, grasshopper.',
      'You\'ve found your current level. Now optimize it before you level up again.',
      'Current strength level achieved. Time to master this before chasing more.',
      'You\'re maintaining well. Small, consistent nudges will turn this into progress.',
      'Stable trend. This is where good programming turns into great results.',
      'Nothing dramatic, which is good. Now you can choose a deliberate progression path.',
      'You\'re holding steady. If you want growth, add a tiny challenge and repeat.'
    ] as const);
    const subtext = pickDeterministic(`${seedBase}|sub`, [
      'Play with tempo: add 2-second pauses or painfully slow eccentrics (3-4 seconds). Feel the burn!',
      'Focus on bar speed and control. Explosive up, controlled down. Like a boss.',
      'Add volume strategically: extra set, shorter rest (60-90 seconds), or train more often.',
      'Volume hack: extra back-off set, shorter rest (90-120 seconds), or increase frequency.',
      'If this feels too easy, level up: weighted vest, harder variations, or reduce leverage.',
      'If weight feels manageable, increase intensity: train closer to failure or add partial movements.',
      'Perfect your technique: film yourself, connect mind to muscle, own your range of motion.',
      'Technique check: film yourself, nail your bracing, make every rep identical.',
      'Add structure: pick a rep target and beat it by +1 next session, then repeat.',
      'Make one change at a time: slightly shorter rest, slightly higher reps, or a small load jump.',
      'Aim for smoother reps and a stronger finish. Consistency now makes progress easier later.',
      'If you want movement, set a micro-goal: +1 rep across sets or +0.5–1kg next week.'
    ] as const);
    return {
      status: 'neutral',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      icon: Minus,
      title,
      description,
      subtext,
      confidence: core.confidence,
      evidence: core.evidence,
      label: 'maintaining',
      isBodyweightLike: core.isBodyweightLike,
      prematurePr: core.prematurePr,
    };
  }

  return {
    status: core.status,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/20',
    icon: Minus,
    title: 'Unknown',
    description: 'Not enough data to analyze this exercise trend yet.',
    confidence: core.confidence,
    evidence: core.evidence,
    label: 'unknown',
    isBodyweightLike: core.isBodyweightLike,
    prematurePr: core.prematurePr,
  };
};
