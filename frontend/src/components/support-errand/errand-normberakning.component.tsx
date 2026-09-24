'use client';

import { PdfPreviewButton } from '@components/common/pdf-preview-button.component';
import { NormberakningDraftSourceEnum } from '@data-contracts/backend/data-contracts';
import { useDecisionProposal } from '@hooks/use-decision-proposal';
import { useErrandNormberakning } from '@hooks/use-errand-normberakning';
import { useLifecareCalculation } from '@hooks/use-lifecare-calculation';
import { useNormberakningTypes } from '@hooks/use-normberakning-types';
import { getLifecareCalculationPdf } from '@services/lifecare-calculation-service';
import { TypeOption } from '@services/normberakning-service';
import { renderPdf } from '@services/pdf-service';
import { Warning } from '@services/warning-service';
import { FormControl, FormLabel, Spinner, Tabs } from '@sk-web-gui/react';
import { formatApplicationMonth } from '@utils/application-month';
import { buildNormberakningHtml } from '@utils/build-normberakning-html';
import { computeNormResult, fromLifecareSummary } from '@utils/norm-result';
import { FC, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentBox } from './content-box.component';
import { ErrandSectionHeader } from './errand-section-header.component';
import { LifecareCalculationSave } from './lifecare-calculation-save.component';
import { LockedBanner, LockFieldset } from './lockable-section.component';
import { NormResultSummary } from './norm-result.component';
import { NormSelect } from './norm-select.component';
import { NormberakningExpenses } from './normberakning-expenses.component';
import { NormberakningFamilj } from './normberakning-familj.component';
import { NormberakningGemensamma } from './normberakning-gemensamma.component';
import { NormberakningIncomes } from './normberakning-incomes.component';
import { NormberakningJobStimulus } from './normberakning-job-stimulus.component';
import { NormberakningWarnings } from './normberakning-warnings.component';
import { PreviousNormberakningCheckbox } from './previous-normberakning-box.component';
import { PreviousNormberakningProvider } from './previous-normberakning-context';
import {
  PreviousNormberakningExpensesBucket,
  PreviousNormberakningFamilj,
  PreviousNormberakningGemensamma,
  PreviousNormberakningIncomes,
  PreviousNormberakningLivingCosts,
} from './previous-normberakning-sections.component';

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
  /** Read-only content below the locked section — the previous normberäkning, when it is shown. */
  footer?: ReactNode;
  children: ReactNode;
}> = ({ errandId, locked, warnings = [], onWarningsChanged, footer, children }) => (
  <div className="flex flex-col gap-24">
    <LockFieldset locked={locked}>
      <div className="flex flex-col gap-24">
        {warnings.length > 0 ?
          <NormberakningWarnings errandId={errandId} warnings={warnings} onAcknowledged={onWarningsChanged} />
        : null}
        {children}
      </div>
    </LockFieldset>
    {footer}
  </div>
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
 * INKOMSTER / UTGIFTER / LEVNADSKOSTNADER I ÖVRIGT / GEMENSAMMA KOSTNADER). Until the first "Spara
 * normberäkning" the rows are careM's draft from the ansökan; that save creates the beräkning in Lifecare,
 * and from then on the rows are Lifecare's own — read from it and changed in it directly — and Lifecare's
 * summering is the result shown at the top.
 */
