import { pickDeterministic } from './messageVariations';

export interface SetCommentaryOptions {
  shortMessages: readonly string[];
  tooltips: readonly string[];
  whyLines?: readonly string[];
  improveLines?: readonly string[];
}

const SAME_WEIGHT_REPS_INCREASED: SetCommentaryOptions = {
  shortMessages: [
    'Second Wind',
    'Rallying',
    'Reserves Found',
    'Recovery Win',
    'Energy Boost',
    'Comeback',
    'Back on Track',
    'Bounce Back',
    'Momentum Shift',
    'Fresh Energy',
    'Rising Again',
    'Better Rest Paid Off'
  ] as const,
  tooltips: [
    '+{diff} reps vs last',
    'Found {diff} more reps',
    'Recovery helped - +{diff}',
    '+{diff} reps: reserves found',
    'Bounced back +{diff} reps',
    'Energy returned: +{diff}',
    'Better pacing: +{diff}',
    'Rest time helped +{diff}',
    'Momentum shifting +{diff}',
    'Reserves available +{diff}'
  ] as const,
  whyLines: [
    'Had reserves in last set',
    'Or took longer rest this time',
    'Better recovery between sets',
    'Pacing improved across sets',
    'Found energy reserves',
    'Recovery was effective',
    'Fatigue managed well',
    'Rest time paid dividends',
    'Body adapted to workload',
    'Neural system recovered',
    'Energy levels rebounded',
    'Better breathing technique'
  ] as const
};

const SAME_WEIGHT_REPS_SAME: SetCommentaryOptions = {
  shortMessages: [
    'Consistent',
    'Steady',
    'Locked In',
    'Solid',
    'On Point',
    'Rock Solid',
    'Controlled',
    'Perfect Pace',
    'Even Output',
    'Measured',
    'Stable',
    'Precision Work'
  ] as const,
  tooltips: [
    'Maintained {reps} reps',
    'Steady: {reps} reps',
    'Locked at {reps} reps',
    'Rock solid: {reps} reps',
    'Perfect pacing: {reps}',
    'Even output: {reps} reps',
    'Controlled: {reps} reps',
    'On point: {reps} reps',
    'Consistent: {reps} reps',
    'Measured: {reps} reps'
  ] as const,
  whyLines: [
    'Good pacing and recovery',
    'Rest time is working well',
    'Fatigue managed perfectly',
    'Pacing was on point',
    'Recovery between sets solid',
    'Energy levels stable',
    'Technique remained consistent',
    'Breathing was steady',
    'Focus maintained well',
    'Workload distributed evenly',
    'Rest periods optimal',
    'Neural system firing consistently'
  ] as const
};

const SAME_WEIGHT_DROP_MILD: SetCommentaryOptions = {
  shortMessages: [
    'Normal Fatigue',
    'Expected Drop',
    'Standard Fatigue',
    'Natural Decline',
    'Normal Pattern',
    'Typical Fatigue',
    'Working Hard',
    'Expected',
    'On Track',
    'Normal Course',
    'Fatigue Setting In',
    'Working as Expected'
  ] as const,
  tooltips: [
    '-{dropAbs} reps ({dropPct}%)',
    '-{dropAbs} reps: normal',
    '-{dropAbs} reps: expected',
    '-{dropAbs}: standard fatigue',
    '-{dropAbs} reps typical',
    'Normal: -{dropAbs} reps',
    '-{dropAbs} expected drop',
    '-{dropAbs} reps: natural',
    '-{dropAbs}: working hard',
    '-{dropAbs} reps: on track'
  ] as const,
  whyLines: [
    'Normal fatigue between sets',
    'Muscles recovering as expected',
    'Standard decline from effort',
    'Energy depletion normal',
    'Fatigue setting in naturally',
    'Working at appropriate intensity',
    'Muscle fatigue expected',
    'Normal performance pattern',
    'Expected energy decline',
    'Working within limits',
    'Fatigue is manageable',
    'Body responding normally'
  ] as const
};

