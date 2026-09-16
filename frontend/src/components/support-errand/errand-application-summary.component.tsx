'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { Errand, FormSnapshot } from '@data-contracts/backend/data-contracts';
import { useErrandFormSnapshot } from '@hooks/use-errand-form-snapshot';
import dayjs from 'dayjs';
import { FC, ReactNode } from 'react';

import { ErrandApplicationData } from './errand-application-data.component';
import { ErrandSectionHeader } from './errand-section-header.component';
import { FormSnapshotView } from './form-snapshot-view.component';

/** "Ansökan om ekonomiskt bistånd så som sökanden fyllde i den, ifylld 2026-09-01 12:00." */
const snapshotDescription = (snapshot: FormSnapshot): string => {
  const capturedAt = snapshot.capturedAt ? `, ifylld ${dayjs(snapshot.capturedAt).format('YYYY-MM-DD HH:mm')}` : '';
  return `${snapshot.title ?? 'Sammanställningen'} så som sökanden fyllde i den${capturedAt}.`;
};

const LIVE_DATA_DESCRIPTION = 'Uppgifterna som sökanden lämnade i ansökan via Mina sidor.';

/**
 * Fliken "Ansökan": the heading (with `action`, e.g. the "Visa pdf" button) followed by the
 * "sammanställning" — the captured application form snapshot ("as it was") when one exists, otherwise the
 * live structured application data.
 */
export const ErrandApplicationSummary: FC<{ errandId: string; errand: Errand; action?: ReactNode }> = ({
  errandId,
  errand,
  action,
}) => {
  const { snapshot, isLoading } = useErrandFormSnapshot(errandId);

  const description =
    isLoading ? undefined
    : snapshot ? snapshotDescription(snapshot)
    : LIVE_DATA_DESCRIPTION;

  // A captured snapshot is the authoritative "as it was" sammanställning; without one (older errands) we
  // fall back to the live structured application data so there's always a readable summary.
  return (
    <>
      <ErrandSectionHeader title="Ansökan" description={description} action={action} />
      <AsyncContent isLoading={isLoading} errorText="" centered>
        {snapshot ?
          <FormSnapshotView snapshot={snapshot} />
        : <ErrandApplicationData errand={errand} />}
      </AsyncContent>
    </>
  );
};
