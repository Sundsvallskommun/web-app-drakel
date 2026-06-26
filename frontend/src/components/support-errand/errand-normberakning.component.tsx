'use client';

import { PdfPreviewButton } from '@components/common/pdf-preview-button.component';
import { useErrandNormberakning } from '@hooks/use-errand-normberakning';
import { useNormberakningTypes } from '@hooks/use-normberakning-types';
import { TypeOption } from '@services/normberakning-service';
import { Warning } from '@services/warning-service';
import { FormControl, FormLabel, Input, Spinner, Tabs } from '@sk-web-gui/react';
import { formatApplicationMonth } from '@utils/application-month';
import { buildNormberakningHtml } from '@utils/build-normberakning-html';
import { FC, ReactNode, useState } from 'react';

import { LockedBanner, LockFieldset } from './lockable-section.component';
import { NormberakningExpenses } from './normberakning-expenses.component';
import { NormberakningFamilj } from './normberakning-familj.component';
import { NormberakningGemensamma } from './normberakning-gemensamma.component';
import { NormberakningIncomes } from './normberakning-incomes.component';
import { NormberakningWarnings } from './normberakning-warnings.component';

// Which normberäkning sub-tab each warning type belongs to.
const INCOME_WARNING_TYPES = new Set([
  'UNHANDLED_INCOME',
  'INCOME_CHANGE',
  'MISSING_SSBTEK',
  'NEW_INCOME',
  'INCOME_DROPPED',
]);
const EXPENSE_WARNING_TYPES = new Set(['NEW_EXPENSE', 'EXPENSE_REVIEW', 'EXPENSE_CAPPED']);
const PERSON_WARNING_TYPES = new Set(['NEW_PERSON', 'HOUSEHOLD_CHANGE']);

const FilterField: FC<{ label: string; required?: boolean; className?: string; children: ReactNode }> = ({
  label,
  required = false,
  className = 'w-[14rem]',
  children,
}) => (
  <FormControl className={className}>
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
/** Builds a code→displayName map for labelling rows in the preview PDF. */
const typeLabelMap = (options: TypeOption[]): Record<string, string> => {
  const labels: Record<string, string> = {};
  options.forEach((option) => {
    if (option.code) {
      labels[option.code] = option.displayName ?? option.code;
    }
  });
  return labels;
};

export const ErrandNormberakning: FC<{
  errandId: string;
  warnings: Warning[];
  onWarningsChanged: () => void;
  /** When the calculation section is approved, its content is locked for editing (but still readable). */
  locked?: boolean;
  /** Rendered directly under the section heading (the "Markera som klart" approval control). */
  headerSlot?: ReactNode;
  /** The assigned handläggare, shown in the preview-PDF header. */
  handlaggare?: string;
}> = ({ errandId, warnings, onWarningsChanged, locked = false, headerSlot, handlaggare }) => {
  const { draft, isLoading, error, refresh } = useErrandNormberakning(errandId);
  const types = useNormberakningTypes();
  const [activeTab, setActiveTab] = useState<number>(0);

  const incomeWarnings = warnings.filter((warning) => INCOME_WARNING_TYPES.has(warning.type ?? ''));
  const expenseWarnings = warnings.filter((warning) => EXPENSE_WARNING_TYPES.has(warning.type ?? ''));
  const personWarnings = warnings.filter((warning) => PERSON_WARNING_TYPES.has(warning.type ?? ''));

  // Only show the full spinner on the first load. On a refetch (after editing/deleting a row) keep the
  // table mounted with the current draft so the scroll position is preserved instead of jumping to top.
  if (isLoading && !draft) {
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
        Ingen normberäkning har skapats för det här ärendet ännu. Draften skapas automatiskt när inkomstunderlaget
        (SSBTEK) har hämtats.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-24">
      {locked ?
        <LockedBanner />
      : null}

      <div className="flex justify-between items-center gap-16">
        <h2 className="text-h3-sm md:text-h3-md m-0">Beräkning</h2>
        {/* Wrap so the preview button is one flex item — its fragment (Button + Modal) would otherwise
            become two children and justify-between would push the button to the middle. */}
        <div>
          <PdfPreviewButton
            buildHtml={() =>
              Promise.resolve(
                buildNormberakningHtml(draft, {
                  costTypeLabels: typeLabelMap(types.costTypes),
                  livingCostTypeLabels: typeLabelMap(types.livingCostTypes),
                  handlaggare,
                })
              )
            }
            modalLabel="Förhandsgranska beräkning"
            emptyMessage="Det finns ingen beräkning att förhandsgranska."
          />
        </div>
      </div>
      {headerSlot}

      <div className="flex flex-wrap items-start justify-between gap-24">
        <div className="flex flex-wrap items-end gap-12">
          <FilterField label="Avser ansökan" className="w-auto">
            <span className="font-bold py-4">{formatApplicationMonth(draft.applicationMonth)}</span>
          </FilterField>
          <FilterField label="Norm" required>
            <Input readOnly size="sm" value={draft.normType ?? ''} placeholder="—" />
          </FilterField>
          <FilterField label="Beräkningsdatum">
            <Input readOnly size="sm" value={draft.calculationDate ?? ''} placeholder="—" />
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
            <LockFieldset locked={locked}>
              {personWarnings.length > 0 ?
                <div className="pt-24">
                  <NormberakningWarnings
                    errandId={errandId}
                    warnings={personWarnings}
                    onAcknowledged={onWarningsChanged}
                  />
                </div>
              : null}
              <NormberakningFamilj persons={draft.persons ?? []} />
            </LockFieldset>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Inkomster</Tabs.Button>
          <Tabs.Content>
            <LockFieldset locked={locked}>
              {incomeWarnings.length > 0 ?
                <div className="pt-24">
                  <NormberakningWarnings
                    errandId={errandId}
                    warnings={incomeWarnings}
                    onAcknowledged={onWarningsChanged}
                  />
                </div>
              : null}
              <NormberakningIncomes
                errandId={errandId}
                rows={draft.incomes ?? []}
                incomeSum={draft.incomeSum}
                incomeTypes={types.incomeTypes}
                onChanged={refresh}
              />
            </LockFieldset>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Utgifter</Tabs.Button>
          <Tabs.Content>
            <LockFieldset locked={locked}>
              {expenseWarnings.length > 0 ?
                <div className="pt-24">
                  <NormberakningWarnings
                    errandId={errandId}
                    warnings={expenseWarnings}
                    onAcknowledged={onWarningsChanged}
                  />
                </div>
              : null}
              <NormberakningExpenses
                errandId={errandId}
                rows={draft.expenses ?? []}
                sum={draft.expenseSum}
                summaLabel="Summa utgifter"
                bucket="EXPENSE"
                types={types.costTypes}
                onChanged={refresh}
              />
            </LockFieldset>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Levnadskostnader i övrigt</Tabs.Button>
          <Tabs.Content>
            <LockFieldset locked={locked}>
              <NormberakningExpenses
                errandId={errandId}
                rows={draft.specialExpenses ?? []}
                sum={draft.specialExpenseSum}
                summaLabel="Summa särskilda kostnader"
                bucket="SPECIAL_EXPENSE"
                types={types.livingCostTypes}
                onChanged={refresh}
              />
            </LockFieldset>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Gemensamma kostnader</Tabs.Button>
          <Tabs.Content>
            <LockFieldset locked={locked}>
              <NormberakningGemensamma
                hasCustomHouseholdSize={draft.hasCustomHouseholdSize}
                householdSize={draft.householdSize}
              />
            </LockFieldset>
          </Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </div>
  );
};
