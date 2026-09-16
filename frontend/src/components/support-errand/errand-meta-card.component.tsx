import { ErrandStatusLabel } from '@components/support-errands/errand-status-label.component';
import { PriorityLabel } from '@components/support-errands/priority-label.component';
import { Errand } from '@data-contracts/backend/data-contracts';
import { formatDateTime } from '@utils/date-time';
import { FC, ReactNode } from 'react';

const MetaItem: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-8 min-w-0">
    <span className="text-small font-bold">{label}</span>
    <span className="text-small text-dark-secondary">{children}</span>
  </div>
);

/** The summary card under the errand title: status, errand number, priority, received date and applicants. */
export const ErrandMetaCard: FC<{ errand: Errand; applicantNames: string[] }> = ({ errand, applicantNames }) => (
  <div className="bg-background-content border-1 border-divider rounded-12 px-16 py-12 flex flex-wrap items-start gap-x-40 xl:gap-x-64 gap-y-16">
    <MetaItem label="Status">
      {errand.status ?
        <ErrandStatusLabel status={errand.status} />
      : '—'}
    </MetaItem>
    <MetaItem label="Ärendenummer">{errand.errandNumber ?? '—'}</MetaItem>
    <MetaItem label="Prioritet">
      <PriorityLabel priority={errand.priority} />
    </MetaItem>
    <MetaItem label="Inkom">{formatDateTime(errand.created) || '—'}</MetaItem>
    <MetaItem label={applicantNames.length > 1 ? 'Sökande och medsökande' : 'Sökande'}>
      {applicantNames.length > 0 ? applicantNames.join(', ') : '—'}
    </MetaItem>
  </div>
);
