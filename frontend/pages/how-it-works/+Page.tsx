export { Page };

import React from 'react';
import { InfoShell } from '../../components/info/InfoShell';
import { HowItWorksDoc } from '../../components/howItWorks/HowItWorksDoc';

function Page() {
  return (
    <InfoShell
      activeNav="how-it-works"
      title="How LiftShift works"
      subtitle="Import your workout history, compute insights locally, and explore dashboards that actually help you train smarter."
    >
      <HowItWorksDoc showTitle={false} />
    </InfoShell>
  );
}
