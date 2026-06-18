'use client';

import { NormPersonRow } from '@services/normberakning-service';
import { Button, Icon, Table } from '@sk-web-gui/react';
import { Check, Plus } from 'lucide-react';
import { FC } from 'react';

const ROLE_LABELS: Record<string, string> = {
  APPLICANT: 'Sökande',
  CO_APPLICANT: 'Medsökande',
  CHILD: 'Barn',
  UMGANGESBARN: 'Umgängesbarn',
};

const days = (value?: number): string => (value == null ? '—' : String(value));

/**
 * FAMILJ section of the draft normberäkning — the persons the norm covers (read-only for now). The
 * "Lägg till"-actions are visual placeholders until per-row person editing is wired.
 */
export const NormberakningFamilj: FC<{ persons: NormPersonRow[] }> = ({ persons }) => {
  const visiblePersons = persons.filter((person) => !person.deleted);

  return (
    <div className="flex flex-col gap-16 py-24">
      <div className="flex flex-wrap gap-12">
        <Button variant="secondary" leftIcon={<Plus />} disabled>
          Lägg till ny person
        </Button>
        <Button variant="secondary" leftIcon={<Plus />} disabled>
          Lägg till nytt umgängesbarn
        </Button>
      </div>

      <Table dense background>
        <Table.Header>
          <Table.HeaderColumn>Omfattas</Table.HeaderColumn>
          <Table.HeaderColumn>Namn</Table.HeaderColumn>
          <Table.HeaderColumn>Roll</Table.HeaderColumn>
          <Table.HeaderColumn>Ingår från</Table.HeaderColumn>
          <Table.HeaderColumn>Ingår till</Table.HeaderColumn>
          <Table.HeaderColumn>Dagar</Table.HeaderColumn>
          <Table.HeaderColumn>Normintervall</Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {visiblePersons.length === 0 ?
            <Table.Row>
              <Table.Column>Inga personer</Table.Column>
            </Table.Row>
          : visiblePersons.map((person, index) => (
              <Table.Row key={person.id ?? index}>
                <Table.Column>
                  {person.included ?
                    <Icon icon={<Check />} aria-label="Omfattas" />
                  : <span className="sr-only">Omfattas inte</span>}
                </Table.Column>
                <Table.Column>{person.name ?? '—'}</Table.Column>
                <Table.Column>{ROLE_LABELS[person.role ?? ''] ?? person.role ?? '—'}</Table.Column>
                <Table.Column>{person.deviationFromDate ?? '—'}</Table.Column>
                <Table.Column>{person.deviationToDate ?? '—'}</Table.Column>
                <Table.Column className="tabular-nums">{days(person.effectiveDays)}</Table.Column>
                <Table.Column>{person.normInterval ?? '—'}</Table.Column>
              </Table.Row>
            ))
          }
        </Table.Body>
      </Table>

      <p className="text-small text-dark-secondary m-0">
        Familjeraderna kommer från beräkningen. Redigering (omfattas/dagar/personer) kan kopplas på när det behövs.
      </p>
    </div>
  );
};
