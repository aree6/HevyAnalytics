import React from 'react';
import type { StatusResult } from '../trend/exerciseTrendUi';

// Helper to parse color markers from evidence strings
// Format: [[GREEN]]+value[[/GREEN]] or [[RED]]-value[[/RED]]
export const renderEvidenceWithColoredSigns = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  const regex = /\[\[(GREEN|RED)\]\](.+?)\[\[\/(GREEN|RED)\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    const color = match[1];
    const value = match[2];
    const colorClass = color === 'GREEN' ? 'text-emerald-400' : 'text-rose-400';
    parts.push(
      <span key={`colored-${match.index}`} className={colorClass}>
        {value}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`text-end`}>{text.slice(lastIndex)}</span>);
  }

  if (parts.length === 0) {
    return text;
  }

  return <>{parts}</>;
};

export const getTrendEvidenceTitle = (status: StatusResult | undefined, evidenceLine: string): string | undefined => {
  if (!status) return undefined;
  const core = status.core;
  const c = core.calculation;
  const clean = (t: string) => String(t).replace(/\[\[(GREEN|RED)\]\]|\[\[\/(GREEN|RED)\]\]/g, '');

  const windowSize = c ? Math.max(0, c.windowSize) : 0;
  const subject = core.isBodyweightLike ? 'reps' : 'strength';

  const directionVerb = (pct: number | undefined): string => {
    if (!Number.isFinite(pct)) return 'changed';
    if ((pct as number) > 0) return 'increased';
    if ((pct as number) < 0) return 'decreased';
    return 'stayed about the same';
  };

  if (/^(Strength|Reps):\s/.test(evidenceLine)) {
    const pct = core.diffPct;
    const v = directionVerb(pct);
    const valueOnly = clean(evidenceLine).replace(/^(Strength|Reps):\s*/, '');
    if (windowSize > 0) {
      return `Your ${subject} has ${v} by ${valueOnly} based on your last ${windowSize} sessions.`;
    }
    return `Your ${subject} has ${v} by ${valueOnly} based on your recent sessions.`;
  }

  if (/^Recent( reps)?:\s/.test(evidenceLine)) {
    if (c?.historyLen && c.historyLen >= 2) {
      const valueOnly = clean(evidenceLine).replace(/^Recent( reps)?:\s*/, '');
      return `Your latest session ${subject === 'strength' ? 'performance' : 'reps'} changed by ${valueOnly} compared to the session right before it.`;
    }
    return `This is your latest-session change: ${clean(evidenceLine)}.`;
  }

  return clean(evidenceLine);
};
