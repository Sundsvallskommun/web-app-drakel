'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { Errand, FormSnapshot } from '@data-contracts/backend/data-contracts';
import { useErrandFormSnapshot } from '@hooks/use-errand-form-snapshot';
import dayjs from 'dayjs';
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
        capturedAt: dayjs(snapshot.capturedAt).format('YYYY-MM-DD HH:mm'),
        interpolation,
      })
    : t('application:summary.snapshotDescription', { title, interpolation });
};

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
  const { t } = useTranslation('application');
  const { snapshot, isLoading } = useErrandFormSnapshot(errandId);

  const description =
    isLoading ? undefined
    : snapshot ? snapshotDescription(t, snapshot)
    : t('summary.liveDataDescription');

  // A captured snapshot is the authoritative "as it was" sammanställning; without one (older errands) we
  // fall back to the live structured application data so there's always a readable summary.
  return (
    <>
      <ErrandSectionHeader title={t('summary.title')} description={description} action={action} />
      <AsyncContent isLoading={isLoading} errorText="" centered>
        {snapshot ?
          <FormSnapshotView snapshot={snapshot} />
        : <ErrandApplicationData errand={errand} />}
      </AsyncContent>
    </>
  );
};
