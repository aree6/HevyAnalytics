export type HowItWorksLink = {
  label: string;
  hrefPath: string;
};

export type HowItWorksNode =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'callout'; tone: 'note' | 'warning'; title: string; text: string }
  | { type: 'links'; links: HowItWorksLink[] };

export type HowItWorksSection = {
  id: string;
  title: string;
  sidebarTitle?: string;
  nodes: HowItWorksNode[];
  children?: HowItWorksSection[];
};
