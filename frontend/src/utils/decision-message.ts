import { formatApplicationMonth } from '@utils/application-month';

/** The closing of every message: who sent it, and from where. */
const SIGNATURE_LINES = [
  'Sundsvalls kommun',
  'Individ- och Arbetsmarknadsförvaltningen',
  'Enheten för ekonomiskt bistånd',
];

/**
 * The message proposed when the beräkning and the beslut are sent to the sökande — the handläggare edits it before
 * sending. The ansökan's month (`YYYY-MM`) is written out, "september 2026"; without one the sentence leaves it out.
 */
export const buildDecisionMessage = (applicationMonth: string | undefined, caseworkerName: string): string => {
  const month = applicationMonth ? formatApplicationMonth(applicationMonth).toLowerCase() : undefined;
  return [
    'Hej,',
    month ? `Din ansökan för ${month} är klar. Se bifogade dokument.` : 'Din ansökan är klar. Se bifogade dokument.',
    caseworkerName,
    ...SIGNATURE_LINES,
  ].join('\n');
};
