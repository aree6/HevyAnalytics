import React from 'react';
import { BodyMap, BodyMapGender } from '../../bodyMap/BodyMap';
import { HEADLESS_MUSCLE_NAMES } from '../../../utils/muscle/mapping';
import type { TooltipState } from './HistoryTooltipPortal';

interface HistorySessionBodyMapProps {
  headlessVolumes: Map<string, number>;
  headlessMaxVolume: number;
  bodyMapGender: BodyMapGender;
  setTooltip: (state: TooltipState | null) => void;
}

export const HistorySessionBodyMap: React.FC<HistorySessionBodyMapProps> = ({
  headlessVolumes,
  headlessMaxVolume,
  bodyMapGender,
  setTooltip,
}) => (
  <BodyMap
    onPartClick={() => { }}
    selectedPart={null}
    muscleVolumes={headlessVolumes}
    maxVolume={headlessMaxVolume}
    compact
    compactFill
    interactive
    gender={bodyMapGender}
    viewMode="headless"
    onPartHover={(muscleId, ev) => {
      if (!muscleId || !ev) {
        setTooltip(null);
        return;
      }
      const hoveredEl = (ev.target as Element | null)?.closest('g[id]');
      const rect = hoveredEl?.getBoundingClientRect();
      if (!rect) return;
      const label = (HEADLESS_MUSCLE_NAMES as any)[muscleId] || muscleId;
      const sets = headlessVolumes.get(muscleId) || 0;
      const setsText = Number.isInteger(sets) ? `${sets}` : `${sets.toFixed(1)}`;
      setTooltip({ rect, title: label, body: `${setsText} sets`, status: 'info' });
    }}
  />
);