const SAME_WEIGHT_DROP_MODERATE: SetCommentaryOptions = {
  shortMessages: [
    'High Fatigue',
    'Fatigue Building',
    'Pushing Hard',
    'Challenging',
    'Fatigue Showing',
    'Grinding',
    'Near Limit',
    'Tough Going',
    'Working Deep',
    'Fatigue Accumulated',
    'Recovery Needed',
    'Intensity High'
  ] as const,
  tooltips: [
    '-{dropAbs} reps ({dropPct}%)',
    '-{dropAbs}: high fatigue',
    '-{dropAbs} reps: grinding',
    '-{dropAbs}: challenging',
    '-{dropAbs} reps fatigued',
    '-{dropAbs}: accumulated fatigue',
    'Heavy drop: -{dropAbs}',
    '-{dropAbs} reps: tough',
    '-{dropAbs}: near limit',
    '-{dropAbs} reps intense'
  ] as const,
  whyLines: [
    'First set pushed close to failure',
    'Or rest was shorter than usual',
    'High intensity accumulated',
    'Fatigue from previous sets',
    'Working close to failure',
    'Energy reserves depleted',
    'Pushing hard early on',
    'Insufficient recovery time',
    'Neural fatigue building',
    'Muscle fibers exhausted',
    'Rest periods too short',
    'First set was maximal effort'
  ] as const,
  improveLines: [
    'Normal if training to failure',
    'For more volume: rest 2-3 min',
    'Consider longer rest periods',
    'Leave 1-2 reps in reserve earlier',
    'Reduce intensity slightly',
    'Increase rest between sets',
    'Pace yourself across sets',
    'Monitor fatigue levels',
    'Consider cluster sets',
    'Extend recovery time',
    'Focus on rep quality',
    'Adjust intensity earlier'
  ] as const
};

const SAME_WEIGHT_DROP_SEVERE: SetCommentaryOptions = {
  shortMessages: [
    'Significant Drop',
    'Major Fatigue',
    'Exhausted',
    'Deep Fatigue',
    'Severe Decline',
    'Pushed Too Hard',
    'Overcooked',
    'Burnout Warning',
    'Too Intense',
    'Critical Fatigue',
    'Need Recovery',
    'Overreaching'
  ] as const,
  tooltips: [
    '-{dropAbs} reps ({dropPct}%)',
    '-{dropAbs}: major fatigue',
    '-{dropAbs} reps exhausted',
    '-{dropAbs}: severe drop',
    '-{dropAbs} critical fatigue',
    '-{dropAbs}: too intense',
    '-{dropAbs} burned out',
    '-{dropAbs}: overreaching',
    '-{dropAbs} severe drop',
    '-{dropAbs}: need recovery'
  ] as const,
  whyLines: [
    'First set was to failure',
    'Limits performance on remaining sets',
    'Severe accumulated fatigue',
    'Neural system exhausted',
    'Muscle failure occurred early',
    'Energy completely depleted',
    'Overreaching on first set',
    'Deep tissue fatigue',
    'CNS fatigue is high',
    'Recovery insufficient',
    'Intensity exceeded capacity',
    'Too close to true failure'
  ] as const,
  improveLines: [
    'If intentional: good intensity',
    'For more volume: leave 1-2 RIR',
    'Reduce first set intensity',
    'Extend rest to 3-5 minutes',
    'Consider deload week',
    'Leave 2-3 reps in reserve',
    'Stop training near failure',
    'Reduce overall intensity',
    'Prioritize recovery quality',
    'Check sleep and nutrition',
    'Monitor overall stress',
    'Reassess training load'
  ] as const
};

const WEIGHT_INCREASE_EXCEEDED: SetCommentaryOptions = {
  shortMessages: [
    'Strong Progress',
    'Leveling Up',
    'Crushing It',
    'Breakthrough',
    'Powered Through',
    'Adapted Well',
    'Strength Gains',
    'New Level',
    'Surpassed Goal',
    'Exceeded Expectations',
    'Ready for More',
    'Strong Adaptation'
  ] as const,
  tooltips: [
    '+{pct}% weight, {currReps} reps',
    'Jump +{pct}%, hit {currReps}',
    'Weight +{pct}%, {currReps} reps',
    '+{pct}% loaded, {currReps} done',
    'Beat prediction: +{pct}%',
    'Exceeded: +{pct}%, {currReps}',
    'Strong jump: +{pct}%',
    '{currReps} reps at +{pct}% weight',
    'Surpassed: +{pct}%, {currReps}',
    'Powered: +{pct}% to {currReps}'
  ] as const,
  whyLines: [
    'Got {currReps} reps (expected {expectedLabel})',
    'Strength gains showing',
    'Better than predicted',
    'Adaptation successful',
    'Neural efficiency improved',
    'Muscle capacity increased',
    'Previous training paying off',
    'Recovery was optimal',
    'Technique improvements helped',
    'Work capacity expanded',
    'Strength curve trending up',
    'Neural drive enhanced'
  ] as const
};

