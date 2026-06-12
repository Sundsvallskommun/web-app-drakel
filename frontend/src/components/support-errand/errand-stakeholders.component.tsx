'use client';

import { Stakeholder } from '@data-contracts/backend/data-contracts';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { getInitials } from '@utils/get-initials';
import { Avatar, Button, Spinner } from '@sk-web-gui/react';
import { Plus } from 'lucide-react';
import { FC, useState } from 'react';

import { ErrandStakeholderForm } from './errand-stakeholder-form.component';

const stakeholderName = (stakeholder: Stakeholder): string =>
  stakeholder.organizationName || [stakeholder.firstName, stakeholder.lastName].filter(Boolean).join(' ') || 'Okänd intressent';

const stakeholderContact = (stakeholder: Stakeholder): string =>
  stakeholder.contactChannels
    ?.map((channel) => channel.value)
    .filter(Boolean)
    .join(' · ') || 'Inga kontaktuppgifter';

/** Lists an errand's stakeholders (via the dedicated endpoint) as cards and lets the user add new ones. */
export const ErrandStakeholders: FC<{ errandId: string }> = ({ errandId }) => {
  const { stakeholders, isLoading, error, refresh } = useErrandStakeholders(errandId);
  const [showForm, setShowForm] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-16">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" leftIcon={<Plus />} onClick={() => setShowForm(true)}>
          Lägg till intressent
        </Button>
      </div>

      {isLoading ? (
        <Spinner size={3} />
      ) : error ? (
        <p className="m-0">Det gick inte att hämta intressenter ({String(error)})</p>
      ) : stakeholders.length === 0 ? (
        <p className="m-0">Inga intressenter</p>
      ) : (
        stakeholders.map((stakeholder, index) => (
          <div
            key={stakeholder.id ?? index}
            className="border-1 border-divider rounded-12 overflow-hidden bg-background-content"
          >
            <div className="bg-vattjom-surface-primary text-white px-16 py-8 font-bold">
              {stakeholder.role || 'Intressent'}
            </div>
            <div className="p-16 flex items-center gap-16">
              <Avatar initials={getInitials(stakeholderName(stakeholder))} rounded color="vattjom" />
              <div className="flex flex-col">
                <span className="font-bold">{stakeholderName(stakeholder)}</span>
                <span className="text-small">{stakeholderContact(stakeholder)}</span>
              </div>
            </div>
          </div>
        ))
      )}

      <ErrandStakeholderForm
        errandId={errandId}
        show={showForm}
        onClose={() => setShowForm(false)}
        onSaved={refresh}
      />
    </div>
  );
};
