export interface ComparisonItem {
  weight: number; // in kg
  label: string;
  description: string;
}

export interface ComparisonData {
  instruction: {
    selectionRule: string;
  };
  allFiles: string[];
  items: Record<string, ComparisonItem>;
}
