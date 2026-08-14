import React from 'react';
import { formatDeltaPercentage, getDeltaFormatPreset } from '../../../utils/format/deltaFormat';
import {
  BadgeLabel,
  ChartDescription,
  getTrendBadgeTone,
  InsightLine,
  InsightText,
  ShiftedMeta,
  TrendBadge,
  TrendIcon,
} from '../insights/ChartBits';
import { Reveal } from '../../ui/Reveal';
import { MuscleTrendHeader } from './MuscleTrendHeader';
import { MuscleTrendChart } from './MuscleTrendChart';
import { SEMI_FANCY_FONT } from '../../../utils/ui/uiConstants';

type MuscleGrouping = 'groups' | 'muscles';
type MusclePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';
type MuscleTrendView = 'area' | 'stackedBar';

type MuscleTrendInsight = {
  totalDelta: { direction: 'up' | 'down' | 'same'; deltaPercent: number };
  biggestMover?: { k: string; deltaPercent: number; direction: 'up' | 'down' | 'same' };
} | null;

const formatSignedPctWithNoun = (pct: number, noun: string) =>
  `${formatDeltaPercentage(pct, getDeltaFormatPreset('badge'))} ${noun}`;

export const MuscleTrendCard = ({
  muscleGrouping,
  setMuscleGrouping,
  musclePeriod,
  setMusclePeriod,
  muscleTrendView,
  setMuscleTrendView,
  trendData,
  trendKeys,
  muscleTrendInsight,
  tooltipStyle,
  muscleVsLabel,
}: {
  muscleGrouping: MuscleGrouping;
  setMuscleGrouping: (v: MuscleGrouping) => void;
  musclePeriod: MusclePeriod;
  setMusclePeriod: (v: MusclePeriod) => void;
  muscleTrendView: MuscleTrendView;
  setMuscleTrendView: (v: MuscleTrendView) => void;
  trendData: any[];
  trendKeys: string[];
  muscleTrendInsight: MuscleTrendInsight;
  tooltipStyle: Record<string, unknown>;
  muscleVsLabel: string;
}) => (
  <Reveal className="bg-black/20 border border-slate-700/50 px-2 sm:px-3 py-4 sm:py-6 rounded-xl min-h-[400px] sm:min-h-[520px] flex flex-col transition-colors duration-300 min-w-0" style={{ backgroundColor: 'rgb(var(--panel-rgb) / 0.5)' }}>
    <MuscleTrendHeader
      muscleGrouping={muscleGrouping}
      setMuscleGrouping={setMuscleGrouping}
      musclePeriod={musclePeriod}
      setMusclePeriod={setMusclePeriod}
      muscleTrendView={muscleTrendView}
      setMuscleTrendView={setMuscleTrendView}
    />

    <div
      className="flex-1 w-full min-h-[250px] sm:min-h-[320px] min-w-0"
    >
      <MuscleTrendChart
        trendData={trendData}
        trendKeys={trendKeys}
        muscleGrouping={muscleGrouping}
        musclePeriod={musclePeriod}
        muscleTrendView={muscleTrendView}
        tooltipStyle={tooltipStyle}
      />
    </div>

    <ChartDescription>
      <InsightLine>
        {muscleTrendInsight ? (
          <>
            <TrendBadge
              label={
                <BadgeLabel
                  main={
                    <span className="inline-flex items-center gap-1">
                      <TrendIcon direction={muscleTrendInsight.totalDelta.direction} />
                      <span>{formatSignedPctWithNoun(muscleTrendInsight.totalDelta.deltaPercent, 'sets')}</span>
                    </span>
                  }
                  meta={muscleVsLabel}
                />
              }
              tone={getTrendBadgeTone(muscleTrendInsight.totalDelta.deltaPercent, { goodWhen: 'up' })}
            />
            {muscleTrendInsight.biggestMover ? (
              <TrendBadge
                label={
                  <BadgeLabel
                    main={
                      <span className="inline-flex items-center gap-1">
                        <TrendIcon direction={muscleTrendInsight.biggestMover.direction} />
                        <span style={SEMI_FANCY_FONT}>{muscleTrendInsight.biggestMover.k}</span>
                      </span>
                    }
                    meta={
                      <ShiftedMeta>
                        <span>
                          {`biggest mover: ${formatDeltaPercentage(
                            muscleTrendInsight.biggestMover.deltaPercent,
                            getDeltaFormatPreset('badge')
                          )}`}
                        </span>
                      </ShiftedMeta>
                    }
                  />
                }
                tone={
                  muscleTrendInsight.biggestMover.deltaPercent === 0
                    ? 'neutral'
                    : muscleTrendInsight.biggestMover.deltaPercent > 0
                      ? 'good'
                      : 'bad'
                }
              />
            ) : null}
          </>
        ) : (
          <TrendBadge label="Building baseline" tone="neutral" />
        )}
      </InsightLine>

      <InsightText text="Use this to spot volume drift. If one area rises while others fade, you are gradually specializing. This can be intentional, or accidental." />
    </ChartDescription>
  </Reveal>
);
