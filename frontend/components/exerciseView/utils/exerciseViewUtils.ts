export const getTargetTextColor = (sets: number, maxSets: number): string => {
  const ratio = sets / Math.max(maxSets, 1);
  return ratio >= 0.55 ? '#ffffff' : '#0f172a';
};

export const capitalizeLabel = (s: string): string => {
  const trimmed = String(s ?? '').trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};
