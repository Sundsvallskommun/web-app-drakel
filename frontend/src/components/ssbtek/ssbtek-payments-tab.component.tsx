'use client';

import { ReadOnlyNotice } from '@components/common/read-only-notice.component';
import { useErrandApiId } from '@hooks/use-errand-api-id';
import { useErrandEditPermission } from '@hooks/use-errand-edit-permission';
import { defaultSsbtekMonths, periodOfMonths, SsbtekMonths } from '@utils/ssbtek-period';
import { FC, useState } from 'react';

import { SsbtekPayments } from './ssbtek-payments.component';
import { SsbtekPeriodPicker } from './ssbtek-period-picker.component';
import { SsbtekTransfer } from './ssbtek-transfer.component';

/**
 * The Betalningar tab: the incomes to transfer to the normberäkning, then the payments SSBTEK reports for the months
 * the handläggare picks (month M−2 through the current month to begin with). Shared by the SSBTEK page and the panel.
 */
export const SsbtekPaymentsTab: FC<{
  /** The errand as the URL names it: its id or its errand number. */
  errandReference: string;
}> = ({ errandReference }) => {
  const errandId = useErrandApiId(errandReference);
  const [months, setMonths] = useState<SsbtekMonths>(() => defaultSsbtekMonths());
  // Transferring changes the errand's normberäkning, which the backend refuses without canEditErrands.
  const { canEditErrands, readOnly } = useErrandEditPermission();

  return (
    <div className="flex flex-col gap-40">
      {readOnly ?
        <ReadOnlyNotice />
      : null}
      <SsbtekTransfer errandId={errandId} readOnly={!canEditErrands} />
      <div className="flex flex-col gap-24">
        <SsbtekPeriodPicker months={months} onSearch={setMonths} />
        <SsbtekPayments errandId={errandId} period={periodOfMonths(months)} />
      </div>
    </div>
  );
};