const WEIGHT_INCREASE_MET: SetCommentaryOptions = {
  shortMessages: [
    'Good Progress',
    'On Target',
    'Right Weight',
    'Solid Jump',
    'Adapting',
    'Progress Made',
    'Hit Target',
    'Moving Forward',
    'Building',
    'Gaining Momentum',
    'Steady Progress',
    'Adaptation Underway'
  ] as const,
  tooltips: [
    '+{pct}% weight, {currReps} reps',
    'Hit {currReps} as expected',
    'On target: +{pct}%',
    'Met prediction: {currReps}',
    'Good jump: +{pct}%',
    '{currReps} reps at +{pct}%',
    'Progress achieved: +{pct}%',
    'Right weight: {currReps}',
    'Target hit: {currReps}',
    'Progress: +{pct}% weight'
  ] as const,
  whyLines: [
    'Hit {currReps} reps as expected',
    'Progress achieved',
    'Weight jump appropriate',
    'Prediction accurate',
    'Workload manageable',
    'Strength adapting well',
    'Intensity appropriate',
    'Recovery sufficient',
    'Training effective',
    'Load progression sound',
    'Volume manageable',
    'Progress on track'
  ] as const
};

const WEIGHT_INCREASE_SLIGHTLY_BELOW: SetCommentaryOptions = {
  shortMessages: [
    'Slightly Ambitious',
    'Almost There',
    'Close Call',
    'Near Target',
    'Agressive Jump',
    'Testing Limits',
    'Pushing Edge',
    'Ambitious',
    'Borderline',
    'Reaching',
    'Stretching',
    'Testing Waters'
  ] as const,
  tooltips: [
    '+{pct}% weight, {currReps} reps',
    'Got {currReps} (expected {expectedLabel})',
    'Slightly under: {currReps}',
    'Near prediction: {currReps}',
    'Ambitious: +{pct}%',
    '{currReps} vs {expectedLabel}',
    'Almost: {currReps} reps',
    'Testing limits: +{pct}%',
    'Slightly high: {currReps}',
    'Borderline: +{pct}% weight'
  ] as const,
  whyLines: [
    'Got {currReps} reps (expected {expectedLabel})',
    'Weight jump may be slightly aggressive',
    'Testing your current capacity',
    'Intensity at upper edge',
    'Neural system adapting',
    'Workload challenging',
    'Muscle fibers stressed',
    'Strength nearly there',
    'Fatigue affected performance',
    'Recovery was borderline',
    'Training at ceiling',
    'Effort was high'
  ] as const,
  improveLines: [
    'Keep trying this weight',
    'Strength adapts over time',
    'Repeat until reps stabilize',
    'Focus on quality over quantity',
    'Extend rest periods',
    'Ensure adequate recovery',
    'Technique matters more now',
    'Be patient with adaptation',
    'Consistency beats intensity',
    'Give body time to adapt',
    'Monitor fatigue closely',
    'Stay within 1-2 RIR'
  ] as const
};

const WEIGHT_INCREASE_SIGNIFICANTLY_BELOW: SetCommentaryOptions = {
  shortMessages: [
    'Premature Jump',
    'Too Heavy',
    'Back Down',
    'Overreaching',
    'Too Aggressive',
    'Reset Needed',
    'Reduce Load',
    'Too Big Jump',
    'Too Intense',
    'Premature',
    'Failed Jump',
    'Need Adjustment'
  ] as const,
  tooltips: [
    '+{pct}% weight, {currReps} reps',
    'Only {currReps} (expected {expectedLabel})',
    'Too heavy: {currReps} reps',
    'Jump failed: {currReps}',
    'Premature: +{pct}%',
    '{currReps} vs {expectedLabel}',
    'Too aggressive: {currReps}',
    'Overreaching: +{pct}%',
    'Reset needed: {currReps}',
    'Too big: {currReps} reps'
  ] as const,
  whyLines: [
    'Only {currReps} reps (expected {expectedLabel})',
    'Weight increase too aggressive',
    'Neural system overloaded',
    'Muscle fibers insufficiently adapted',
    'Jump exceeded capacity',
    'Strength not ready',
    'Workload too high',
    'Recovery incomplete',
    'Technical breakdown',
    'Intensity too demanding',
    'Previous base insufficient',
    'Adaptation incomplete'
  ] as const,
  improveLines: [
    'Build more reps at last weight first',
    'Try smaller 2.5-5% jumps',
    'Reduce weight by 5-10%',
    'Stay at previous weight',
    'Establish solid base first',
    'Progress in smaller increments',
    'Focus on rep quality',
    'Back off to working weight',
    'Allow more adaptation time',
    'Build rep buffer before jumping',
    'Double progression method',
    'Consider micro-loading'
  ] as const
};