export const ErrandNormberakning: FC<{
  errandId: string;
  warnings: Warning[];
  onWarningsChanged: () => void;
  /** Called after a change in Lifecare, so the tab's check can follow a beräkning saved as slutlig. */
  onLifecareChanged?: () => void;
  /** The assigned handläggare, shown in the preview-PDF header. */
  handlaggare?: string;
}> = ({ errandId, warnings, onWarningsChanged, onLifecareChanged, handlaggare }) => {
  const { t, i18n } = useTranslation('calculation');
  // Once saved in Lifecare, Lifecare's own summering is the result; until then careM's förslag carries the
  // sums the result is counted from.
  const { proposal } = useDecisionProposal(errandId);
  const lifecare = useLifecareCalculation(errandId);
  const normResult =
    lifecare.calculation?.summary ? fromLifecareSummary(lifecare.calculation.summary) : computeNormResult(proposal);
  const { draft, isLoading, error, refresh } = useErrandNormberakning(errandId);
  const types = useNormberakningTypes(errandId, draft?.source);
  // A beräkning Lifecare holds as slutlig cannot be changed.
  const closed = draft?.finalized === true;
  const inLifecare = draft?.source === NormberakningDraftSourceEnum.LIFECARE;

  // A row change moves the result too, and once the beräkning is in Lifecare that is Lifecare's summering.
  const refreshAll = (): void => {
    refresh();
    lifecare.refresh();
    onLifecareChanged?.();
  };
  const [activeTab, setActiveTab] = useState<number>(0);

  const incomeWarnings = warnings.filter((warning) => INCOME_WARNING_TYPES.has(warning.type ?? ''));
  const expenseWarnings = warnings.filter((warning) => EXPENSE_WARNING_TYPES.has(warning.type ?? ''));
  const personWarnings = warnings.filter((warning) => PERSON_WARNING_TYPES.has(warning.type ?? ''));

  // The heading (with the approval checkbox) is shown in every state; the PDF preview only once there is a draft.
  const renderHeader = (previewAction?: ReactNode) => (
    <ErrandSectionHeader
      title={t('header.title')}
      description={t('header.description')}
      action={<div className="flex items-center gap-24 flex-wrap">{previewAction}</div>}
    >
      {closed ?
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
          <p className="m-0">{t('loadError', { error: String(error) })}</p>
        : <p className="m-0 text-dark-secondary">{t('noDraft')}</p>}
      </div>
    );
  }

  return (
    <PreviousNormberakningProvider errandId={errandId}>
      <div className="flex flex-col gap-40">
        {renderHeader(
          // Wrap so the preview button is one flex item — its fragment (Button + Modal) would otherwise
          // become two children of the action group.
          <div>
            {/* Once the beräkning is in Lifecare, the preview is Lifecare's own print of it; before that, the
                draft rendered by Drakel. */}
            <PdfPreviewButton
              loadPdf={() =>
                inLifecare ?
                  getLifecareCalculationPdf(errandId)
                : renderPdf(
                    buildNormberakningHtml(draft, {
                      costTypeLabels: typeLabelMap(types.costTypes),
                      livingCostTypeLabels: typeLabelMap(types.livingCostTypes),
                      handlaggare,
                    })
                  )
              }
              modalLabel={t('preview.modalLabel')}
            />
          </div>
        )}

        {normResult ?
          <NormResultSummary result={normResult} />
        : null}

        <ContentBox title={t('details.title')}>
          <div className="flex flex-wrap items-start gap-x-32 gap-y-16">
            <FilterField label={t('details.applicationMonth')} className="w-auto">
              <span className="block py-4">{formatApplicationMonth(draft.applicationMonth, i18n.language)}</span>
            </FilterField>
            <FilterField label={t('details.norm')} required className="w-[14rem]">
              <NormSelect
                errandId={errandId}
                normId={draft.normId}
                normName={(draft.normTypeDisplayNames ?? draft.normType ?? []).join(', ')}
                norms={types.norms}
                disabled={closed}
                onChanged={refreshAll}
              />
            </FilterField>
            {/* Datum and period are Lifecare's, so they read as values, like Avser ansökan. */}
            <FilterField label={t('details.calculationDate')} className="w-auto">
              <span className="block py-4 tabular-nums">{draft.calculationDate ?? '—'}</span>
            </FilterField>
            <FilterField label={t('details.from')} className="w-auto">
              <span className="block py-4 tabular-nums">{draft.calculationFromDate ?? '—'}</span>
            </FilterField>
            <FilterField label={t('details.to')} className="w-auto">
              <span className="block py-4 tabular-nums">{draft.calculationToDate ?? '—'}</span>
            </FilterField>
          </div>
        </ContentBox>

        {/* The toggle sits at the right end of the sub-tab row. Tabs owns both its tab list and its
            panels, so the two are overlaid in one grid cell rather than laid out side by side; the tab
            list reserves room on the right so long tab labels never run into the checkbox. */}
        <div className="grid">
          <div className="col-start-1 row-start-1">
            <Tabs
              size="sm"
              underline
              current={activeTab}
              onTabChange={setActiveTab}
              panelsClassName="pt-32"
              tabslistClassName="pr-[26rem]"
            >
              <Tabs.Item>
                <Tabs.Button>{t('tabs.family')}</Tabs.Button>
                <Tabs.Content>
                  <NormberakningTabPanel
                    errandId={errandId}
                    locked={closed}
                    warnings={personWarnings}
                    onWarningsChanged={onWarningsChanged}
                    footer={<PreviousNormberakningFamilj />}
                  >
                    <NormberakningFamilj
                      persons={draft.persons ?? []}
                      errandId={errandId}
                      normRows={draft.normRows}
                      editable={inLifecare && !closed}
                      onChanged={refreshAll}
                    />
                  </NormberakningTabPanel>
                </Tabs.Content>
              </Tabs.Item>
              <Tabs.Item>
                <Tabs.Button>{t('tabs.incomes')}</Tabs.Button>
                <Tabs.Content>
                  <NormberakningTabPanel
                    errandId={errandId}
                    locked={closed}
                    warnings={incomeWarnings}
                    onWarningsChanged={onWarningsChanged}
                    footer={<PreviousNormberakningIncomes />}
                  >
                    <NormberakningJobStimulus
                      errandId={errandId}
                      calculationFrom={draft.calculationFromDate}
                      calculationTo={draft.calculationToDate}
                      onAdded={refreshAll}
                    />
                    <NormberakningIncomes
                      errandId={errandId}
                      rows={draft.incomes ?? []}
                      incomeSum={draft.incomeSum}
                      incomeTypes={types.incomeTypes}
                      applicantJobStimulus={draft.applicantJobStimulus}
                      onChanged={refreshAll}
                    />
                  </NormberakningTabPanel>
                </Tabs.Content>
              </Tabs.Item>
              <Tabs.Item>
                <Tabs.Button>{t('tabs.expenses')}</Tabs.Button>
                <Tabs.Content>
                  <NormberakningTabPanel
                    errandId={errandId}
                    locked={closed}
                    warnings={expenseWarnings}
                    onWarningsChanged={onWarningsChanged}
                    footer={<PreviousNormberakningExpensesBucket />}
                  >
                    <NormberakningExpenses
                      errandId={errandId}
                      title={t('expenses.title')}
                      rows={draft.expenses ?? []}
                      sum={draft.expenseSum}
                      summaLabel={t('expenses.sum')}
                      bucket="EXPENSE"
                      types={types.costTypes}
                      onChanged={refreshAll}
                    />
                  </NormberakningTabPanel>
                </Tabs.Content>
              </Tabs.Item>
              <Tabs.Item>
                <Tabs.Button>{t('tabs.livingCosts')}</Tabs.Button>
                <Tabs.Content>
                  <NormberakningTabPanel
                    errandId={errandId}
                    locked={closed}
                    onWarningsChanged={onWarningsChanged}
                    footer={<PreviousNormberakningLivingCosts />}
                  >
                    <NormberakningExpenses
                      errandId={errandId}
                      title={t('livingCosts.title')}
                      rows={draft.specialExpenses ?? []}
                      sum={draft.specialExpenseSum}
                      summaLabel={t('livingCosts.sum')}
                      bucket="SPECIAL_EXPENSE"
                      types={types.livingCostTypes}
                      onChanged={refreshAll}
                    />
                  </NormberakningTabPanel>
                </Tabs.Content>
              </Tabs.Item>
              <Tabs.Item>
                <Tabs.Button>{t('tabs.sharedCosts')}</Tabs.Button>
                <Tabs.Content>
                  <NormberakningTabPanel
                    errandId={errandId}
                    locked={closed}
                    onWarningsChanged={onWarningsChanged}
                    footer={<PreviousNormberakningGemensamma />}
                  >
                    <NormberakningGemensamma
                      key={`${String(draft.hasCustomHouseholdSize)}-${String(draft.householdSize)}`}
                      errandId={errandId}
                      hasCustomHouseholdSize={draft.hasCustomHouseholdSize}
                      householdSize={draft.householdSize}
                      familyMembers={draft.familyMembers}
                      amountForHouseholdSize={draft.amountForHouseholdSize}
                      commonHouseholdCost={draft.commonHouseholdCost}
                      onChanged={refreshAll}
                    />
                  </NormberakningTabPanel>
                </Tabs.Content>
              </Tabs.Item>
            </Tabs>
          </div>
          <div className="col-start-1 row-start-1 justify-self-end self-start h-32 flex items-center">
            <PreviousNormberakningCheckbox />
          </div>
        </div>

        <LifecareCalculationSave errandId={errandId} saved={lifecare.calculation} onSaved={refreshAll} />
      </div>
    </PreviousNormberakningProvider>
  );
};
