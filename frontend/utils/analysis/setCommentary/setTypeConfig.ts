/**
 * Standard set type identifiers used throughout the application.
 * These are the normalized values stored in set_type field.
 */
export type SetTypeId =
  | 'normal'
  | 'warmup'
  | 'left'
  | 'right'
  | 'dropset'
  | 'failure'
  | 'amrap'
  | 'restpause'
  | 'myoreps'
  | 'cluster'
  | 'giantset'
  | 'superset'
  | 'backoff'
  | 'topset'
  | 'feederset'
  | 'partial';

/**
 * Configuration for each set type including display properties.
 */
export interface SetTypeConfig {
  id: SetTypeId;
  label: string;           // Full display name
  shortLabel: string;      // Single letter or short code for compact display
  color: string;           // Tailwind color class for the indicator
  bgColor: string;         // Background color class
  borderColor: string;     // Border color class
  description: string;     // Tooltip description
  isWorkingSet: boolean;   // Whether this counts as a working set (not warmup)
}

/**
 * Complete set type configuration registry.
 * Add new set types here to support them throughout the app.
 */
export const SET_TYPE_CONFIG: Record<SetTypeId, SetTypeConfig> = {
  normal: {
    id: 'normal',
    label: 'Working Set',
    shortLabel: '',  // No indicator for normal sets - shows number
    color: 'text-white',
    bgColor: 'bg-black/50',
    borderColor: 'border-slate-700',
    description: 'Standard working set',
    isWorkingSet: true,
  },
  warmup: {
    id: 'warmup',
    label: 'Warm-up',
    shortLabel: 'W',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
    description: 'Warm-up set - not counted in working set totals',
    isWorkingSet: false,
  },
  left: {
    id: 'left',
    label: 'Left Side',
    shortLabel: 'L',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/20',
    borderColor: 'border-sky-500/50',
    description: 'Left side unilateral set',
    isWorkingSet: true,
  },
  right: {
    id: 'right',
    label: 'Right Side',
    shortLabel: 'R',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/50',
    description: 'Right side unilateral set',
    isWorkingSet: true,
  },
  dropset: {
    id: 'dropset',
    label: 'Drop Set',
    shortLabel: 'D',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20',
    borderColor: 'border-rose-500/50',
    description: 'Drop set - reduced weight continuation',
    isWorkingSet: true,
  },
  failure: {
    id: 'failure',
    label: 'Failure',
    shortLabel: 'X',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
    description: 'Set taken to muscular failure',
    isWorkingSet: true,
  },
  amrap: {
    id: 'amrap',
    label: 'AMRAP',
    shortLabel: 'A',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/50',
    description: 'As Many Reps As Possible',
    isWorkingSet: true,
  },
  restpause: {
    id: 'restpause',
    label: 'Rest-Pause',
    shortLabel: 'RP',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/50',
    description: 'Rest-pause technique set',
    isWorkingSet: true,
  },
  myoreps: {
    id: 'myoreps',
    label: 'Myo Reps',
    shortLabel: 'M',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50',
    description: 'Myo reps activation set',
    isWorkingSet: true,
  },
  cluster: {
    id: 'cluster',
    label: 'Cluster',
    shortLabel: 'C',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/50',
    description: 'Cluster set with intra-set rest',
    isWorkingSet: true,
  },
  giantset: {
    id: 'giantset',
    label: 'Giant Set',
    shortLabel: 'G',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/50',
    description: 'Part of a giant set circuit',
    isWorkingSet: true,
  },
  superset: {
    id: 'superset',
    label: 'Superset',
    shortLabel: 'S',
    color: 'text-fuchsia-400',
    bgColor: 'bg-fuchsia-500/20',
    borderColor: 'border-fuchsia-500/50',
    description: 'Part of a superset pair',
    isWorkingSet: true,
  },
  backoff: {
    id: 'backoff',
    label: 'Back-off Set',
    shortLabel: 'B',
    color: 'text-lime-400',
    bgColor: 'bg-lime-500/20',
    borderColor: 'border-lime-500/50',
    description: 'Back-off set with reduced intensity',
    isWorkingSet: true,
  },
  topset: {
    id: 'topset',
    label: 'Top Set',
    shortLabel: 'T',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/50',
    description: 'Top set - heaviest working set',
    isWorkingSet: true,
  },
  feederset: {
    id: 'feederset',
    label: 'Feeder Set',
    shortLabel: 'F',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/50',
    description: 'Feeder set for blood flow',
    isWorkingSet: true,
  },
  partial: {
    id: 'partial',
    label: 'Partial Reps',
    shortLabel: 'P',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    borderColor: 'border-pink-500/50',
    description: 'Partial range of motion reps',
    isWorkingSet: true,
  },
};
