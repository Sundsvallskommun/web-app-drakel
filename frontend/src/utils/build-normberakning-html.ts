import { NormberakningDraft, NormExpenseRow, NormIncomeRow, NormPersonRow } from '@services/normberakning-service';
import { formatApplicationMonth } from '@utils/application-month';
import { stakeholderRoleLabel } from '@utils/stakeholder-role';

/** Shown where a value is computed in Lifecare and not (yet) exposed by the API. */
const COMPUTED_IN_LIFECARE = 'Beräknas i Lifecare';

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Formats an amount the way the Lifecare PDF does: comma decimal, no thousands separator (e.g. 5000,00). */
const amount = (value?: number): string => (value == null ? '' : value.toFixed(2).replace('.', ','));

// Accepts whatever the API hands us (the contract types some fields as string, but e.g. normType comes
// back as a number) and coerces it to display text — never assume the value already has string methods.
const text = (value?: string | number | null): string => {
  const trimmed = value == null ? '' : String(value).trim();
  return trimmed ? escapeHtml(trimmed) : '—';
};

const expenseLabel = (row: NormExpenseRow, typeLabels: Record<string, string>): string => {
  if (row.specification?.trim()) {
    return escapeHtml(row.specification.trim());
  }
  const code = row.costType ?? '';
  return escapeHtml(typeLabels[code] ?? (code || '—'));
};

const visible = <T extends { deleted?: boolean }>(rows: T[]): T[] => rows.filter((row) => !row.deleted);

const personsTable = (persons: NormPersonRow[]): string => {
  const rows = visible(persons);
  const body =
    rows.length === 0 ?
      '<tr><td colspan="5">Inga personer</td></tr>'
    : rows
        .map(
          (person) => `<tr>
            <td>${person.included ? 'Ja' : 'Nej'}</td>
            <td>${text(person.name)}</td>
            <td>${escapeHtml(stakeholderRoleLabel(person.role) || '—')}</td>
            <td class="num">${person.effectiveDays ?? '—'}</td>
            <td>${text(person.normInterval)}</td>
          </tr>`
        )
        .join('');
  return `
    <table>
      <thead><tr><th>Omfattas</th><th>Namn</th><th>Roll</th><th class="num">Dagar</th><th>Normintervall</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
    <p class="muted">Belopp för familjenormen: ${COMPUTED_IN_LIFECARE}.</p>`;
};

const incomesTable = (incomes: NormIncomeRow[], sum?: number): string => {
  const rows = visible(incomes);
  const body =
    rows.length === 0 ?
      '<tr><td colspan="5">Inga inkomstrader</td></tr>'
    : rows
        .map(
          (row) => `<tr>
            <td>${text(row.typeName)}</td>
            <td>${text(row.applicantAmountDate)}</td>
            <td class="num">${amount(row.applicantEffectiveAmount)}</td>
            <td>${text(row.coapplicantAmountDate)}</td>
            <td class="num">${amount(row.coapplicantEffectiveAmount)}</td>
          </tr>`
        )
        .join('');
  return `
    <table>
      <thead><tr><th>Typ</th><th>Datum (sökande)</th><th class="num">Sökande</th><th>Datum (medsökande)</th><th class="num">Medsökande</th></tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr><td colspan="4">Summa inkomster</td><td class="num">${amount(sum)}</td></tr></tfoot>
    </table>`;
};

const expensesTable = (expenses: NormExpenseRow[], sum: number | undefined, typeLabels: Record<string, string>, summaLabel: string): string => {
  const rows = visible(expenses);
  const body =
    rows.length === 0 ?
      '<tr><td colspan="3">Inga rader</td></tr>'
    : rows
        .map(
          (row) => `<tr>
            <td>${expenseLabel(row, typeLabels)}</td>
            <td class="num">${amount(row.appliedAmount)}</td>
            <td class="num">${amount(row.effectiveAmount)}</td>
          </tr>`
        )
        .join('');
  return `
    <table>
      <thead><tr><th>Typ</th><th class="num">Ansökt</th><th class="num">Godkänt</th></tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr><td colspan="2">${escapeHtml(summaLabel)}</td><td class="num">${amount(sum)}</td></tr></tfoot>
    </table>`;
};

