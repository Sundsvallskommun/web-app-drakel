'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { useErrandFormSnapshot } from '@hooks/use-errand-form-snapshot';
import { Spinner } from '@sk-web-gui/react';
import { FC, ReactNode } from 'react';

import { ErrandApplicationData } from './errand-application-data.component';
import { FormSnapshotView } from './form-snapshot-view.component';

/**
 * The Ansökan "sammanställning": re-renders the captured application form snapshot ("as it was") when one
 * exists, otherwise falls back to the live structured application data. `action` (e.g. the "Visa pdf"
 * button) is shown to the right of the sammanställning's title.
 */
export const ErrandApplicationSummary: FC<{ errandId: string; errand: Errand; action?: ReactNode }> = ({
  errandId,
  errand,
  action,
}) => {
  const { snapshot, isLoading } = useErrandFormSnapshot(errandId);

  if (isLoading) {
    return (
      <div className="flex justify-center my-32">
        <Spinner size={3} />
      </div>
    );
  }

  // A captured snapshot is the authoritative "as it was" sammanställning; without one (older errands) we
  // fall back to the live structured application data so there's always a readable summary.
  if (snapshot) {
    return <FormSnapshotView snapshot={snapshot} action={action} />;
  }
  return (
    <div className="flex flex-col gap-16">
      {action ? <div className="flex justify-end">{action}</div> : null}
      <ErrandApplicationData errand={errand} />
    </div>
  );
};
