export enum Tab {
  DASHBOARD = 'dashboard',
  EXERCISES = 'exercises',
  HISTORY = 'history',
  MUSCLE_ANALYSIS = 'muscle-analysis',
  FLEX = 'flex',
}

export const getTabFromPathname = (pathname: string): Tab => {
  const normalized = (pathname || '/').replace(/\/+$/g, '') || '/';
  if (normalized === '/' || normalized === '/dashboard') return Tab.DASHBOARD;
  if (normalized === `/${Tab.EXERCISES}`) return Tab.EXERCISES;
  if (normalized === `/${Tab.HISTORY}`) return Tab.HISTORY;
  if (normalized === `/${Tab.MUSCLE_ANALYSIS}`) return Tab.MUSCLE_ANALYSIS;
  if (normalized === `/${Tab.FLEX}`) return Tab.FLEX;
  return Tab.DASHBOARD;
};

export const getPathForTab = (tab: Tab): string => {
  if (tab === Tab.DASHBOARD) return '/';
  return `/${tab}`;
};

export const parseLocalDateFromYyyyMmDd = (value: string): Date | null => {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return null;
  return new Date(year, monthIndex, day);
};
