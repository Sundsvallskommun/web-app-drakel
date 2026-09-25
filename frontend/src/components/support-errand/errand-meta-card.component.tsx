'use client';

import { ErrandStatusLabel } from '@components/support-errands/errand-status-label.component';
import { Errand } from '@data-contracts/backend/data-contracts';
import { formatDateTime } from '@utils/date-time';
import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const MetaItem: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-8 min-w-0">
    <span className="text-small font-bold">{label}</span>
    <span className="text-small text-dark-secondary">{children}</span>
  </div>
);

/** The summary card under the errand title: status, errand number, received date, applicants and their personnummer. */
export const ErrandMetaCard: FC<{ errand: Errand; applicantNames: string[]; applicantPersonalNumbers: string[] }> = ({
  errand,
  applicantNames,
  applicantPersonalNumbers,
}) => {
  const { t } = useTranslation('errand');
  return (
    <div className="bg-background-content border-1 border-divider rounded-12 px-16 py-12 flex flex-wrap items-start gap-x-40 xl:gap-x-64 gap-y-16">
      <MetaItem label={t('metaCard.status')}>
        {errand.status ?
          <ErrandStatusLabel status={errand.status} />
        : t('common:none')}
      </MetaItem>
      <MetaItem label={t('metaCard.errandNumber')}>{errand.errandNumber ?? t('common:none')}</MetaItem>
      <MetaItem label={t('metaCard.received')}>{formatDateTime(errand.created) || t('common:none')}</MetaItem>
      <MetaItem label={applicantNames.length > 1 ? t('metaCard.applicantAndCoApplicant') : t('metaCard.applicant')}>
        {applicantNames.length > 0 ? applicantNames.join(', ') : t('common:none')}
      </MetaItem>
      <MetaItem label={t('metaCard.personalNumber')}>
        <span className="tabular-nums">
          {applicantPersonalNumbers.length > 0 ? applicantPersonalNumbers.join(', ') : t('common:none')}
        </span>
      </MetaItem>
    </div>
  );
};