const WEIGHT_DECREASE_MET: SetCommentaryOptions = {
  shortMessages: [
    'Effective Backoff',
    'Smart Backoff',
    'Quality Volume',
    'Volume Work',
    'Smart Training',
    'Working Deep',
    'Backoff Success',
    'Volume Focus',
    'Tactical Drop',
    'Strategic',
    'Working Well',
    'Controlled Fatigue'
  ] as const,
  tooltips: [
    '{pct}% weight, {currReps} reps',
    'Smart backoff for volume',
    '{pct}%: volume work',
    'Effective: {currReps} reps',
    'Tactical: {pct}% weight',
    'Quality volume: {currReps}',
    '{currReps} at {pct}% weight',
    'Smart drop: {currReps}',
    'Strategic: +{pct}% weight',
    'Working deep: {currReps}'
  ] as const,
  whyLines: [
    'Smart backoff for volume',
    'Reduced neural fatigue while maintaining work',
    'Volume without fatigue',
    'Quality over quantity',
    'Strategic load reduction',
    'Work without exhaustion',
    'Fatigue managed well',
    'Volume accumulation focus',
    'Neural system preserved',
    'Quality reps prioritized',
    'Working within means',
    'Effective load management'
  ] as const
};

const WEIGHT_DECREASE_SLIGHTLY_BELOW: SetCommentaryOptions = {
  shortMessages: [
    'Fatigued Backoff',
    'Accumulated Fatigue',
    'Working Tired',
    'Fatigue Factor',
    'Some Fatigue',
    'Tired But Working',
    'Manageable Fatigue',
    'Recovery Lagging',
    'Fatigue Present',
    'Working Through It',
    'Recovery Needed',
    'Fatigue Building'
  ] as const,
  tooltips: [
    '{pct}% weight, {currReps} reps',
    'Got {currReps} (expected {expectedLabel})',
    'Fatigue: {currReps} reps',
    'Tired: {pct}% weight',
    '{currReps} vs {expectedLabel}',
    'Accumulated fatigue',
    'Recovery lag: {currReps}',
    'Working tired: {pct}%',
    'Fatigue present: {currReps}'
  ] as const,
  whyLines: [
    'Got {currReps} reps (expected {expectedLabel})',
    'Accumulated fatigue from earlier sets',
    'Previous work took toll',
    'Recovery not fully complete',
    'Energy stores depleted',
    'Neural fatigue present',
    'Muscle fibers fatigued',
    'Fatigue affecting performance',
    'Rest was insufficient',
    'Workload accumulated',
    'Energy not fully restored',
    'Recovery time too short'
  ] as const
};

const WEIGHT_DECREASE_SIGNIFICANTLY_BELOW: SetCommentaryOptions = {
  shortMessages: [
    'Heavy Fatigue',
    'Exhausted',
    'Need Deload',
    'Overtrained',
    'Deep Fatigue',
    'Critical',
    'Rest Needed',
    'Too Much Work',
    'Overreached',
    'System Stress',
    'Recovery Required',
    'Fatigue Crisis'
  ] as const,
  tooltips: [
    '{pct}% weight, {currReps} reps',
    'Only {currReps} (expected {expectedLabel})',
    'Exhausted: {currReps} reps',
    'Critical fatigue',
    'Too fatigued: {pct}% weight',
    '{currReps} vs {expectedLabel}',
    'Overtrained: {currReps}',
    'Deep fatigue present',
    'Need rest: {currReps}'
  ] as const,
  whyLines: [
    'Only {currReps} reps (expected {expectedLabel})',
    'High accumulated fatigue',
    'Deep tissue exhaustion',
    'Neural system depleted',
    'Recovery completely insufficient',
    'Workload too high',
    'Fatigue accumulated severely',
    'Energy stores empty',
    'Previous work excessive',
    'System is overstressed',
    'Recovery quality poor',
    'Training volume too high'
  ] as const,
  improveLines: [
    'Good if training to failure intentionally',
    'Otherwise: end exercise or rest longer',
    'Consider deload week',
    'Reduce remaining volume',
    'End session now',
    'Take extra recovery days',
    'Assess overall fatigue',
    'Check stress and sleep',
    'Stop before injury risk',
    'Prioritize recovery immediately',
    'Reduce training density',
    'Monitor recovery metrics'
  ] as const
};

