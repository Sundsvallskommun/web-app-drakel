'use client';

import { PreviousCalculationExpense } from '@services/normberakning-service';
import { Table } from '@sk-web-gui/react';
import { displayAmount } from '@utils/format-amount';
import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { LabeledValue } from './labeled-value.component';
import { NormberakningSummaBox } from './normberakning-summa-box.component';
import { PreviousNormberakningBox } from './previous-normberakning-box.component';
import { usePreviousNormberakning } from './previous-normberakning-context';

/** A row placeholder used when the previous calculation has no rows in this section. */
const EmptyRow: FC<{ text: string }> = ({ text }) => (
  <Table.Row>
    <Table.Column>{text}</Table.Column>
  </Table.Row>
);

/**
 * FAMILJ, as it was settled in the previous period. Lifecare only keeps the norm amount per person
 * here, not the days/role breakdown the draft carries.
 */
export const PreviousNormberakningFamilj: FC = () => {
  const { t } = useTranslation('calculation');
  const { calculation } = usePreviousNormberakning();
  const persons = calculation?.persons ?? [];

  return (
    <PreviousNormberakningBox title={t('previous.family.title')}>
      <Table dense>
        <Table.Header>
          <Table.HeaderColumn>{t('family.name')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('previous.family.amount')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.includedFrom')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('family.includedTo')}</Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {persons.length === 0 ?
            <EmptyRow text={t('family.empty')} />
          : persons.map((person, index) => (
              <Table.Row key={person.personId ?? index}>
                <Table.Column>{person.name ?? '—'}</Table.Column>
                <Table.Column className="tabular-nums">{displayAmount(person.amount)}</Table.Column>
                <Table.Column>{person.deviationFromDate ?? '—'}</Table.Column>
                <Table.Column>{person.deviationToDate ?? '—'}</Table.Column>
              </Table.Row>
            ))
          }
        </Table.Body>
      </Table>
    </PreviousNormberakningBox>
  );
};

/** INKOMSTER, as they were settled in the previous period — one row per type, S and M side by side. */
export const PreviousNormberakningIncomes: FC = () => {
  const { t } = useTranslation('calculation');
  const { calculation } = usePreviousNormberakning();
  const incomes = calculation?.incomes ?? [];

  return (
    <PreviousNormberakningBox
      title={t('previous.incomes.title')}
      summary={<NormberakningSummaBox label={t('incomes.sum')} value={displayAmount(calculation?.incomeSum)} />}
    >
      <Table dense>
        <Table.Header>
          <Table.HeaderColumn>{t('table.type')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('incomes.applicantAmount')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('incomes.applicantDate')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('incomes.coApplicantAmount')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('incomes.coApplicantDate')}</Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {incomes.length === 0 ?
            <EmptyRow text={t('incomes.empty')} />
          : incomes.map((income, index) => (
              <Table.Row key={`${income.type ?? 'income'}-${index}`}>
                <Table.Column>{income.type ?? t('incomes.fallbackType')}</Table.Column>
                <Table.Column className="tabular-nums">{displayAmount(income.amountApplicant)}</Table.Column>
                <Table.Column>{income.applicantSearchDate ?? '—'}</Table.Column>
                <Table.Column className="tabular-nums">{displayAmount(income.amountCoApplicant)}</Table.Column>
                <Table.Column>{income.coApplicantSearchDate ?? '—'}</Table.Column>
              </Table.Row>
            ))
          }
        </Table.Body>
      </Table>
    </PreviousNormberakningBox>
  );
};

/**
 * UTGIFTER or LEVNADSKOSTNADER I ÖVRIGT, as they were settled in the previous period. Lifecare keeps
 * the applied and approved amount per row — there is no handläggare/process split on a committed
 * calculation.
 */
const PreviousNormberakningExpenses: FC<{
  title: string;
  summaLabel: string;
  rows: PreviousCalculationExpense[];
  sum?: number;
}> = ({ title, summaLabel, rows, sum }) => {
  const { t } = useTranslation('calculation');

  return (
    <PreviousNormberakningBox
      title={title}
      summary={<NormberakningSummaBox label={summaLabel} value={displayAmount(sum)} />}
    >
      <Table dense>
        <Table.Header>
          <Table.HeaderColumn>{t('table.type')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('expenses.applied')}</Table.HeaderColumn>
          <Table.HeaderColumn>{t('expenses.approved')}</Table.HeaderColumn>
        </Table.Header>
        <Table.Body>
          {rows.length === 0 ?
            <EmptyRow text={t('expenses.empty')} />
          : rows.map((expense, index) => (
              <Table.Row key={`${expense.type ?? 'expense'}-${index}`}>
                <Table.Column>{expense.type ?? '—'}</Table.Column>
                <Table.Column className="tabular-nums">{displayAmount(expense.appliedAmount)}</Table.Column>
                <Table.Column className="tabular-nums">{displayAmount(expense.approvedAmount)}</Table.Column>
              </Table.Row>
            ))
          }
        </Table.Body>
      </Table>
    </PreviousNormberakningBox>
  );
};

/** The EXPENSE bucket of the previous calculation. */
export const PreviousNormberakningExpensesBucket: FC = () => {
  const { t } = useTranslation('calculation');
  const { calculation } = usePreviousNormberakning();

  return (
    <PreviousNormberakningExpenses
      title={t('previous.expenses.title')}
      summaLabel={t('expenses.sum')}
      rows={calculation?.expenses ?? []}
      sum={calculation?.expenseSum}
    />
  );
};

/** The SPECIAL_EXPENSE bucket of the previous calculation. */
export const PreviousNormberakningLivingCosts: FC = () => {
  const { t } = useTranslation('calculation');
  const { calculation } = usePreviousNormberakning();

  return (
    <PreviousNormberakningExpenses
      title={t('previous.livingCosts.title')}
      summaLabel={t('livingCosts.sum')}
      rows={calculation?.specialExpenses ?? []}
      sum={calculation?.specialExpenseSum}
    />
  );
};

/**
 * GEMENSAMMA KOSTNADER of the previous calculation. Unlike the draft — where Lifecare computes these
 * and the API does not expose them — a committed calculation carries the settled totals, so this is
 * the one place in Draken where the norm result is actually visible.
 */
export const PreviousNormberakningGemensamma: FC = () => {
  const { t } = useTranslation('calculation');
  const { calculation } = usePreviousNormberakning();

  const fields: { label: string; value: ReactNode }[] = [
    { label: t('previous.shared.normSum'), value: displayAmount(calculation?.normSum) },
    { label: t('previous.shared.commonHouseholdCost'), value: displayAmount(calculation?.commonHouseholdCost) },
    { label: t('previous.shared.familyCost'), value: displayAmount(calculation?.familyCost) },
    { label: t('previous.shared.balance'), value: displayAmount(calculation?.balance) },
    { label: t('previous.shared.totalSum'), value: displayAmount(calculation?.totalSum) },
  ];

  return (
    <PreviousNormberakningBox title={t('previous.shared.title')}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-24">
        {fields.map((field) => (
          <LabeledValue key={field.label} label={field.label}>
            <span className="tabular-nums">{field.value}</span>
          </LabeledValue>
        ))}
      </div>
    </PreviousNormberakningBox>
  );
};
