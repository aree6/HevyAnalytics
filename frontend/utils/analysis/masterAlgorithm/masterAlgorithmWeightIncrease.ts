import type { AnalysisResult } from '../../../types';
import { roundTo } from '../../format/formatters';
import { pickDeterministic } from '../common/messageVariations';
import { getSetCommentary } from '../setCommentary/setCommentaryLibrary';
import { FATIGUE_BUFFER } from './masterAlgorithmConstants';
import { calculatePercentChange } from './masterAlgorithmMath';
import { buildStructured, line } from './masterAlgorithmTooltips';
import { createAnalysisResult } from './masterAlgorithmResults';
import type { ExpectedRepsRange } from './masterAlgorithmTypes';

export const analyzeWeightIncrease = (
  transition: string,
  weightChangePct: number,
  prevWeight: number,
  currWeight: number,
  prevReps: number,
  currReps: number,
  expected: ExpectedRepsRange
): AnalysisResult => {
  const expectedLabel = expected.label;
  const expectedTarget = Math.round(expected.center);

  const prevVol = prevWeight * prevReps;
  const currVol = currWeight * currReps;
  const volChangePct = calculatePercentChange(prevVol, currVol);
  const pct = roundTo(weightChangePct, 0);
  const seedBase = `${transition}|${weightChangePct}|${currReps}|${expectedLabel}`;

  if (currReps > expected.max) {
    const commentary = getSetCommentary('weightIncrease_exceeded', seedBase, { pct, currReps, expectedLabel });
    const whyLines = commentary.whyLines || [];
    return createAnalysisResult(
      transition,
      'success',
      weightChangePct,
      volChangePct,
      currReps,
      expectedLabel,
      pickDeterministic(`${seedBase}|short`, commentary.shortMessages),
      pickDeterministic(`${seedBase}|tooltip`, commentary.tooltips),
      buildStructured(`+${pct}% weight`, 'up', [
        line(whyLines[0].replace('{currReps}', String(currReps)).replace('{expectedLabel}', expectedLabel), 'green'),
        line(whyLines[1], 'gray'),
      ])
    );
  }

  if (currReps >= (expected.center - FATIGUE_BUFFER) || (currReps >= expected.min && currReps <= expected.max)) {
    const commentary = getSetCommentary('weightIncrease_met', seedBase, { pct, currReps });
    const whyLines = commentary.whyLines || [];
    return createAnalysisResult(
      transition,
      'success',
      weightChangePct,
      volChangePct,
      currReps,
      expectedLabel,
      pickDeterministic(`${seedBase}|short`, commentary.shortMessages),
      pickDeterministic(`${seedBase}|tooltip`, commentary.tooltips),
      buildStructured(`+${pct}% weight`, 'up', [
        line(whyLines[0].replace('{currReps}', String(currReps)), 'green'),
        line(whyLines[1], 'gray'),
      ])
    );
  }

  if (currReps >= expectedTarget - 3) {
    const commentary = getSetCommentary('weightIncrease_slightlyBelow', seedBase, { pct, currReps, expectedLabel });
    const whyLines = commentary.whyLines || [];
    const improveLines = commentary.improveLines || [];
    return createAnalysisResult(
      transition,
      'warning',
      weightChangePct,
      volChangePct,
      currReps,
      expectedLabel,
      pickDeterministic(`${seedBase}|short`, commentary.shortMessages),
      pickDeterministic(`${seedBase}|tooltip`, commentary.tooltips),
      buildStructured(
        `+${pct}% weight`,
        'up',
        [
          line(whyLines[0].replace('{currReps}', String(currReps)).replace('{expectedLabel}', expectedLabel), 'yellow'),
          line(whyLines[1], 'gray'),
        ],
        [line(improveLines[0], 'blue'), line(improveLines[1], 'gray')]
      )
    );
  }

  const commentary = getSetCommentary('weightIncrease_significantlyBelow', seedBase, { pct, currReps, expectedLabel });
  const whyLines = commentary.whyLines || [];
  const improveLines = commentary.improveLines || [];
  return createAnalysisResult(
    transition,
    'danger',
    weightChangePct,
    volChangePct,
    currReps,
    expectedLabel,
    pickDeterministic(`${seedBase}|short`, commentary.shortMessages),
    pickDeterministic(`${seedBase}|tooltip`, commentary.tooltips),
    buildStructured(
      `+${pct}% weight`,
      'up',
      [
        line(whyLines[0].replace('{currReps}', String(currReps)).replace('{expectedLabel}', expectedLabel), 'red'),
        line(whyLines[1], 'gray'),
      ],
      [line(improveLines[0], 'blue'), line(improveLines[1], 'gray')]
    )
  );
};
