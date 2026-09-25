'use client';

import { defaultSsbtekMonths, periodOfMonths, SsbtekMonths } from '@utils/ssbtek-period';
import { FC, useState } from 'react';

import { SsbtekPayments } from './ssbtek-payments.component';
import { SsbtekPeriodPicker } from './ssbtek-period-picker.component';
import { SsbtekTransfer } from './ssbtek-transfer.component';

/**
 * The Betalningar tab: the incomes to transfer to the normberäkning, then the payments SSBTEK reports for the months
 * the handläggare picks (month M−2 through the current month to begin with). Shared by the SSBTEK page and the panel.
 */
export const SsbtekPaymentsTab: FC<{ errandId: string }> = ({ errandId }) => {
  const [months, setMonths] = useState<SsbtekMonths>(() => defaultSsbtekMonths());

  return (
    <div className="flex flex-col gap-40">
      <SsbtekTransfer errandId={errandId} />
      <div className="flex flex-col gap-24">
        <SsbtekPeriodPicker months={months} onSearch={setMonths} />
        <SsbtekPayments errandId={errandId} period={periodOfMonths(months)} />
      </div>
    </div>
  );
};
