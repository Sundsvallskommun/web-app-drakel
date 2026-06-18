'use client';

import { Table } from '@sk-web-gui/react';
import { FC } from 'react';

import { NormberakningSummaBox } from './normberakning-summa-box.component';

/**
 * Lifecare's UTGIFTER / LEVNADSKOSTNADER I ÖVRIGT views share the same shape (Typ · Ansökt · Godkänt ·
 * Anmärkning). Both are computed in Lifecare and not exposed by caremanagement, so this is a structural
 * shell parameterised by its total label.
 */
export const NormberakningCostTable: FC<{ summaLabel: string }> = ({ summaLabel }) => (
  <div className="flex flex-col gap-16 py-24">
    <NormberakningSummaBox label={summaLabel} value="—" />

    <Table dense background>
      <Table.Header>
        <Table.HeaderColumn>Typ</Table.HeaderColumn>
        <Table.HeaderColumn>Ansökt</Table.HeaderColumn>
        <Table.HeaderColumn>Godkänt</Table.HeaderColumn>
        <Table.HeaderColumn>Anmärkning</Table.HeaderColumn>
      </Table.Header>
    </Table>

    <p className="text-small text-dark-secondary m-0">
      Exponeras inte av caremanagement-API:t ännu – visuell grund.
    </p>
  </div>
);