const summaryTable = (draft: NormberakningDraft): string => `
  <table>
    <tbody>
      <tr><td>Inkomster</td><td class="num">${amount(draft.incomeSum)}</td></tr>
      <tr><td>Normberäkning, Familj</td><td class="num muted">${COMPUTED_IN_LIFECARE}</td></tr>
      <tr><td>Gemensamma hushållskostnader</td><td class="num muted">${COMPUTED_IN_LIFECARE}</td></tr>
      <tr><td>Utgifter</td><td class="num">${amount(draft.expenseSum)}</td></tr>
      <tr><td>Levnadskostnader i övrigt</td><td class="num">${amount(draft.specialExpenseSum)}</td></tr>
      <tr class="total"><td>Underskott / Överskott</td><td class="num muted">${COMPUTED_IN_LIFECARE}</td></tr>
    </tbody>
  </table>`;

/** Builds a print-ready HTML document for the normberäkning, mirroring the Lifecare "Beräkning" layout. */
export const buildNormberakningHtml = (
  draft: NormberakningDraft,
  options: {
    costTypeLabels: Record<string, string>;
    livingCostTypeLabels: Record<string, string>;
    handlaggare?: string;
  }
): string => {
  const persons = draft.persons ?? [];
  const applicant = persons.find((person) => person.role === 'APPLICANT');
  const period =
    draft.calculationFromDate && draft.calculationToDate ?
      `${draft.calculationFromDate} – ${draft.calculationToDate}`
    : '—';

  const meta = [
    ['Avser ansökan', escapeHtml(formatApplicationMonth(draft.applicationMonth) || '—')],
    ['Norm', text(draft.normType)],
    ['Period', escapeHtml(period)],
    ['Beräkningsdatum', text(draft.calculationDate)],
    ['Handläggare', text(options.handlaggare)],
  ]
    .map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`)
    .join('');

  const section = (title: string, body: string): string =>
    `<section><h2>${escapeHtml(title)}</h2>${body}</section>`;

  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 12px; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 20px 0 6px; border-bottom: 1px solid #444; padding-bottom: 3px; }
  .recipient { text-align: right; margin-bottom: 16px; line-height: 1.4; }
  .meta { border-collapse: collapse; margin-bottom: 8px; }
  .meta th { text-align: left; font-weight: bold; padding: 2px 16px 2px 0; vertical-align: top; white-space: nowrap; }
  .meta td { padding: 2px 0; }
  table { width: 100%; border-collapse: collapse; }
  thead th { text-align: left; border-bottom: 1px solid #888; padding: 4px 8px; font-size: 11px; }
  tbody td { padding: 4px 8px; border-bottom: 1px solid #e0e0e0; }
  tfoot td { padding: 5px 8px; border-top: 1px solid #888; font-weight: bold; }
  .num { text-align: right; white-space: nowrap; }
  .muted { color: #6b6b6b; font-style: italic; }
  tr.total td { border-top: 2px solid #444; font-weight: bold; }
  section { margin-bottom: 8px; }
  p.muted { margin: 6px 0 0; }
</style>
</head>
<body>
  <div class="recipient">${applicant ? text(applicant.name) : '&nbsp;'}</div>
  <h1>Beräkning</h1>
  <table class="meta"><tbody>${meta}</tbody></table>

  ${section('Normberäkning Familj', personsTable(persons))}
  ${section('Gemensamma hushållskostnader', `<p>Hushållsstorlek: ${draft.householdSize ?? '—'}</p><p class="muted">Belopp för gemensamma kostnader: ${COMPUTED_IN_LIFECARE}.</p>`)}
  ${section('Inkomster', incomesTable(draft.incomes ?? [], draft.incomeSum))}
  ${section('Utgifter', expensesTable(draft.expenses ?? [], draft.expenseSum, options.costTypeLabels, 'Summa utgifter'))}
  ${section('Levnadskostnader i övrigt', expensesTable(draft.specialExpenses ?? [], draft.specialExpenseSum, options.livingCostTypeLabels, 'Summa särskilda kostnader'))}
  ${section('Sammanställning', summaryTable(draft))}
</body>
</html>`;
};
