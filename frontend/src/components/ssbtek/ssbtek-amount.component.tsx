'use client';

import { displayAmount } from '@utils/format-amount';
import { FC } from 'react';

/** An SSBTEK amount as the Figma writes it, "6200,00 kr" — or "—" when the agency gave none. */
export const SsbtekAmount: FC<{ amount?: number }> = ({ amount }) => (
  <span className="tabular-nums whitespace-nowrap">{amount == null ? '—' : `${displayAmount(amount)} kr`}</span>
);
