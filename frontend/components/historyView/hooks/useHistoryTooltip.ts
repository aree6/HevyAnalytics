import { useCallback, useState } from 'react';
import type { AnalysisResult, SetWisdom, StructuredTooltip } from '../../types';
import type { TooltipState } from './HistoryTooltipPortal';

export const useHistoryTooltip = () => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const buildTooltipState = useCallback((rect: DOMRect, data: any, variant: 'set' | 'macro'): TooltipState => {
    let title = '';
    let body = '';
    let status: AnalysisResult['status'] = 'info';
    let metrics: TooltipState['metrics'];
    let structured: StructuredTooltip | undefined;

    if (variant === 'set') {
      const insight = data as AnalysisResult;
      title = insight.shortMessage;
      body = insight.tooltip;
      status = insight.status;
      structured = insight.structured;
      if (!structured) {
        metrics = [{ label: 'Vol', value: insight.metrics.vol_drop_pct }, { label: 'Weight', value: insight.metrics.weight_change_pct }];
      }
    } else if (variant === 'macro') {
      const insight = data as SetWisdom;
      title = insight.message;
      body = insight.tooltip || '';
      status = insight.type === 'promote' ? 'success' : insight.type === 'demote' ? 'warning' : 'info';
    }

    return { rect, title, body, status, metrics, structured };
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent, data: any, variant: 'set' | 'macro') => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip(buildTooltipState(rect, data, variant));
  }, [buildTooltipState]);

  const handleTooltipToggle = useCallback((e: React.MouseEvent, data: any, variant: 'set' | 'macro') => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const next = buildTooltipState(rect, data, variant);

    setTooltip((prev) => {
      if (!prev) return next;
      const isSame = prev.title === next.title && prev.body === next.body;
      return isSame ? null : next;
    });
  }, [buildTooltipState]);

  return {
    tooltip,
    setTooltip,
    handleMouseEnter,
    handleTooltipToggle,
  };
};
