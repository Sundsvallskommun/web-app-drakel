'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { Errand, FormSnapshot } from '@data-contracts/backend/data-contracts';
import { useErrandFormSnapshot } from '@hooks/use-errand-form-snapshot';
import { formatDateTime } from '@utils/date-time';
import type { TFunction } from 'i18next';
import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrandApplicationData } from './errand-application-data.component';
import { ErrandSectionHeader } from './errand-section-header.component';
import { FormSnapshotView } from './form-snapshot-view.component';

/** "Ansökan om ekonomiskt bistånd så som sökanden fyllde i den, ifylld 2026-09-01 12:00." */
const snapshotDescription = (t: TFunction, snapshot: FormSnapshot): string => {
  // The snapshot title is form data and stays untranslated; interpolate it unescaped (React escapes it).
  const title = snapshot.title ?? t('application:summary.snapshotFallbackTitle');
  const interpolation = { escapeValue: false };
  return snapshot.capturedAt ?
      t('application:summary.snapshotDescriptionWithDate', {
        title,
        capturedAt: formatDateTime(snapshot.capturedAt),
        interpolation,
      })
    : t('application:summary.snapshotDescription', { title, interpolation });
};

/**
 * Fliken "Ansökan": the heading (with `action`, e.g. the "Visa pdf" button) followed by the
 * "sammanställning" — the captured application form snapshot ("as it was") when one exists, otherwise the
 * live structured application data. A snapshot that could not be read is an error, not a missing snapshot:
 * falling back to the live data then would pass today's data off as what the citizen submitted.
 */
export const ErrandApplicationSummary: FC<{ errandId: string; errand: Errand; action?: ReactNode }> = ({
  errandId,
  errand,
  action,
}) => {
  const { t } = useTranslation('application');
  const { snapshot, isLoading, error } = useErrandFormSnapshot(errandId);

  const description =
    isLoading || error ? undefined
    : snapshot ? snapshotDescription(t, snapshot)
    : t('summary.liveDataDescription');

  // A captured snapshot is the authoritative "as it was" sammanställning; without one (older errands) we
  // fall back to the live structured application data so there's always a readable summary.
  return (
    <>
      <ErrandSectionHeader title={t('summary.title')} description={description} action={action} />
      <AsyncContent isLoading={isLoading} error={error} errorText={t('summary.snapshotError')} centered>
        {snapshot ?
          <FormSnapshotView snapshot={snapshot} />
        : <ErrandApplicationData errand={errand} />}
      </AsyncContent>
    </>
  );
};
