import React from 'react';
import type { ExerciseAsset } from '../../../utils/data/exerciseAssets';
import { formatDeltaPercentage, getDeltaFormatPreset } from '../../../utils/format/deltaFormat';
import {
  BadgeLabel,
  ChartDescription,
  getTrendBadgeTone,
  InsightLine,
  InsightText,
  TrendBadge,
  TrendIcon,
} from '../insights/ChartBits';
import { formatVsPrevRollingWindow } from '../../../utils/date/dateUtils';
import { TopExercisesHeader } from './TopExercisesHeader';
import { TopExercisesBarView } from './TopExercisesBarView';
import { TopExercisesAreaView } from './TopExercisesAreaView';

export type TopExerciseMode = 'all' | 'weekly' | 'monthly' | 'yearly';
export type TopExercisesView = 'barh' | 'area';

export type TopExerciseBarDatum = { name: string; count: number };

export type TopExercisesInsight = {
  windowLabel: string;
  delta: { direction: 'up' | 'down' | 'same'; deltaPercent: number } | null;
  top: TopExerciseBarDatum | undefined;
  topShare: number;
};

export const TopExercisesCard = ({
  isMounted,
  topExerciseMode,
  setTopExerciseMode,
  topExercisesView,
  setTopExercisesView,
  topExercisesBarData,
  topExercisesOverTimeData,
  topExerciseNames,
  topExercisesInsight,
  pieColors,
  tooltipStyle,
  onExerciseClick,
  assetsMap,
  assetsLowerMap,
}: {
  isMounted: boolean;
  topExerciseMode: TopExerciseMode;
  setTopExerciseMode: (m: TopExerciseMode) => void;
  topExercisesView: TopExercisesView;
  setTopExercisesView: (v: TopExercisesView) => void;
  topExercisesBarData: TopExerciseBarDatum[];
  topExercisesOverTimeData: any[];
  topExerciseNames: string[];
  topExercisesInsight: TopExercisesInsight;
  pieColors: string[];
  tooltipStyle: Record<string, unknown>;
  onExerciseClick?: (exerciseName: string) => void;
  assetsMap: Map<string, ExerciseAsset> | null;
  assetsLowerMap: Map<string, ExerciseAsset> | null;
}) => {
  const windowDays = topExerciseMode === 'weekly' ? 7 : topExerciseMode === 'yearly' ? 365 : 30;
  const vsPrevLabel = formatVsPrevRollingWindow(windowDays);

  return (
    <div className="bg-black/70 border border-slate-700/50 p-4 sm:p-6 rounded-xl min-h-[360px] flex flex-col transition-all duration-300 min-w-0">
      <TopExercisesHeader
        isMounted={isMounted}
        topExerciseMode={topExerciseMode}
        setTopExerciseMode={setTopExerciseMode}
        topExercisesView={topExercisesView}
        setTopExercisesView={setTopExercisesView}
      />

      <div
        className={`flex-1 w-full min-h-[300px] transition-all duration-700 delay-100 ${
          isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        } min-w-0`}
      >
        {topExercisesView === 'barh' ? (
          <TopExercisesBarView
            topExercisesBarData={topExercisesBarData}
            pieColors={pieColors}
            onExerciseClick={onExerciseClick}
            assetsMap={assetsMap}
            assetsLowerMap={assetsLowerMap}
          />
        ) : (
          <TopExercisesAreaView
            topExercisesOverTimeData={topExercisesOverTimeData}
            topExerciseNames={topExerciseNames}
            pieColors={pieColors}
            tooltipStyle={tooltipStyle}
          />
        )}
      </div>

      <ChartDescription isMounted={isMounted}>
        <InsightLine>
          {topExercisesInsight.windowLabel === 'All time' ? (
            <>
              <TrendBadge label="All time" tone="info" />
              {topExercisesInsight.top ? (
                <TrendBadge label={<BadgeLabel main={`Top: ${topExercisesInsight.top.name}`} />} tone="neutral" />
              ) : null}
              {topExercisesInsight.top ? (
                <TrendBadge
                  label={<BadgeLabel main={`${formatDeltaPercentage(topExercisesInsight.topShare)}`} meta="of all sets" />}
                  tone="neutral"
                />
              ) : null}
            </>
          ) : (
            <>
              {topExercisesInsight.delta ? (
                <TrendBadge
                  label={
                    <BadgeLabel
                      main={
                        <span className="inline-flex items-center gap-1">
                          <TrendIcon direction={topExercisesInsight.delta.direction} />
                          <span>
                            {formatDeltaPercentage(topExercisesInsight.delta.deltaPercent, getDeltaFormatPreset('badge'))} sets
                          </span>
                        </span>
                      }
                      meta={vsPrevLabel}
                    />
                  }
                  tone={getTrendBadgeTone(topExercisesInsight.delta.deltaPercent, { goodWhen: 'up' })}
                />
              ) : (
                <TrendBadge label="Building baseline" tone="neutral" />
              )}
              {topExercisesInsight.top ? (
                <TrendBadge label={<BadgeLabel main={`Top: ${topExercisesInsight.top.name}`} />} tone="neutral" />
              ) : null}
              {topExercisesInsight.top ? (
                <TrendBadge
                  label={<BadgeLabel main={`${formatDeltaPercentage(topExercisesInsight.topShare)}`} meta="of all sets" />}
                  tone={
                    topExercisesInsight.topShare >= 45 ? 'bad' : topExercisesInsight.topShare >= 30 ? 'neutral' : 'good'
                  }
                />
              ) : null}
            </>
          )}

          {topExercisesInsight.top ? (
            <TrendBadge
              label={
                topExercisesInsight.topShare >= 45
                  ? 'Variety is low'
                  : topExercisesInsight.topShare >= 30
                    ? 'Variety is ok'
                    : 'Variety is high'
              }
              tone={topExercisesInsight.topShare >= 45 ? 'bad' : topExercisesInsight.topShare >= 30 ? 'neutral' : 'good'}
            />
          ) : null}
        </InsightLine>
        <InsightText text="This highlights your most frequent exercise. The percentage shows its share of all sets in this window. If one movement dominates, consider adding more variety to avoid overuse." />
      </ChartDescription>
    </div>
  );
};
