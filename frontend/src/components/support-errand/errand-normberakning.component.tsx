'use client';

import { PdfPreviewButton } from '@components/common/pdf-preview-button.component';
import { useErrandNormberakning } from '@hooks/use-errand-normberakning';
import { useNormberakningTypes } from '@hooks/use-normberakning-types';
import { TypeOption } from '@services/normberakning-service';
import { Warning } from '@services/warning-service';
import { DatePicker, FormControl, FormLabel, Input, Spinner, Tabs } from '@sk-web-gui/react';
import { formatApplicationMonth } from '@utils/application-month';
import { buildNormberakningHtml } from '@utils/build-normberakning-html';
import { FC, ReactNode, useState } from 'react';

import { ContentBox } from './content-box.component';
import { ErrandSectionHeader } from './errand-section-header.component';
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
  className = 'w-[19rem]',
  children,
}) => (
  <FormControl className={className}>
    <FormLabel>
      {label}
      {required ? ' *' : ''}
    </FormLabel>
    {children}
  </FormControl>
);

/**
 * The content of one normberäkning sub-tab: the sub-tab's OPEN warnings above its table box. Locked per
 * panel — never around the tab row, which would make the sub-tabs unclickable.
 */
const NormberakningTabPanel: FC<{
  errandId: string;
  locked: boolean;
  warnings?: Warning[];
  onWarningsChanged: () => void;
  children: ReactNode;
}> = ({ errandId, locked, warnings = [], onWarningsChanged, children }) => (
  <LockFieldset locked={locked}>
    <div className="flex flex-col gap-24">
      {warnings.length > 0 ?
        <NormberakningWarnings errandId={errandId} warnings={warnings} onAcknowledged={onWarningsChanged} />
      : null}
      {children}
    </div>
  </LockFieldset>
);

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

/**
 * The "Normberäkning" tab, laid out like Lifecare's Beräkning view (header + sub-tabs FAMILJ /
 * INKOMSTER / UTGIFTER / LEVNADSKOSTNADER I ÖVRIGT / GEMENSAMMA KOSTNADER). The draft mirrors Lifecare
 * FC: incomes and expenses are editable; the final result (Underskott/Överskott) is computed in Lifecare
 * and not exposed by the API yet.
 */
export const ErrandNormberakning: FC<{
  errandId: string;
  warnings: Warning[];
  onWarningsChanged: () => void;
  /** When the calculation section is approved, its content is locked for editing (but still readable). */
  locked?: boolean;
  /** Rendered to the right of the section heading (the "Markera som komplett" approval checkbox). */
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

  // The heading (with the approval checkbox) is shown in every state; the PDF preview only once there is a draft.
  const renderHeader = (previewAction?: ReactNode) => (
    <ErrandSectionHeader
      title="Normberäkning"
      description="Utkast till normberäkningen för ansökan. Inkomster och utgifter kan justeras – resultatet beräknas i Lifecare."
      action={
        <div className="flex items-center gap-24 flex-wrap">
          {headerSlot}
          {previewAction}
        </div>
      }
    >
      {locked ?
        <LockedBanner />
      : null}
    </ErrandSectionHeader>
  );

  // Only show the full spinner on the first load. On a refetch (after editing/deleting a row) keep the
  // table mounted with the current draft so the scroll position is preserved instead of jumping to top.
  if (isLoading && !draft) {
    return (
      <div className="flex flex-col gap-24">
        {renderHeader()}
        <div className="flex justify-center my-32">
          <Spinner size={4} />
        </div>
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="flex flex-col gap-24">
        {renderHeader()}
        {error ?
          <p className="m-0">Det gick inte att hämta normberäkningen ({String(error)})</p>
        : <p className="m-0 text-dark-secondary">
            Ingen normberäkning har skapats för det här ärendet ännu. Draften skapas automatiskt när inkomstunderlaget
            (SSBTEK) har hämtats.
          </p>
        }
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-40">
      {renderHeader(
        // Wrap so the preview button is one flex item — its fragment (Button + Modal) would otherwise
        // become two children of the action group.
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
      )}

      <ContentBox title="Beräkningsuppgifter">
        <div className="flex flex-wrap items-start gap-x-32 gap-y-16">
          <FilterField label="Avser ansökan" className="w-auto">
            <span className="block py-4">{formatApplicationMonth(draft.applicationMonth)}</span>
          </FilterField>
          <FilterField label="Norm" required className="w-[14rem]">
            <Input readOnly size="sm" value={draft.normType ?? ''} placeholder="—" />
          </FilterField>
          <FilterField label="Beräkningsdatum" required>
            <DatePicker type="date" readOnly size="sm" value={draft.calculationDate ?? ''} />
          </FilterField>
          <FilterField label="Från" required>
            <DatePicker type="date" readOnly size="sm" value={draft.calculationFromDate ?? ''} />
          </FilterField>
          <FilterField label="Till" required>
            <DatePicker type="date" readOnly size="sm" value={draft.calculationToDate ?? ''} />
          </FilterField>
        </div>
      </ContentBox>

      <Tabs size="sm" underline current={activeTab} onTabChange={setActiveTab} panelsClassName="pt-32">
        <Tabs.Item>
          <Tabs.Button>Familj</Tabs.Button>
          <Tabs.Content>
            <NormberakningTabPanel
              errandId={errandId}
              locked={locked}
              warnings={personWarnings}
              onWarningsChanged={onWarningsChanged}
            >
              <NormberakningFamilj persons={draft.persons ?? []} />
            </NormberakningTabPanel>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Inkomster</Tabs.Button>
          <Tabs.Content>
            <NormberakningTabPanel
              errandId={errandId}
              locked={locked}
              warnings={incomeWarnings}
              onWarningsChanged={onWarningsChanged}
            >
              <NormberakningIncomes
                errandId={errandId}
                rows={draft.incomes ?? []}
                incomeSum={draft.incomeSum}
                incomeTypes={types.incomeTypes}
                onChanged={refresh}
              />
            </NormberakningTabPanel>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Utgifter</Tabs.Button>
          <Tabs.Content>
            <NormberakningTabPanel
              errandId={errandId}
              locked={locked}
              warnings={expenseWarnings}
              onWarningsChanged={onWarningsChanged}
            >
              <NormberakningExpenses
                errandId={errandId}
                title="Utgifter"
                rows={draft.expenses ?? []}
                sum={draft.expenseSum}
                summaLabel="Summa utgifter"
                bucket="EXPENSE"
                types={types.costTypes}
                onChanged={refresh}
              />
            </NormberakningTabPanel>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Levnadskostnader i övrigt</Tabs.Button>
          <Tabs.Content>
            <NormberakningTabPanel errandId={errandId} locked={locked} onWarningsChanged={onWarningsChanged}>
              <NormberakningExpenses
                errandId={errandId}
                title="Levnadskostnader i övrigt"
                rows={draft.specialExpenses ?? []}
                sum={draft.specialExpenseSum}
                summaLabel="Summa särskilda kostnader"
                bucket="SPECIAL_EXPENSE"
                types={types.livingCostTypes}
                onChanged={refresh}
              />
            </NormberakningTabPanel>
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Gemensamma kostnader</Tabs.Button>
          <Tabs.Content>
            <NormberakningTabPanel errandId={errandId} locked={locked} onWarningsChanged={onWarningsChanged}>
              <NormberakningGemensamma
                hasCustomHouseholdSize={draft.hasCustomHouseholdSize}
                householdSize={draft.householdSize}
              />
            </NormberakningTabPanel>
          </Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </div>
  );
};
