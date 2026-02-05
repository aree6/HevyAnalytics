import type { HowItWorksSection } from './howItWorksTypes';
import { INTRO_SECTIONS } from '../sections/introSections';
import { DATA_NORMALIZATION_SECTION } from '../sections/dataNormalizationSection';
import { KEY_METRICS_SECTION } from '../sections/keyMetricsSections';
import { AI_PRIVACY_SECTIONS } from '../sections/aiPrivacySections';
import { TROUBLESHOOTING_SECTION } from '../sections/troubleshootingSection';

export type { HowItWorksLink, HowItWorksNode, HowItWorksSection } from './howItWorksTypes';

export const HOW_IT_WORKS_SECTIONS: HowItWorksSection[] = [
  ...INTRO_SECTIONS,
  DATA_NORMALIZATION_SECTION,
  KEY_METRICS_SECTION,
  ...AI_PRIVACY_SECTIONS,
  TROUBLESHOOTING_SECTION,
];
