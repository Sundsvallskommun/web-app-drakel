'use client';

import { FormField } from '@components/common/form-field.component';
import { LifecarePayeeView } from '@data-contracts/backend/data-contracts';
import { Select } from '@sk-web-gui/react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

/** A payee as the dropdown shows it: the label, the betalsätt and the account it pays to. */
const payeeLabel = (payee: LifecarePayeeView): string =>
  [payee.label, payee.paymentMethod, [payee.clearing, payee.accountNumber].filter(Boolean).join('-')]
    .filter(Boolean)
    .join(' · ');

/**
 * "Betalningsmottagare": the person's payees as Lifecare registers them for the insats. Lifecare is the
 * register of record — a new payee is added there, not from Drakel.
 */
export const PayeePicker: FC<{
  payees: LifecarePayeeView[];
  /** The chosen payee's Lifecare id, as a string for the select. */
  value: string;
  onChange: (payeeId: string) => void;
  disabled?: boolean;
}> = ({ payees, value, onChange, disabled = false }) => {
  const { t } = useTranslation('decision');

  return (
    <FormField label={t('payment.form.recipient')} disabled={disabled}>
      <Select
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        <Select.Option value="" />
        {payees.map((payee) => (
          <Select.Option key={payee.id} value={String(payee.id)}>
            {payeeLabel(payee)}
          </Select.Option>
        ))}
      </Select>
    </FormField>
  );
};
