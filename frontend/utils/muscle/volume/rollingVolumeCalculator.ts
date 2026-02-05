/**
 * Rolling Volume Calculator
 *
 * Computes biologically-meaningful training volume metrics using rolling windows
 * rather than calendar boundaries. This approach eliminates calendar artifacts
 * and provides accurate weekly set counts that can be compared against
 * hypertrophy recommendations (typically 10-20 sets per muscle per week).
 */

export * from './rollingVolumeTypes';
export * from './rollingVolumeDaily';
export * from './rollingVolumeBreaks';
export * from './rollingVolumeWeekly';
export * from './rollingVolumePeriods';
export * from './rollingVolumeTimeSeries';
export * from './rollingVolumeFacade';
