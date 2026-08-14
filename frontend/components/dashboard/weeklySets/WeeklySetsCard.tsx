import React, { useMemo, useState, useCallback } from 'react';
import { formatDeltaPercentage } from '../../../utils/format/deltaFormat';
import { type BodyMapGender } from '../../bodyMap/BodyMap';
import { ChartDescription, InsightLine, InsightText, TrendBadge, BadgeLabel } from '../insights/ChartBits';
import { toMuscleVolumeMap, MUSCLE_NAMES, getMuscleIdForDetailedSvgId } from '../../../utils/muscle/mapping';
import { getMuscleRadarSeries } from '../../../utils/muscle/mapping';
import { differenceInCalendarDays } from 'date-fns';
import { isPlausibleDate } from '../../../utils/date/dateUtils';
import { WeeklySetsHeader } from './WeeklySetsHeader';
import { WeeklySetsRadarView } from './WeeklySetsRadarView';
import { WeeklySetsHeatmapView } from './WeeklySetsHeatmapView';
import { Reveal } from '../../ui/Reveal';
import { Tooltip, type TooltipData } from '../../ui/Tooltip';
import { weeklyStimulusFromThresholds } from '../../../utils/muscle/hypertrophy/hypertrophyCalculations';
import { getVolumeThresholds, getVolumeZoneColor, getVolumeZone, type TrainingLevel } from '../../../utils/muscle/hypertrophy/muscleParams';

type WeeklySetsView = 'radar' | 'heatmap';
type WeeklySetsWindow = 'all' | '7d' | '30d' | '365d';

type HeatmapData = {
  volumes: Map<string, number>;
  maxVolume: number;
};

const formatWindowDuration = (days: number): string => {
  if (days <= 7) return `${days} wk`;
  if (days <= 30) return `${Math.round(days / 7)} wk`;
  if (days <= 365) return `${Math.round(days / 30)} mo`;
  return `${Math.round(days / 365)} yr`;
};

const safePct = (n: number, d: number) => (d > 0 ? (n / d) * 100 : 0);

