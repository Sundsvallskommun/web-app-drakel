'use client';

import { Stakeholder } from '@data-contracts/backend/data-contracts';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { Avatar, Spinner } from '@sk-web-gui/react';
import { getInitials } from '@utils/get-initials';
import { stakeholderDisplayName } from '@utils/stakeholder-name';
import { compareByRole, stakeholderRoleLabel } from '@utils/stakeholder-role';
import { FC } from 'react';

const stakeholderContact = (stakeholder: Stakeholder): string => {
  const channels = stakeholder.contactChannels
    ?.map((channel) => channel.value)
    .filter(Boolean)
    .join(' · ');
  return channels !== undefined && channels.length > 0 ? channels : 'Inga kontaktuppgifter';
};

/** Formats the (Citizen-enriched) address as "c/o …, Gatan 1, 852 31 Sundsvall". Empty when unknown. */
const stakeholderAddress = (stakeholder: Stakeholder): string => {
  const postal = [stakeholder.zipCode, stakeholder.city].filter(Boolean).join(' ');
  return [stakeholder.careOf ? `c/o ${stakeholder.careOf}` : undefined, stakeholder.address, postal]
    .filter(Boolean)
    .join(', ');
};

/** Lists an errand's stakeholders (read-only) as cards. Editing or adding is not allowed. */
export const ErrandStakeholders: FC<{ errandId: string }> = ({ errandId }) => {
  const { stakeholders, isLoading, error } = useErrandStakeholders(errandId);

  if (isLoading) {
    return <Spinner size={3} />;
  }
  if (error) {
    return <p className="m-0">Det gick inte att hämta intressenter ({String(error)})</p>;
  }
  if (stakeholders.length === 0) {
    return <p className="m-0">Inga intressenter</p>;
  }

  // Sökande (applicant) first, then co-applicant etc.
  const orderedStakeholders = [...stakeholders].sort(compareByRole);

  return (
    <div className="flex flex-col gap-16">
      {orderedStakeholders.map((stakeholder, index) => (
        <div
          key={stakeholder.id ?? index}
          className="border-1 border-divider rounded-12 overflow-hidden bg-background-content"
        >
          <div className="bg-vattjom-surface-primary text-white px-16 py-8 font-bold">
            {stakeholderRoleLabel(stakeholder.role) || 'Intressent'}
          </div>
          <div className="p-16 flex items-center gap-16">
            <Avatar initials={getInitials(stakeholderDisplayName(stakeholder))} rounded color="vattjom" />
            <div className="flex flex-col">
              <span className="font-bold">{stakeholderDisplayName(stakeholder)}</span>
              {stakeholder.personalNumber ?
                <span className="text-small text-dark-secondary">Personnummer: {stakeholder.personalNumber}</span>
              : null}
              <span className="text-small">{stakeholderContact(stakeholder)}</span>
              {stakeholderAddress(stakeholder) ?
                <span className="text-small text-dark-secondary">{stakeholderAddress(stakeholder)}</span>
              : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
