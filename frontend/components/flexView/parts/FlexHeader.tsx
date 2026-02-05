import React from 'react';
import { Dumbbell, Weight } from 'lucide-react';

import { ViewHeader } from '../../layout/ViewHeader';
import { formatLargeNumber } from '../../../utils/data/comparisonData';
import type { WeightUnit } from '../../../utils/storage/localStorage';
import type { FlexStats } from '../utils/flexViewTypes';

interface FlexHeaderProps {
  stats: FlexStats;
  weightUnit: WeightUnit;
  filtersSlot?: React.ReactNode;
  stickyHeader?: boolean;
}

export const FlexHeader: React.FC<FlexHeaderProps> = ({
  stats,
  weightUnit,
  filtersSlot,
  stickyHeader = false,
}) => (
  <div className="hidden sm:contents">
    <ViewHeader
      leftStats={[{ icon: Dumbbell, value: stats.totalSets, label: 'Total Sets' }]}
      rightStats={[{ icon: Weight, value: `${formatLargeNumber(stats.totalVolume)} ${weightUnit}`, label: 'Volume' }]}
      filtersSlot={filtersSlot}
      sticky={stickyHeader}
    />
  </div>
);
