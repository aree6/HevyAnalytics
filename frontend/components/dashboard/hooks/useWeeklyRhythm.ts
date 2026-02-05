import { useMemo } from 'react';
import { getDayOfWeekShape } from '../../../utils/analysis/core';
import type { DailySummary } from '../../../types';

const safePct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);

export const useWeeklyRhythm = (dailyData: DailySummary[]) => {
  const weekShapeData = useMemo(() => getDayOfWeekShape(dailyData), [dailyData]);

  const weeklyRhythmInsight = useMemo(() => {
    if (!weekShapeData || weekShapeData.length === 0) return null;
    const total = weekShapeData.reduce((acc, d) => acc + (d.A || 0), 0);
    if (total <= 0) return null;
    const sorted = [...weekShapeData].sort((a, b) => (b.A || 0) - (a.A || 0));
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    const topShare = safePct(top.A || 0, total);
    const bottomShare = safePct(bottom.A || 0, total);
    const spread = topShare - bottomShare;
    const rhythmLabel = spread <= 12 ? "It's even" : spread <= 22 ? "It's somewhat spiky" : "It's spiky";
    const rhythmTone = spread <= 12 ? 'good' : spread <= 22 ? 'neutral' : 'bad';
    return {
      total,
      top: { subject: top.subject, share: topShare },
      bottom: { subject: bottom.subject, share: bottomShare },
      spread,
      rhythmLabel,
      rhythmTone,
    };
  }, [weekShapeData]);

  return { weekShapeData, weeklyRhythmInsight };
};
