import { FC } from 'react';

// Figma's widths, 160 and 144 px; the design system's spacing scale has neither.
/** Betalningsdag's width in Figma. */
const DATE_COLUMN = 'w-[16rem]';
/** Each amount column's width in Figma. */
const AMOUNT_COLUMN = 'w-[14.4rem]';
/** Personnummer's width: twelve digits, like an amount column. */
const PERSONAL_NUMBER_COLUMN = 'w-[14.4rem]';

/**
 * The payment table's column widths, as in Figma: the open/close column, Personnummer, Betalningsdag and the amounts
 * fixed, Person, Förmån, Typ and Period sharing the rest. With a fixed table layout every month's table lines up.
 */
export const SsbtekPaymentColumns: FC<{ showPerson: boolean }> = ({ showPerson }) => (
  <colgroup>
    <col className="w-68" />
    <col className={PERSONAL_NUMBER_COLUMN} />
    {showPerson ?
      <col />
    : null}
    <col />
    <col className={DATE_COLUMN} />
    <col />
    <col className={AMOUNT_COLUMN} />
    <col className={AMOUNT_COLUMN} />
    <col className={AMOUNT_COLUMN} />
    <col className={AMOUNT_COLUMN} />
    <col />
  </colgroup>
);