const PROMOTE_INCREASE_WEIGHT: readonly string[] = [
  'All sets hit {minReps}+ reps. Increase by {increase} next session.',
  'You nailed {minReps}+ reps across all sets. Time to add {increase}.',
  'Strong showing: {minReps}+ reps minimum. Progress by {increase}.',
  '{minReps}+ reps on every set! Next up: +{increase}.',
  'Consistent {minReps}+ reps means you\'re ready for +{increase}.',
  'Your body adapted to {minReps}+ reps. Load +{increase} next time.',
  'All sets above {minReps} reps. Jump +{increase} next session.',
  '{minReps}+ reps established. Increment by {increase}.',
  'Mastered {minReps}+ reps consistently. Add {increase} next workout.',
  'Work capacity at {minReps}+ reps. Increase by {increase} for overload.',
  '{minReps}+ reps minimum hit. Time for {increase} progression.',
  'You\'re owning {minReps}+ reps. Load {increase} more next session.',
  '{minReps}+ reps every set. Next level: +{increase}.',
  'Consistency pays: {minReps}+ reps across board. Add {increase}.',
  'Your strength curve says {increase} increase is next.'
] as const;

const DEMOTE_TOO_HEAVY: readonly string[] = [
  'Max {maxReps} reps. Reduce by 5-10% to hit 6-12 rep range.',
  '{maxReps} reps is too low. Drop 5-10% for hypertrophy range.',
  'Hit only {maxReps} reps. Deload 5-10% for better volume.',
  '{maxReps} reps max - too heavy for muscle growth. Reduce by 5-10%.',
  'Can only get {maxReps} reps. Lighten load 5-10% to optimize stimulus.',
  '{maxReps} reps means intensity is too high. Reduce 5-10%.',
  'You\'re grinding at {maxReps} reps. Drop 5-10% for cleaner reps.',
  '{maxReps} reps ceiling - drop weight 5-10% for more reps.',
  'Load too heavy: {maxReps} reps max. Reduce by 5-10%.',
  '{maxReps} reps shows need for deload. Lighten 5-10% next session.',
  'Strength not supporting hypertrophy at {maxReps} reps. Reduce 5-10%.',
  '{maxReps} reps is strength work, not growth. Drop 5-10% for more reps.',
  'Volume too low at {maxReps} reps. Reduce weight 5-10%.',
  '{maxReps} reps max - back off 5-10% to unlock hypertrophy.',
  'You\'re stuck at {maxReps} reps. Reduce by 5-10% to progress.'
] as const;

const DEMOTE_INCONSISTENT: readonly string[] = [
  'Reps varied {minReps}-{maxReps}. Lower weight or rest longer for consistency.',
  'Wide range: {minReps}-{maxReps} reps. Stabilize by reducing weight or adding rest.',
  'Inconsistent: {minReps} to {maxReps} reps. Better recovery or lighter weight needed.',
  'Performance fluctuated {minReps}-{maxReps}. Standardize with less intensity or more rest.',
  'Range {minReps}-{maxReps} shows fatigue. Reduce weight or extend rest periods.',
  'Your reps vary {minReps}-{maxReps}. Back off weight or rest more between sets.',
  'Inconsistent output: {minReps}-{maxReps} reps. Improve recovery or reduce load.',
  'Fatigue causing {minReps}-{maxReps} variance. Lighten up or rest longer.',
  'Performance range {minReps}-{maxReps} is too wide. Reduce weight by 5% or add rest.',
  'You\'re all over the place: {minReps}-{maxReps}. Better recovery or lighter weight.',
  'Inconsistent performance {minReps}-{maxReps}. Standardize load or extend rest.',
  'Fatigue management needed: {minReps}-{maxReps} reps. Drop weight or rest more.',
  'Reps scattered {minReps}-{maxReps}. Better pacing and recovery needed.',
  'Wide variance {minReps}-{maxReps} means fatigue or poor recovery. Adjust next session.',
  'Your body is saying {minReps}-{maxReps}. Listen: less weight, more rest.'
] as const;

