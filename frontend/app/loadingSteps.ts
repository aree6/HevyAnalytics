export const APP_LOADING_STEPS = {
  INIT: 0,
  PROCESS: 1,
  BUILD: 2,
} as const;

export type AppLoadingStep = (typeof APP_LOADING_STEPS)[keyof typeof APP_LOADING_STEPS];
