import React from 'react';
import { Activity } from 'lucide-react';

export const ExerciseEmptyState: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4 border border-dashed border-slate-800 rounded-xl bg-black/40">
    <div className="p-4 bg-black/70 rounded-full">
      <Activity className="w-10 h-10 opacity-50" />
    </div>
    <p className="font-medium text-sm text-center px-4">Select an exercise</p>
  </div>
);
