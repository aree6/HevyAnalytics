import { pickDeterministic } from '../common/messageVariations';
import {
  SAME_WEIGHT_REPS_INCREASED,
  SAME_WEIGHT_REPS_SAME,
  SAME_WEIGHT_DROP_MILD,
  SAME_WEIGHT_DROP_MODERATE,
  SAME_WEIGHT_DROP_SEVERE,
} from './setCommentarySameWeight';
import {
  WEIGHT_INCREASE_EXCEEDED,
  WEIGHT_INCREASE_MET,
  WEIGHT_INCREASE_SLIGHTLY_BELOW,
  WEIGHT_INCREASE_SIGNIFICANTLY_BELOW,
} from './setCommentaryIncrease';
import {
  WEIGHT_DECREASE_MET,
  WEIGHT_DECREASE_SLIGHTLY_BELOW,
  WEIGHT_DECREASE_SIGNIFICANTLY_BELOW,
} from './setCommentaryDecrease';
import {
  PROMOTE_INCREASE_WEIGHT,
  DEMOTE_TOO_HEAVY,
  DEMOTE_INCONSISTENT,
} from './setCommentaryPromoteDemote';

// ============================================================================
// Types (merged from setCommentaryTypes.ts)
// ============================================================================
export interface SetCommentaryOptions {
  shortMessages: readonly string[];
  tooltips: readonly string[];
  whyLines?: readonly string[];
  improveLines?: readonly string[];
}

export const getSetCommentary = (
  scenario:
    | 'sameWeight_repsIncreased'
    | 'sameWeight_repsSame'
    | 'sameWeight_dropMild'
    | 'sameWeight_dropModerate'
    | 'sameWeight_dropSevere'
    | 'weightIncrease_exceeded'
    | 'weightIncrease_met'
    | 'weightIncrease_slightlyBelow'
    | 'weightIncrease_significantlyBelow'
    | 'weightDecrease_met'
    | 'weightDecrease_slightlyBelow'
    | 'weightDecrease_significantlyBelow',
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
      shortMessages: options.shortMessages.map((m) => interpolate(m)) as any,
      tooltips: options.tooltips.map((m) => interpolate(m)) as any,
      whyLines: options.whyLines?.map((m) => interpolate(m)) as any,
      improveLines: options.improveLines?.map((m) => interpolate(m)) as any,
    };
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
