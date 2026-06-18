'use client';

import { useErrandNormberakning } from '@hooks/use-errand-normberakning';
import { FormControl, FormLabel, Input, Spinner, Tabs } from '@sk-web-gui/react';
import { FC, ReactNode, useState } from 'react';

import { NormberakningExpenses } from './normberakning-expenses.component';
import { NormberakningFamilj } from './normberakning-familj.component';
import { NormberakningGemensamma } from './normberakning-gemensamma.component';
import { NormberakningIncomes } from './normberakning-incomes.component';

const FilterField: FC<{ label: string; required?: boolean; children: ReactNode }> = ({
  label,
  required = false,
  children,
}) => (
  <FormControl className="w-[14rem]">
    <FormLabel className="text-small">
      {label}
      {required ? ' *' : ''}
    </FormLabel>
    {children}
  </FormControl>
);

/**
 * The "Normberäkning" tab, laid out like Lifecare's Beräkning view (header + sub-tabs FAMILJ /
 * INKOMSTER / UTGIFTER / LEVNADSKOSTNADER I ÖVRIGT / GEMENSAMMA KOSTNADER). The draft mirrors Lifecare
 * FC: incomes and expenses are editable; the final result (Underskott/Överskott) is computed in Lifecare
 * and not exposed by the API yet.
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

  if (!draft) {
    return (
      <p className="my-24 text-dark-secondary">
        Ingen normberäkning har skapats för det här ärendet ännu. Draften skapas automatiskt när
        inkomstunderlaget (SSBTEK) har hämtats.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-24">
      <h2 className="text-h3-sm md:text-h3-md m-0">Beräkning</h2>

      <div className="flex flex-wrap items-start justify-between gap-24">
        <div className="flex flex-wrap items-end gap-12">
          <FilterField label="Från" required>
            <Input readOnly size="sm" value={draft.calculationFromDate ?? ''} placeholder="—" />
          </FilterField>
          <FilterField label="Till" required>
            <Input readOnly size="sm" value={draft.calculationToDate ?? ''} placeholder="—" />
          </FilterField>
          <FilterField label="Norm" required>
            <Input readOnly size="sm" value={draft.normType ?? ''} placeholder="—" />
          </FilterField>
          <FilterField label="Beräkningsdatum">
            <Input readOnly size="sm" value={draft.calculationDate ?? ''} placeholder="—" />
          </FilterField>
          <FilterField label="Avser ansökan">
            <Input readOnly size="sm" value={draft.applicationMonth ?? ''} placeholder="—" />
          </FilterField>
        </div>

        {/* The result (Underskott/Överskott) is computed in Lifecare and not exposed by the API yet. */}
        <div className="border-1 border-divider bg-background-200 rounded-8 px-24 py-16 min-w-[20rem]">
          <span className="font-bold block">Resultat</span>
          <span className="text-small text-dark-secondary">Beräknas i Lifecare – ej tillgängligt via API ännu</span>
        </div>
      </div>

      <Tabs size="sm" current={activeTab} onTabChange={setActiveTab}>
        <Tabs.Item>
          <Tabs.Button>Familj</Tabs.Button>
          <Tabs.Content>
            <NormberakningFamilj persons={draft.persons ?? []} />
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Inkomster</Tabs.Button>
          <Tabs.Content>
            <NormberakningIncomes
              errandId={errandId}
              rows={draft.incomes ?? []}
              incomeSum={draft.incomeSum}
              onChanged={refresh}
            />
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Utgifter</Tabs.Button>
          <Tabs.Content>
            <NormberakningExpenses
              errandId={errandId}
              rows={draft.expenses ?? []}
              sum={draft.expenseSum}
              summaLabel="Summa utgifter"
              bucket="EXPENSE"
              onChanged={refresh}
            />
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Levnadskostnader i övrigt</Tabs.Button>
          <Tabs.Content>
            <NormberakningExpenses
              errandId={errandId}
              rows={draft.specialExpenses ?? []}
              sum={draft.specialExpenseSum}
              summaLabel="Summa särskilda kostnader"
              bucket="SPECIAL_EXPENSE"
              onChanged={refresh}
            />
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Gemensamma kostnader</Tabs.Button>
          <Tabs.Content>
            <NormberakningGemensamma
              hasCustomHouseholdSize={draft.hasCustomHouseholdSize}
              householdSize={draft.householdSize}
            />
          </Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </div>
  );
};
