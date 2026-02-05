import { pickDeterministic } from '../../../utils/analysis/common';
import type { TrendCopy } from './exerciseTrendUiCopyNew';

export const getRegressionCopy = (seedBase: string): TrendCopy => {
  const title = pickDeterministic(`${seedBase}|title`, [
    'Taking a break',
    'Fatigue showing',
    'Recovery mode',
    'Backing off',
    'Time to reset',
    'Recovery needed',
    'Battery low',
    'Time to reload',
    'Deload vibes',
    'System stressed',
  ] as const);

  const description = pickDeterministic(`${seedBase}|desc`, [
    "Whoa! Rep capacity dropped. Your body's sending you a message.",
    'Strength took a dip. This is your body\'s way of saying "take it easy".',
    'Reps are trending down. Could be fatigue, stress, or just an off day.',
    'Strength is slipping. Common causes include life, stress, or needing rest.',
    "Performance is down. Don't panic - this is your body asking for a break.",
    "Things are dipping a bit. Time to adjust before it becomes a problem.",
    'Small regression happens. Use it as an excuse to perfect your form.',
    "Your recent output is lower than your usual. That's a recovery signal, not a character flaw.",
    'This looks like accumulated fatigue. The fix is usually sleep + smart volume, not rage lifting.',
    'Performance dipped. Treat this as feedback and adjust the next 1-2 sessions.',
    "You're underperforming relative to your usual. Let's get you back on track first.",
  ] as const);

  const subtext = pickDeterministic(`${seedBase}|sub`, [
    'Take 2-3 days completely off. Then return at 80% intensity like a smart athlete.',
    'Deload 15-20% for 1 week. Focus on technique, then rebuild gradually.',
    'Cut volume by 20% or switch to easier variations. Your muscles need recovery.',
    'Light week: 60% volume, 90% intensity. Or drop weight 5-10% for 2 sessions.',
    'Add rest days and reduce training density. Quality over quantity right now.',
    "Check your life: sleep, stress, nutrition. Sometimes the fix isn't in the gym.",
    'Film yourself. Maybe your form slipped without you noticing.',
    'Stop training so close to failure! Leave 2-3 reps in reserve. This is marathon, not sprint.',
    "Small dips happen. Sleep 7-9 hours and don't overthink it.",
    'Do one "easy win" session: lighter load, crisp reps, leave 3 reps in reserve. Build confidence back.',
    'Reduce intensity for a session and focus on range of motion and bar path. Make it feel good again.',
    "Pick one lever to pull: less volume, more rest, or a small deload. Don't change everything at once.",
    'If joints feel cranky, keep the movement but scale the load. Consistency without punishment.',
  ] as const);

  return { title, description, subtext };
};
