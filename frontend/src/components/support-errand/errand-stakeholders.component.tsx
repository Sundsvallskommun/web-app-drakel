'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { Stakeholder } from '@data-contracts/backend/data-contracts';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { stakeholderDisplayName } from '@utils/stakeholder-name';
import { compareByRole, stakeholderRoleLabel } from '@utils/stakeholder-role';
import { FC } from 'react';

import { ContentBox } from './content-box.component';
import { PersonCard } from './person-card.component';

const stakeholderContactChannels = (stakeholder: Stakeholder): string[] => {
  const channels = (stakeholder.contactChannels ?? [])
    .map((channel) => channel.value)
    .filter((value): value is string => !!value && value.length > 0);
  return channels.length > 0 ? channels : ['Inga kontaktuppgifter'];
};

/** Formats the (Citizen-enriched) address as "c/o …, Gatan 1, 852 31 Sundsvall". Empty when unknown. */
const stakeholderAddress = (stakeholder: Stakeholder): string => {
  const postal = [stakeholder.zipCode, stakeholder.city].filter(Boolean).join(' ');
  return [stakeholder.careOf ? `c/o ${stakeholder.careOf}` : undefined, stakeholder.address, postal]
    .filter(Boolean)
    .join(', ');
};

/** Groups the (role-ordered) stakeholders by their role label, keeping the order of first appearance. */
const groupByRoleLabel = (stakeholders: Stakeholder[]): { roleLabel: string; members: Stakeholder[] }[] => {
  const groups = new Map<string, Stakeholder[]>();
  stakeholders.forEach((stakeholder) => {
    const roleLabel = stakeholderRoleLabel(stakeholder.role) || 'Intressent';
    groups.set(roleLabel, [...(groups.get(roleLabel) ?? []), stakeholder]);
  });
  return [...groups.entries()].map(([roleLabel, members]) => ({ roleLabel, members }));
};

/** Lists an errand's stakeholders (read-only), one grey box per role with a card per person. */
export const ErrandStakeholders: FC<{ errandId: string }> = ({ errandId }) => {
  const { stakeholders, isLoading, error } = useErrandStakeholders(errandId);

  if (isLoading || error || stakeholders.length === 0) {
    return (
      <AsyncContent
        isLoading={isLoading}
        error={error}
        errorText="Det gick inte att hämta intressenter"
        isEmpty
        emptyText="Inga intressenter"
      >
        {null}
      </AsyncContent>
    );
  }

  // Sökande (applicant) first, then co-applicant etc.
  const roleGroups = groupByRoleLabel([...stakeholders].sort(compareByRole));

  return (
    <div className="flex flex-col gap-40">
      {roleGroups.map(({ roleLabel, members }) => (
        <ContentBox key={roleLabel} title={roleLabel}>
          {members.map((stakeholder, index) => (
            <PersonCard
              key={stakeholder.id ?? index}
              name={stakeholderDisplayName(stakeholder)}
              detailColumns={[
                [stakeholder.personalNumber, stakeholderAddress(stakeholder)],
                stakeholderContactChannels(stakeholder),
              ]}
            />
          ))}
        </ContentBox>
      ))}
    </div>
  );
};
