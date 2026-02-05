import React from 'react';
import { Brain, Clock } from 'lucide-react';
import { ViewHeader } from '../../layout/ViewHeader';

interface DashboardHeaderBarProps {
  totalWorkouts: number;
  filtersSlot?: React.ReactNode;
  stickyHeader: boolean;
  onAIAnalyze: () => void;
}

export const DashboardHeaderBar: React.FC<DashboardHeaderBarProps> = ({
  totalWorkouts,
  filtersSlot,
  stickyHeader,
  onAIAnalyze,
}) => (
  <div className="hidden sm:contents">
    <ViewHeader
      leftStats={[{ icon: Clock, value: totalWorkouts, label: 'Workouts' }]}
      filtersSlot={filtersSlot}
      sticky={stickyHeader}
      rightSlot={
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <div className="relative inline-flex items-center justify-center">
              <div className="meteor-border-track">
                <div className="meteor-premium" />
                <div className="meteor-border-mask" />
              </div>
              <button
                onClick={onAIAnalyze}
                className="relative z-[2] inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md text-xs font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-9 px-3 py-1.5 bg-transparent text-slate-200 hover:text-white hover:bg-white/5 transition-all duration-200"
                title="AI Analyze"
              >
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">AI Analyze</span>
              </button>
            </div>
          </div>
        </div>
      }
    />
  </div>
);
