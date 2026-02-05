import type { AnalysisResult, TooltipLine } from '../../../types';
import { roundTo } from '../../format/formatters';
import { pickDeterministic } from '../common/messageVariations';
import { getSetCommentary } from '../setCommentary/setCommentaryLibrary';
import { DROP_THRESHOLD_MILD, DROP_THRESHOLD_MODERATE } from './masterAlgorithmConstants';
import { buildStructured, line } from './masterAlgorithmTooltips';
import { createAnalysisResult } from './masterAlgorithmResults';

export const analyzeSameWeight = (
  transition: string,
  repDropPct: number,
  prevReps: number,
  currReps: number,
  setNumber: number
): AnalysisResult => {
  const repDiff = currReps - prevReps;
  const isAfterFirstWorkingSet = setNumber === 2;
  const seedBase = `${transition}|${prevReps}|${currReps}`;

  if (repDiff > 0) {
    const commentary = getSetCommentary('sameWeight_repsIncreased', seedBase, { diff: repDiff });
    const whyLines = commentary.whyLines || [];
    return createAnalysisResult(
      transition,
      'success',
      0,
      repDropPct,
      currReps,
      `${prevReps}`,
      pickDeterministic(`${seedBase}|short`, commentary.shortMessages),
      pickDeterministic(`${seedBase}|tooltip`, commentary.tooltips),
      buildStructured(`+${repDiff} reps`, 'up', [line(whyLines[0], 'gray'), line(whyLines[1], 'gray')])
    );
  }

  if (repDiff === 0) {
    const commentary = getSetCommentary('sameWeight_repsSame', seedBase, { reps: currReps });
    const whyLines = commentary.whyLines || [];
    return createAnalysisResult(
      transition,
      'success',
      0,
      0,
      currReps,
      `${prevReps}`,
      pickDeterministic(`${seedBase}|short`, commentary.shortMessages),
      pickDeterministic(`${seedBase}|tooltip`, commentary.tooltips),
      buildStructured('= reps', 'same', [line(whyLines[0], 'green'), line(whyLines[1], 'gray')])
    );
  }

  const dropAbs = Math.abs(repDiff);
  const dropPctAbs = Math.abs(repDropPct);

  if (dropPctAbs <= DROP_THRESHOLD_MILD) {
    const commentary = getSetCommentary('sameWeight_dropMild', seedBase, { dropAbs, dropPct: roundTo(dropPctAbs, 0) });
    const whyLines = commentary.whyLines || [];
    return createAnalysisResult(
      transition,
      'info',
      0,
      repDropPct,
      currReps,
      `${prevReps}`,
      pickDeterministic(`${seedBase}|short`, commentary.shortMessages),
      pickDeterministic(`${seedBase}|tooltip`, commentary.tooltips),
      buildStructured(`-${dropAbs} reps`, 'down', [line(whyLines[0], 'blue'), line(whyLines[1], 'gray')])
    );
  }

  if (dropPctAbs <= DROP_THRESHOLD_MODERATE) {
    const commentary = getSetCommentary('sameWeight_dropModerate', seedBase, { dropAbs, dropPct: roundTo(dropPctAbs, 0) });
    const whyLines = commentary.whyLines || [];
    const improveLines = commentary.improveLines || [];

    const why: TooltipLine[] = isAfterFirstWorkingSet
      ? [line(whyLines[0], 'yellow')]
      : [line(whyLines[0], 'yellow'), line(whyLines[1], 'gray')];

    return createAnalysisResult(
      transition,
      'warning',
      0,
      repDropPct,
      currReps,
      `${prevReps}`,
      pickDeterministic(`${seedBase}|short`, commentary.shortMessages),
      pickDeterministic(`${seedBase}|tooltip`, commentary.tooltips),
      buildStructured(
        `-${dropAbs} reps`,
        'down',
        why,
        [line(improveLines[0], 'gray'), line(improveLines[1], 'blue')]
      )
    );
  }

  const commentary = getSetCommentary('sameWeight_dropSevere', seedBase, { dropAbs, dropPct: roundTo(dropPctAbs, 0) });
  const whyLines = commentary.whyLines || [];
  const improveLines = commentary.improveLines || [];

  const why: TooltipLine[] = isAfterFirstWorkingSet
    ? [line(whyLines[0], 'red'), line(whyLines[1], 'gray')]
    : [line(whyLines[0], 'red'), line(whyLines[1], 'gray')];

  return createAnalysisResult(
    transition,
    'danger',
    0,
    repDropPct,
    currReps,
    `${prevReps}`,
    pickDeterministic(`${seedBase}|short`, commentary.shortMessages),
    pickDeterministic(`${seedBase}|tooltip`, commentary.tooltips),
    buildStructured(
      `-${dropAbs} reps`,
      'down',
      why,
      [line(improveLines[0], 'green'), line(improveLines[1], 'blue')]
    )
  );
};
