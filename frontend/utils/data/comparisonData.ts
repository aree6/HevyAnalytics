import { COMPARISON_FILES, COMPARISON_ITEMS } from './comparisonItems';
import type { ComparisonData, ComparisonItem } from './comparisonTypes';

export type { ComparisonItem, ComparisonData } from './comparisonTypes';

// Comparison data mapping SVG filenames to weight, label, and playful descriptions
// Used in FlexView to compare user's total volume lifted to real-world objects

export const COMPARISON_DATA: ComparisonData = {
  instruction: {
    selectionRule:
      "On every page reload, randomly pick one file; if the user's lifted weight is 0, show a special zero-lift message and don't compare; otherwise select the closest mapped item by weight (or use the random pick if you prefer), then display its label and description.",
  },
  allFiles: COMPARISON_FILES,
  items: COMPARISON_ITEMS,
};

export const findClosestComparison = (
  volumeKg: number
): { filename: string; item: ComparisonItem; count: number } | null => {
  if (volumeKg <= 0) return null;

  const entries = Object.entries(COMPARISON_DATA.items);
  if (entries.length === 0) return null;

  let closestFilename = entries[0][0];
  let closestItem = entries[0][1];
  let closestDiff = Math.abs(volumeKg - closestItem.weight);

  for (const [filename, item] of entries) {
    const diff = Math.abs(volumeKg - item.weight);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestFilename = filename;
      closestItem = item;
    }
  }

  const count = Math.round((volumeKg / closestItem.weight) * 10) / 10;

  return { filename: closestFilename, item: closestItem, count };
};

export const findBestComparison = (
  volumeKg: number
): { filename: string; item: ComparisonItem; count: number } | null => {
  if (volumeKg <= 0) return null;

  const entries = Object.entries(COMPARISON_DATA.items);
  if (entries.length === 0) return null;

  let bestFilename = '';
  let bestItem: ComparisonItem | null = null;
  let bestCount = 0;
  let bestScore = Infinity;

  for (const [filename, item] of entries) {
    const count = volumeKg / item.weight;
    const roundedCount = Math.round(count * 2) / 2; // nearest 0.5
    if (roundedCount < 0.5) continue;

    const diff = Math.abs(count - roundedCount);
    const score = diff + (roundedCount > 1000 ? 0.5 : 0);

    if (score < bestScore) {
      bestScore = score;
      bestFilename = filename;
      bestItem = item;
      bestCount = roundedCount;
    }
  }

  if (!bestItem) {
    return findClosestComparison(volumeKg);
  }

  return { filename: bestFilename, item: bestItem, count: bestCount };
};

export const getRandomComparison = (): { filename: string; item: ComparisonItem } => {
  const files = COMPARISON_DATA.allFiles;
  const randomFile = files[Math.floor(Math.random() * files.length)];
  return { filename: randomFile, item: COMPARISON_DATA.items[randomFile] };
};

export const formatLargeNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return num.toFixed(1).replace(/\.0$/, '');
};
