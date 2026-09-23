'use client';

import { FormField } from '@components/common/form-field.component';
import { LifecarePayeeView, LifecarePaymentMethodView } from '@data-contracts/backend/data-contracts';
import { createLifecarePayee } from '@services/lifecare-payment-service';
import { Button, Input, Select } from '@sk-web-gui/react';
import { Plus } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** A payee as the dropdown shows it: the label, the betalsätt and the account it pays to. */
const payeeLabel = (payee: LifecarePayeeView): string =>
  [payee.label, payee.paymentMethod, [payee.clearing, payee.accountNumber].filter(Boolean).join('-')]
    .filter(Boolean)
    .join(' · ');

/**
 * The inline form for adding a betalningsmottagare. It is written straight to Lifecare, so the betalsätt
 * are Lifecare's own and a refusal is shown in Lifecare's words, with what was typed left in place.
 */
const AddPayeeForm: FC<{
  errandId: string;
  paymentMethods: LifecarePaymentMethodView[];
  onAdded: (payee: LifecarePayeeView) => void;
  onClose: () => void;
}> = ({ errandId, paymentMethods, onAdded, onClose }) => {
  const { t } = useTranslation('decision');
  const [name, setName] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [clearing, setClearing] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const save = async () => {
    setSaving(true);
    setError(undefined);
    const result = await createLifecarePayee(errandId, {
      name: name.trim(),
      payeeName: label.trim() || undefined,
      paymentMethod: Number(paymentMethod),
      clearing: clearing.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
    });
    setSaving(false);
    if (result.error || !result.data) {
      setError(result.message ?? t('payment.payee.addError'));
      return;
    }
    onAdded(result.data);
    onClose();
  };

  return (
    <div className="flex flex-col gap-16 rounded-12 bg-background-color-mixin-1 p-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <FormField label={t('payment.payee.name')} required>
          <Input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
          />
        </FormField>
        <FormField label={t('payment.payee.label')}>
          <Input
            value={label}
            placeholder={name}
            onChange={(event) => {
              setLabel(event.target.value);
            }}
          />
        </FormField>
        <FormField label={t('payment.payee.paymentMethod')} required>
          <Select
            value={paymentMethod}
            onChange={(event) => {
              setPaymentMethod(event.target.value);
            }}
          >
            <Select.Option value="" />
            {paymentMethods.map((method) => (
              <Select.Option key={method.code} value={String(method.code)}>
                {method.name}
              </Select.Option>
            ))}
          </Select>
        </FormField>
        <div aria-hidden />
        <FormField label={t('payment.payee.clearing')}>
          <Input
            value={clearing}
            onChange={(event) => {
              setClearing(event.target.value);
            }}
          />
        </FormField>
        <FormField label={t('payment.payee.accountNumber')}>
          <Input
            value={accountNumber}
            onChange={(event) => {
              setAccountNumber(event.target.value);
            }}
          />
        </FormField>
      </div>

      <div className="flex gap-12">
        <Button
          type="button"
          size="sm"
          variant="primary"
          color="primary"
          disabled={saving || !name.trim() || paymentMethod === ''}
          onClick={() => void save()}
        >
          {saving ? t('payment.payee.adding') : t('payment.payee.add')}
        </Button>
        <Button type="button" size="sm" variant="tertiary" disabled={saving} onClick={onClose}>
          {t('common:cancel')}
        </Button>
      </div>

      {error ?
        <p className="m-0 text-small text-error-surface-primary" role="alert">
          {error}
        </p>
      : null}
    </div>
  );
};

/**
 * "Betalningsmottagare": the person's payees as Lifecare registers them for the insats, plus a way to
 * add another there. Lifecare is the register of record — nothing about a payee is kept in careM.
 */
export const PayeePicker: FC<{
  errandId: string;
  payees: LifecarePayeeView[];
  paymentMethods: LifecarePaymentMethodView[];
  /** The chosen payee's Lifecare id, as a string for the select. */
  value: string;
  onChange: (payeeId: string) => void;
  /** Called with a payee just added in Lifecare, so the parent can refetch and pick it. */
  onPayeeAdded: (payee: LifecarePayeeView) => void;
  disabled?: boolean;
}> = ({ errandId, payees, paymentMethods, value, onChange, onPayeeAdded, disabled = false }) => {
  const { t } = useTranslation('decision');
  const [adding, setAdding] = useState<boolean>(false);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end gap-12">
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
        <Button
          type="button"
          size="sm"
          variant="tertiary"
          showBackground
          leftIcon={<Plus />}
          disabled={disabled || adding}
          className="mb-4"
          onClick={() => {
            setAdding(true);
          }}
        >
          {t('payment.payee.add')}
        </Button>
      </div>

      {adding ?
        <AddPayeeForm
          errandId={errandId}
          paymentMethods={paymentMethods}
          onAdded={onPayeeAdded}
          onClose={() => {
            setAdding(false);
          }}
        />
      : null}
    </div>
  );
};
