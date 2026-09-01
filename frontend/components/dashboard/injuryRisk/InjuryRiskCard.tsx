import React, { useMemo } from 'react';
import { Bone, TrendingUp } from 'lucide-react';
import { Tooltip, useTooltip } from '../../ui/Tooltip';
import { SEMI_FANCY_FONT } from '../../../utils/ui/uiConstants';
import { useIsMobile } from '../../insights/useIsMobile';
import { ChartDescription, InsightText } from '../insights/ChartBits';
import {
  getRiskRating,
  getRiskColor,
  INJURY_FACTOR_COLORS,
  INJURY_FACTOR_WEIGHTS,
  INJURY_FACTOR_LABELS,
  type InjuryRiskResult,
} from '../../../utils/analysis/injury/injuryRisk';

const RiskProgressBar: React.FC<{
  acwr: number;
  recovery: number;
  imbalance: number;
}> = ({ acwr, recovery, imbalance }) => {
  const isMobile = useIsMobile(768);
  const TOTAL_PILLS = isMobile ? 6 : 10;

  // Deterministic pill widths: Math.random here reshuffled the bar on every
  // remount (visual jitter + wasted recompute for a purely decorative pattern).
  const pillData = useMemo(() =>
    Array.from({ length: TOTAL_PILLS }).map((_, idx) => {
      const flexGrow = (idx % 3) + 1;
      return { flexGrow, marginLeft: flexGrow > 1 ? '1px' : '2px' };
    }),
    [TOTAL_PILLS],
  );

  const totalFlex = pillData.reduce((sum, p) => sum + p.flexGrow, 0);
  const segs = [
    { color: INJURY_FACTOR_COLORS.acwr, filled: (acwr / 100) * INJURY_FACTOR_WEIGHTS.acwr * totalFlex },
    { color: INJURY_FACTOR_COLORS.recovery, filled: (recovery / 100) * INJURY_FACTOR_WEIGHTS.recovery * totalFlex },
    { color: INJURY_FACTOR_COLORS.imbalance, filled: (imbalance / 100) * INJURY_FACTOR_WEIGHTS.imbalance * totalFlex },
  ];

  let segAcc = 0;
  const segBounds = segs
    .filter(s => s.filled > 0)
    .map(s => { const start = segAcc; segAcc += s.filled; return { ...s, start, end: segAcc }; });
  const totalFilled = segAcc;

  let accumulatedFlex = 0;
  return (
    <div className="flex items-center h-2.5">
      {pillData.map((pill, idx) => {
        const pillStart = accumulatedFlex;
        const pillEnd = accumulatedFlex + pill.flexGrow;
        accumulatedFlex += pill.flexGrow;
        const fillStart = Math.max(pillStart, 0);
        const fillEnd = Math.min(pillEnd, totalFilled);
        const fillAmount = Math.max(0, fillEnd - fillStart);
        const fillPercent = pill.flexGrow > 0 ? ((fillAmount / pill.flexGrow) * 100) : 0;
        const seg = segBounds.find(s => pillStart < s.end);
        return (
          <div key={idx} className="h-full rounded-sm relative overflow-hidden"
            style={{ flexGrow: pill.flexGrow, marginLeft: idx === 0 ? 0 : pill.marginLeft, backgroundColor: 'rgba(100, 100, 100, 0.15)' }}>
            {fillPercent > 0 && (
              <div className="absolute top-0 left-0 h-full rounded-sm"
                style={{ width: `${fillPercent}%`, backgroundColor: seg?.color ?? 'rgba(100,100,100,0.3)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const InjuryRiskCard: React.FC<{
  injuryRiskData: InjuryRiskResult[];
}> = ({ injuryRiskData }) => {
  const { tooltip, showTooltip, hideTooltip } = useTooltip();

  const stats = useMemo(() => {
    if (injuryRiskData.length === 0) return null;
    const avgRisk = injuryRiskData.reduce((sum, r) => sum + r.riskScore, 0) / injuryRiskData.length;
    const worst = [...injuryRiskData].sort((a, b) => b.riskScore - a.riskScore)[0];
    const best = [...injuryRiskData].sort((a, b) => a.riskScore - b.riskScore)[0];
    return { avgRisk, worst, best, count: injuryRiskData.length };
  }, [injuryRiskData]);

  const sortedData = useMemo(() =>
    [...injuryRiskData].sort((a, b) => b.riskScore - a.riskScore),
    [injuryRiskData],
  );

  const acwrColor = (v: number) => v <= 13 ? '#22c55e' : v <= 31 ? '#f59e0b' : '#ef4444';
  const recColor = (v: number) => v <= 9 ? '#22c55e' : v <= 21 ? '#f59e0b' : '#ef4444';
  const imbColor = (v: number) => v <= 7 ? '#22c55e' : v <= 17 ? '#f59e0b' : '#ef4444';

  const handleMouseEnter = (e: React.MouseEvent, r: InjuryRiskResult) => {
    const acwrW = Math.round(r.factors.acwr * INJURY_FACTOR_WEIGHTS.acwr);
    const recW = Math.round(r.factors.recovery * INJURY_FACTOR_WEIGHTS.recovery);
    const imbW = Math.round(r.factors.imbalance * INJURY_FACTOR_WEIGHTS.imbalance);
    const acwrMax = Math.round(INJURY_FACTOR_WEIGHTS.acwr * 100);
    const recMax = Math.round(INJURY_FACTOR_WEIGHTS.recovery * 100);
    const imbMax = Math.round(INJURY_FACTOR_WEIGHTS.imbalance * 100);

    const raw = r.raw;
    const span = (c: string, t: string) => `<span style="color:${c}">${t}</span>`;

    showTooltip(e, {
      title: r.label,
      bodySections: [
        { text: `${span(INJURY_FACTOR_COLORS.acwr, 'Workload:')} ${span(acwrColor(acwrW), `${acwrW}/${acwrMax} — ${raw.acwrRatio}×`)}\n<span style="color:#64748b">This week: ${raw.acuteSets} sets/wk · 4-week avg: ${raw.chronicAvgSets} sets/wk</span>`, color: '' },
        { text: `${span(INJURY_FACTOR_COLORS.recovery, 'Recovery:')} ${span(recColor(recW), `${recW}/${recMax} — ${raw.backToBackDays} back-to-back days`)}\n<span style="color:#64748b">You worked this joint ${raw.workedDays7d} of the last 7 days</span>`, color: '' },
        { text: `${span(INJURY_FACTOR_COLORS.imbalance, 'Balance:')} ${span(imbColor(imbW), `${imbW}/${imbMax} — ${raw.imbalanceRatio}:1 ratio`)}\n<span style="color:#64748b">${raw.antagonistALabel} ${raw.antagonistASetsPerWeek} vs ${raw.antagonistBLabel} ${raw.antagonistBSetsPerWeek} sets/wk</span>`, color: '' },
      ],
      status: r.riskLevel === 'low' ? 'success' : r.riskLevel === 'moderate' ? 'info' : 'warning',
      footer: 'Lower is safer',
    });
  };

  const overallColor = stats ? getRiskColor(stats.avgRisk) : '#22c55e';
  const rating = stats ? getRiskRating(stats.avgRisk) : { label: 'Low', color: '#22c55e' };

  return (
    <div className="bg-black/20 rounded-xl border border-slate-700/50 px-2 sm:px-3 py-4 sm:py-6 min-h-[400px] sm:min-h-[520px] lg:min-h-0 lg:h-full flex flex-col" style={{ backgroundColor: 'rgb(var(--panel-rgb) / 0.5)' }}>
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between mb-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Bone className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xs sm:text-lg font-semibold text-white">Injury Risk</h2>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Lower is safer · Per joint breakdown</p>
            </div>
          </div>
        </div>

        {stats && (
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <svg width="56" height="56" className="transform -rotate-90">
                <circle cx="28" cy="28" r="24" fill="none" strokeWidth="5" stroke="rgba(100, 100, 100, 0.1)" />
                <circle cx="28" cy="28" r="24" fill="none" strokeWidth="5"
                  stroke={overallColor} strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 * (1 - stats.avgRisk / 100)}
                  className="transition-[stroke-dashoffset,stroke] duration-200 ease-out" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[13px] font-bold text-white">{Math.round(stats.avgRisk)}%</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold"
                  style={{ backgroundColor: `${rating.color}20`, color: rating.color }}>
                  {rating.label} Risk
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1 leading-tight">{stats.count} joints analyzed</p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                {stats.best?.label} ({stats.best?.riskScore}%) safest
              </p>
            </div>
          </div>
        )}

        {!stats && (
          <div className="text-[10px] sm:text-xs text-slate-500 py-2">Not enough data for injury risk scoring.</div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pb-3">
        {sortedData.length > 0 ? (
          <div className="space-y-2 pr-1">
            <div className="flex items-center justify-center gap-3 px-1 pt-3">
              {([
                { color: INJURY_FACTOR_COLORS.acwr, label: INJURY_FACTOR_LABELS.acwr },
                { color: INJURY_FACTOR_COLORS.recovery, label: INJURY_FACTOR_LABELS.recovery },
                { color: INJURY_FACTOR_COLORS.imbalance, label: INJURY_FACTOR_LABELS.imbalance },
              ] as const).map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[8px] sm:text-[10px] text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
            {sortedData.map((r) => {
              const riskRating = getRiskRating(r.riskScore);
              return (
                <div key={r.joint}
                  className="flex items-center gap-1 rounded py-0.5 group relative"
                  onMouseEnter={(e) => handleMouseEnter(e, r)}
                  onMouseLeave={hideTooltip}>
                  <span className="text-[10px] sm:text-xs w-[18%] lg:w-[15%] truncate flex-shrink-0 text-slate-400" style={SEMI_FANCY_FONT}>
                    {r.label}
                  </span>
                  <div className="flex-1">
                    <RiskProgressBar acwr={r.factors.acwr} recovery={r.factors.recovery} imbalance={r.factors.imbalance} />
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold w-[8%] text-right flex-shrink-0 text-white">
                    {r.riskScore}%
                  </span>
                  <span className="text-[9px] sm:text-[10px] flex items-center gap-1 w-[15%] lg:w-[13%] flex-shrink-0" style={{ color: riskRating.color }}>
                    <span className="truncate">{riskRating.label}</span>
                    <TrendingUp className="w-3 h-3" />
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[10px] sm:text-xs text-slate-500 py-4 text-center">No joint data available.</div>
        )}
      </div>

      <ChartDescription>
        <InsightText text="The injury risk score estimates joint stress from 0 to 100 percent. It combines three factors: workload ratio compares your recent volume to your 4-week average, recovery checks for back-to-back training days on the same joint, and balance measures antagonist muscle ratios. Lower scores mean safer training. A spike above 40 percent suggests considering a deload or rebalancing your program." />
      </ChartDescription>
      {tooltip && <Tooltip data={tooltip} />}
    </div>
  );
};
