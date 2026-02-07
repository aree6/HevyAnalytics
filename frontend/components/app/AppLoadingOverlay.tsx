import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { CsvLoadingAnimation } from '../modals/csvImport/CsvLoadingAnimation';

interface AppLoadingOverlayProps {
  open: boolean;
  loadingStep: number;
  progress: number;
}

// Phase-specific sequential rotating messages (10 per step = 30s total coverage)
const STEP_0_MESSAGES = [
  'Initializing...',
  'Setting up workspace...',
  'Preparing environment...',
  'Getting ready to sync...',
  'Configuring application...',
  'Initializing services...',
  'Preparing to connect...',
  'Loading configuration...',
  'Almost ready to begin...',
];

const STEP_1_MESSAGES = [
  'Connecting to servers...',
  'Establishing connection...',
  'Sending data request...',
  'Requesting workout data...',
  'Fetching workout history...',
  'Downloading records...',
  'Receiving workout data...',
  'Processing sets and reps...',
  'Syncing with servers...',
];

const STEP_2_MESSAGES = [
  'Building dashboard...',
  'Creating visualizations...',
  'Generating analytics...',
  'Setting up interface...',
  'Preparing charts...',
  'Building workout views...',
  'Calculating display data...',
  'Rendering components...',
  'Almost complete...',
];

const getMessagesForStep = (step: number): string[] => {
  switch (step) {
    case 0:
      return STEP_0_MESSAGES;
    case 1:
      return STEP_1_MESSAGES;
    case 2:
    default:
      return STEP_2_MESSAGES;
  }
};

const STEP_LABELS = [
  'Initializing',
  'Processing workout data',
  'Building dashboard',
];

// Hook to rotate messages sequentially through phase-specific list
const useRotatingMessage = (
  currentStep: number,
  intervalMs: number = 1000
): string => {
  const [index, setIndex] = useState(0);
  const messages = getMessagesForStep(currentStep);

  useEffect(() => {
    setIndex(0);

    const interval = setInterval(() => {
      setIndex((prev) => {
        // Only rotate within the phase's message list
        if (prev < messages.length - 1) {
          return prev + 1;
        }
        return prev; // Stay on last message
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [currentStep, intervalMs]);

  return messages[index] || '';
};

export const AppLoadingOverlay: React.FC<AppLoadingOverlayProps> = ({
  open,
  loadingStep,
  progress,
}) => {
  if (!open) return null;

  const progressPercent = Math.round(progress);
  const currentLabel = useRotatingMessage(loadingStep, 1000);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in px-4 sm:px-6">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col items-center">
        <CsvLoadingAnimation className="mb-6" size={160} />
        <h2 className="text-2xl font-bold text-white mb-2">Crunching your numbers</h2>
        <p className="text-slate-400 mb-6 text-center">
          Syncing your workouts and preparing your dashboard.
        </p>

        <div className="w-full space-y-3">
          {STEP_LABELS.map((label, index) => {
            const isCompleted = loadingStep > index;
            const isActive = loadingStep === index;
            const isPending = loadingStep < index;

            // Show rotating message only on active step
            const displayLabel = isActive ? currentLabel : label;

            return (
              <div
                key={index}
                className={`flex items-center space-x-3 text-sm transition-all duration-300 ${
                  isActive ? 'opacity-100' : isCompleted ? 'opacity-70' : 'opacity-40'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-700 flex-shrink-0" />
                )}
                <span className={isPending ? 'text-slate-600' : 'text-slate-300'}>
                  {displayLabel}
                </span>
              </div>
            );
          })}

          <div className="mt-4 pt-2">
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-blue-600 transition-all duration-200"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
            <div className="text-right text-[10px] text-slate-500 mt-1">{progressPercent}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
