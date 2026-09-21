'use client';

import { FormField } from '@components/common/form-field.component';
import { createPayee, deletePayee, PayeeOption } from '@services/payment-service';
import { Alert } from '@sk-web-gui/alert';
import { Button, Input, Select } from '@sk-web-gui/react';
import { Plus, Trash } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** A payee as the dropdown shows it: the name, the betalsätt and the account it pays to. */
const payeeLabel = (payee: PayeeOption): string =>
  [payee.name, payee.paymentMethod, [payee.clearing, payee.accountNumber].filter(Boolean).join('-')]
    .filter(Boolean)
    .join(' · ');

/**
 * How far the robot has got writing a manually added payee into Lifecare. A LIFECARE option is already
 * there and says nothing; PENDING and FAILED are worth surfacing, and Lifecare's own failure text is
 * shown as it came rather than reworded.
 */
const PayeeStatus: FC<{ payee?: PayeeOption }> = ({ payee }) => {
  const { t } = useTranslation('decision');

  if (payee?.source !== 'MANUAL' || payee.lifecareStatus === 'SYNCED') {
    return null;
  }
  if (payee.lifecareStatus === 'FAILED') {
    return (
      <Alert type="error">
        <Alert.Icon />
        <Alert.Content>
          <Alert.Content.Title className="font-bold">{t('payment.payee.failed')}</Alert.Content.Title>
          {payee.lifecareDetail ?
            <Alert.Content.Description>{payee.lifecareDetail}</Alert.Content.Description>
          : null}
        </Alert.Content>
      </Alert>
    );
  }
  return <p className="m-0 text-small text-dark-secondary">{t('payment.payee.pending')}</p>;
};

/** The inline form for adding a payee by hand. Only name and betalsätt are required. */
const AddPayeeForm: FC<{
  errandId: string;
  onAdded: () => void;
  onClose: () => void;
}> = ({ errandId, onAdded, onClose }) => {
  const { t } = useTranslation('decision');
  const [name, setName] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [clearing, setClearing] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const save = async () => {
    setSaving(true);
    setError(undefined);
    // clearing and accountNumber are optional on their own — there is deliberately no per-betalsätt
    // field logic here; the handläggare fills in what the payee needs.
    const result = await createPayee(errandId, {
      name: name.trim(),
      paymentMethod: paymentMethod.trim(),
      clearing: clearing.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
    });
    setSaving(false);
    if (result.error) {
      setError(t('payment.payee.addError'));
      return;
    }
    onAdded();
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
        <FormField label={t('payment.payee.paymentMethod')} required>
          <Input
            value={paymentMethod}
            onChange={(event) => {
              setPaymentMethod(event.target.value);
            }}
          />
        </FormField>
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
          disabled={saving || !name.trim() || !paymentMethod.trim()}
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
 * "Betalningsmottagare": the payees from the applicant's Lifecare payment history and the ones added by
 * hand on the errand, plus a way to add another.
 *
 * The list comes from caremanagement's own payee endpoint rather than from the payment proposal — it
 * reads nothing else and needs no calculation, so the dropdown fills even on an errand the proposal
 * cannot be computed for.
 */
export const PayeePicker: FC<{
  errandId: string;
  payees: PayeeOption[];
  /** The chosen payee's index in `payees`, as a string for the select. */
  value: string;
  onChange: (index: string) => void;
  onPayeesChanged: () => void;
  disabled?: boolean;
}> = ({ errandId, payees, value, onChange, onPayeesChanged, disabled = false }) => {
  const { t } = useTranslation('decision');
  const [adding, setAdding] = useState<boolean>(false);
  const [removing, setRemoving] = useState<boolean>(false);
  const chosen = value === '' ? undefined : payees[Number(value)];

  // Only a manually added payee can be removed — a Lifecare-derived one is history, not a record here.
  const remove = async () => {
    if (!chosen?.id) {
      return;
    }
    setRemoving(true);
    await deletePayee(errandId, chosen.id);
    setRemoving(false);
    onChange('');
    onPayeesChanged();
  };

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
            {payees.map((payee, index) => (
              <Select.Option key={payee.id ?? payeeLabel(payee)} value={String(index)}>
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
        {chosen?.source === 'MANUAL' && chosen.id ?
          <Button
            type="button"
            size="sm"
            variant="tertiary"
            showBackground
            leftIcon={<Trash />}
            disabled={disabled || removing}
            className="mb-4"
            aria-label={t('payment.payee.remove')}
            onClick={() => void remove()}
          >
            {t('payment.payee.remove')}
          </Button>
        : null}
      </div>

      <PayeeStatus payee={chosen} />

      {adding ?
        <AddPayeeForm
          errandId={errandId}
          onAdded={onPayeesChanged}
          onClose={() => {
            setAdding(false);
          }}
        />
      : null}
    </div>
  );
};