export const WeeklySetsCard = ({
  weeklySetsView,
  setWeeklySetsView,
  muscleCompQuick,
  setMuscleCompQuick,
  heatmap,
  tooltipStyle,
  onMuscleClick,
  bodyMapGender,
  windowStart,
  now,
  trainingLevel,
}: {
  weeklySetsView: WeeklySetsView;
  setWeeklySetsView: (v: WeeklySetsView) => void;
  muscleCompQuick: WeeklySetsWindow;
  setMuscleCompQuick: (v: WeeklySetsWindow) => void;
  heatmap: HeatmapData;
  tooltipStyle: Record<string, unknown>;
  onMuscleClick?: (muscleId: string, weeklySetsWindow: 'all' | '7d' | '30d' | '365d') => void;
  bodyMapGender?: BodyMapGender;
  windowStart?: Date | null;
  now: Date;
  trainingLevel: TrainingLevel;
}) => {
  const [heatmapHoveredMuscle, setHeatmapHoveredMuscle] = useState<string | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<TooltipData | null>(null);

  const muscleVolumes = useMemo(() => toMuscleVolumeMap(heatmap.volumes), [heatmap.volumes]);
  const radarData = useMemo(() => getMuscleRadarSeries(muscleVolumes), [muscleVolumes]);
  const volumeThresholds = useMemo(() => getVolumeThresholds(trainingLevel), [trainingLevel]);

  const handleMuscleHover = useCallback((muscleId: string | null, e?: MouseEvent) => {
    if (!muscleId || !e) {
      setHoverTooltip(null);
      setHeatmapHoveredMuscle(null);
      return;
    }

    const target = e.target as Element | null;
    const groupEl = target?.closest?.('g[id]') as Element | null;
    const rect = groupEl?.getBoundingClientRect?.() as DOMRect | undefined;
    if (!rect) {
      setHoverTooltip(null);
      return;
    }

    setHeatmapHoveredMuscle(muscleId);

    const mappedId = getMuscleIdForDetailedSvgId(muscleId) ?? muscleId;
    const rate = muscleVolumes.get(mappedId) || 0;
    const stimulus = weeklyStimulusFromThresholds(rate, volumeThresholds);
    const zone = getVolumeZone(rate, volumeThresholds);
    const bodyText = `avg ${rate.toFixed(1)} sets/wk (${zone.label})\n${stimulus}% of wkly possible gains\n${zone.explanation}`;

    setHoverTooltip({
      rect,
      title: (MUSCLE_NAMES as any)[mappedId] ?? mappedId,
      body: bodyText,
      status: rate > 0 ? 'success' : 'default',
    });
  }, [muscleVolumes, volumeThresholds]);

  const weeklySetsInsight = useMemo(() => {
    const hasData = radarData.some((d) => (d.value ?? 0) > 0);
    if (!hasData) return null;
    const total = radarData.reduce((acc, d) => acc + (d.value || 0), 0);
    const sorted = [...radarData].filter((d) => (d.value ?? 0) > 0).sort((a, b) => (b.value || 0) - (a.value || 0));
    const top = sorted[0];
    if (!top) return null;
    const top3 = sorted.slice(0, 3).reduce((acc, d) => acc + (d.value || 0), 0);
    const top3Share = total > 0 ? safePct(top3, total) : 0;

    let durationLabel = '';
    if (windowStart && isPlausibleDate(windowStart) && isPlausibleDate(now)) {
      const days = differenceInCalendarDays(now, windowStart) + 1;
      durationLabel = ` (${formatWindowDuration(days)})`;
    }

    return { total, top, top3Share, durationLabel };
  }, [radarData, windowStart, now]);

  const heatmapHoveredMuscleIds = heatmapHoveredMuscle ? [heatmapHoveredMuscle] : undefined;

  const handleBodyMapClick = (muscleId: string) => {
    if (!onMuscleClick) return;
    const isDesktop = typeof window === 'undefined' ? true : (window.matchMedia?.('(min-width: 640px)')?.matches ?? true);
    if (!isDesktop) return;
    onMuscleClick(muscleId, muscleCompQuick);
  };

  return (
    <Reveal className="bg-black/20 border border-slate-700/50 p-4 sm:p-6 rounded-xl min-h-[400px] sm:min-h-[480px] flex flex-col transition-colors duration-300 min-w-0" style={{ backgroundColor: 'rgb(var(--panel-rgb) / 0.5)' }}>
      <WeeklySetsHeader
        weeklySetsView={weeklySetsView}
        setWeeklySetsView={setWeeklySetsView}
        muscleCompQuick={muscleCompQuick}
        setMuscleCompQuick={setMuscleCompQuick}
      />

      <div
        className="relative z-10 flex-1 w-full min-h-[250px] sm:min-h-[300px] min-w-0 pb-10"
      >
        {weeklySetsView === 'radar' ? (
          <WeeklySetsRadarView radarData={radarData} tooltipStyle={tooltipStyle} />
        ) : (
          <WeeklySetsHeatmapView
            heatmap={heatmap}
            muscleVolumes={muscleVolumes}
            heatmapHoveredMuscleIds={heatmapHoveredMuscleIds}
            onBodyMapClick={handleBodyMapClick}
            bodyMapGender={bodyMapGender}
            onMuscleHover={handleMuscleHover}
            volumeThresholds={volumeThresholds}
          />
        )}
      </div>

      {weeklySetsView === 'heatmap' && heatmap.volumes.size > 0 ? (
        <div className="sm:hidden -mt-12 text-center text-[11px] sm:text-xs font-semibold text-slate-500">
          Tap on the muscles
        </div>
      ) : null}

      <ChartDescription
       
      >
        <InsightLine>
          {weeklySetsInsight ? (
            <>
              <TrendBadge
                label={<BadgeLabel main={`~${Number(weeklySetsInsight.total).toFixed(1)} sets/wk${weeklySetsInsight.durationLabel}`} />}
                tone="info"
              />
              <TrendBadge
                label={`Top: ${weeklySetsInsight.top.subject} ${Number(weeklySetsInsight.top.value).toFixed(1)} sets/wk`}
                tone="neutral"
              />
              <TrendBadge
                label={`Top3 ${formatDeltaPercentage(weeklySetsInsight.top3Share)}`}
                tone={
                  weeklySetsInsight.top3Share >= 70
                    ? 'bad'
                    : weeklySetsInsight.top3Share >= 55
                      ? 'neutral'
                      : 'good'
                }
              />
            </>
          ) : (
            <TrendBadge label="Building baseline" tone="neutral" />
          )}
        </InsightLine>
        <InsightText text="Read this as your weekly set allocation. If the Top 3 share is high, your volume is concentrated. This is great for specialization, but watch balance." />
      </ChartDescription>

      {hoverTooltip && <Tooltip data={hoverTooltip} />}
    </Reveal>
  );
};
