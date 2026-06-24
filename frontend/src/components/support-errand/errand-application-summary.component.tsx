'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { useErrandFormSnapshot } from '@hooks/use-errand-form-snapshot';
import { Spinner } from '@sk-web-gui/react';
import { FC } from 'react';

import { ErrandApplicationData } from './errand-application-data.component';
import { FormSnapshotView } from './form-snapshot-view.component';

/**
 * The Ansökan "sammanställning": re-renders the captured application form snapshot ("as it was") when one
 * exists, otherwise falls back to the live structured application data. The CASE_DATA sammanställnings-PDF
 * is rendered alongside this by the Ansökan tab.
 */
export const ErrandApplicationSummary: FC<{ errandId: string; errand: Errand }> = ({ errandId, errand }) => {
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
  return snapshot ? <FormSnapshotView snapshot={snapshot} /> : <ErrandApplicationData errand={errand} />;
};
