import { format, startOfMonth, startOfYear } from 'date-fns';
import { formatMonthYearContraction, formatYearContraction } from '../../date/dateUtils';
import type { PeriodAverageVolume, RollingWeeklyVolume } from './rollingVolumeTypes';

type PeriodType = 'monthly' | 'yearly';

/**
 * Gets the period key for grouping (e.g., "2024-01" for monthly, "2024" for yearly).
 */
function getPeriodKey(date: Date, periodType: PeriodType): string {
  return periodType === 'monthly'
    ? format(date, 'yyyy-MM')
    : format(date, 'yyyy');
}

/**
 * Gets a human-readable label for the period.
 */
function getPeriodLabel(date: Date, periodType: PeriodType): string {
  return periodType === 'monthly'
    ? formatMonthYearContraction(date)
    : formatYearContraction(date);
}

/**
 * Gets the start date of the period.
 */
function getPeriodStart(date: Date, periodType: PeriodType): Date {
  return periodType === 'monthly' ? startOfMonth(date) : startOfYear(date);
}

/**
 * Aggregates rolling weekly volumes into monthly or yearly averages.
 *
 * This computes the AVERAGE weekly sets per muscle for the period, which is
 * the biologically-meaningful metric for comparing against hypertrophy recommendations.
 *
 * Key behaviors:
 * - Excludes rolling volumes from days returning from breaks (>7 day gaps)
 * - Averages are computed only from valid training weeks
 * - Empty periods are not included in results
 *
 * @param rollingVolumes - Rolling weekly volumes for each training day
 * @param periodType - 'monthly' or 'yearly'
 */
export function computePeriodAverageVolumes(
  rollingVolumes: readonly RollingWeeklyVolume[],
  periodType: PeriodType
): PeriodAverageVolume[] {
  interface PeriodBucket {
    key: string;
    label: string;
    startDate: Date;
    volumes: RollingWeeklyVolume[];
  }

  const buckets = new Map<string, PeriodBucket>();

  for (const rv of rollingVolumes) {
    if (rv.isInBreak) continue; // Skip break return days

    const periodKey = getPeriodKey(rv.date, periodType);
    let bucket = buckets.get(periodKey);
    if (!bucket) {
      bucket = {
        key: periodKey,
        startDate: getPeriodStart(rv.date, periodType),
        label: getPeriodLabel(rv.date, periodType),
        volumes: [],
      };
      buckets.set(periodKey, bucket);
    }
    bucket.volumes.push(rv);
  }

  const periodAverages: PeriodAverageVolume[] = [];

  for (const bucket of buckets.values()) {
    if (bucket.volumes.length === 0) continue;

    const muscleSums = new Map<string, number>();
    let totalSetsSum = 0;

    for (const volume of bucket.volumes) {
      for (const [muscle, sets] of volume.muscles) {
        muscleSums.set(muscle, (muscleSums.get(muscle) ?? 0) + sets);
      }
      totalSetsSum += volume.totalSets;
    }

    const weeksIncluded = bucket.volumes.length;
    const avgWeeklySets = new Map<string, number>();

    for (const [muscle, total] of muscleSums) {
      avgWeeklySets.set(muscle, total / weeksIncluded);
    }

    periodAverages.push({
      periodKey: bucket.key,
      periodLabel: bucket.label,
      startDate: bucket.startDate,
      endDate: bucket.volumes[bucket.volumes.length - 1].date,
      avgWeeklySets,
      totalAvgSets: totalSetsSum / weeksIncluded,
      trainingDaysCount: bucket.volumes.length,
      weeksIncluded,
    });
  }

  return periodAverages.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}