export const getSetCommentary = (
  scenario: 'sameWeight_repsIncreased' | 'sameWeight_repsSame' | 'sameWeight_dropMild' | 'sameWeight_dropModerate' | 'sameWeight_dropSevere' |
              'weightIncrease_exceeded' | 'weightIncrease_met' | 'weightIncrease_slightlyBelow' | 'weightIncrease_significantlyBelow' |
              'weightDecrease_met' | 'weightDecrease_slightlyBelow' | 'weightDecrease_significantlyBelow',
  seedBase: string,
  templateVars?: Record<string, string | number>
): SetCommentaryOptions => {
  const getCommentary = (options: SetCommentaryOptions): SetCommentaryOptions => {
    if (!templateVars) return options;
    
    const interpolate = (text: string): string => {
      let result = text;
      for (const [key, value] of Object.entries(templateVars)) {
        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
      }
      return result;
    };

    return {
      shortMessages: options.shortMessages.map(m => interpolate(m)) as any,
      tooltips: options.tooltips.map(m => interpolate(m)) as any,
      whyLines: options.whyLines?.map(m => interpolate(m)) as any,
      improveLines: options.improveLines?.map(m => interpolate(m)) as any,
    };
  };

  const pickMessage = (messages: readonly string[], suffix: string = ''): string => {
    return pickDeterministic(`${seedBase}${suffix}`, messages);
  };

  const pickMessages = (messages: readonly string[], count: number, suffix: string = ''): string[] => {
    const selected: string[] = [];
    for (let i = 0; i < count; i++) {
      selected.push(pickDeterministic(`${seedBase}${suffix}|${i}`, messages));
    }
    return selected;
  };

  const map = {
    sameWeight_repsIncreased: getCommentary(SAME_WEIGHT_REPS_INCREASED),
    sameWeight_repsSame: getCommentary(SAME_WEIGHT_REPS_SAME),
    sameWeight_dropMild: getCommentary(SAME_WEIGHT_DROP_MILD),
    sameWeight_dropModerate: getCommentary(SAME_WEIGHT_DROP_MODERATE),
    sameWeight_dropSevere: getCommentary(SAME_WEIGHT_DROP_SEVERE),
    weightIncrease_exceeded: getCommentary(WEIGHT_INCREASE_EXCEEDED),
    weightIncrease_met: getCommentary(WEIGHT_INCREASE_MET),
    weightIncrease_slightlyBelow: getCommentary(WEIGHT_INCREASE_SLIGHTLY_BELOW),
    weightIncrease_significantlyBelow: getCommentary(WEIGHT_INCREASE_SIGNIFICANTLY_BELOW),
    weightDecrease_met: getCommentary(WEIGHT_DECREASE_MET),
    weightDecrease_slightlyBelow: getCommentary(WEIGHT_DECREASE_SLIGHTLY_BELOW),
    weightDecrease_significantlyBelow: getCommentary(WEIGHT_DECREASE_SIGNIFICANTLY_BELOW),
  };

  const options = map[scenario];
  const commentary = getCommentary(options);

  return commentary;
};

export const getPromoteMessage = (seedBase: string, templateVars: { minReps: number; increase: string }): string => {
  let message = pickDeterministic(`${seedBase}|promote`, PROMOTE_INCREASE_WEIGHT);
  for (const [key, value] of Object.entries(templateVars)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return message;
};

export const getDemoteTooHeavyMessage = (seedBase: string, templateVars: { maxReps: number }): string => {
  let message = pickDeterministic(`${seedBase}|demote_heavy`, DEMOTE_TOO_HEAVY);
  for (const [key, value] of Object.entries(templateVars)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return message;
};

export const getDemoteInconsistentMessage = (seedBase: string, templateVars: { minReps: number; maxReps: number }): string => {
  let message = pickDeterministic(`${seedBase}|demote_inconsistent`, DEMOTE_INCONSISTENT);
  for (const [key, value] of Object.entries(templateVars)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return message;
};
