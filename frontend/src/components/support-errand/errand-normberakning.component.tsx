'use client';

import { useErrandNormberakning } from '@hooks/use-errand-normberakning';
import { Spinner, Tabs } from '@sk-web-gui/react';
import { FC, useState } from 'react';

import { NormberakningIncomes } from './normberakning-incomes.component';

/**
 * Placeholder for the sub-views the caremanagement API does not expose yet (the result/summering,
 * family, expenses, special expenses and common costs are computed in Lifecare and not readable here).
 */
const PlaceholderView: FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col gap-8 py-24">
    <h3 className="text-h4-sm md:text-h4-md m-0">{title}</h3>
    <p className="m-0 text-dark-secondary">
      Den här vyn kräver utökat stöd i caremanagement-API:t. Idag exponeras bara inkomstraderna –
      resultat, familj, utgifter, speciella utgifter och gemensamma kostnader beräknas i Lifecare och
      går inte att läsa ut ännu.
    </p>
  </div>
);

/**
 * The "Normberäkning" tab. caremanagement only exposes the editable income draft today, so INKOMSTER is
 * functional (edit amounts + add rows) while the other sub-views are placeholders until the API exposes
 * the calculated result. The sub-tabs mirror the Lifecare layout (Summering / Familj / Inkomster / …).
 */
export const ErrandNormberakning: FC<{ errandId: string }> = ({ errandId }) => {
  const { draft, isLoading, error, refresh } = useErrandNormberakning(errandId);
  const [activeTab, setActiveTab] = useState<number>(0);

  if (isLoading) {
    return (
      <div className="flex justify-center my-32">
        <Spinner size={4} />
      </div>
    );
  }

  if (error) {
    return <p className="my-32">Det gick inte att hämta normberäkningen ({String(error)})</p>;
  }

  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-2">
        <span className="text-small text-dark-secondary">Period (ansökningsmånad)</span>
        <span className="font-bold">{draft?.applicationMonth ?? '—'}</span>
      </div>

      <Tabs size="sm" current={activeTab} onTabChange={setActiveTab}>
        <Tabs.Item>
          <Tabs.Button>Summering</Tabs.Button>
          <Tabs.Content>
            <PlaceholderView title="Summering" />
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Familj</Tabs.Button>
          <Tabs.Content>
            <PlaceholderView title="Familj" />
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Inkomster</Tabs.Button>
          <Tabs.Content>
            <NormberakningIncomes errandId={errandId} rows={draft?.rows ?? []} onSaved={refresh} />
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Utgifter</Tabs.Button>
          <Tabs.Content>
            <PlaceholderView title="Utgifter" />
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Speciella utgifter</Tabs.Button>
          <Tabs.Content>
            <PlaceholderView title="Speciella utgifter" />
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Gemensamma kostnader</Tabs.Button>
          <Tabs.Content>
            <PlaceholderView title="Gemensamma kostnader" />
          </Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </div>
  );
};
