'use client';

import { FormField } from '@components/common/form-field.component';
import { Stakeholder } from '@data-contracts/backend/data-contracts';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { usePaymentMetadata } from '@hooks/use-payment-metadata';
import { createPayment, Payee, PaymentInput, PaymentProposal } from '@services/payment-service';
import { Button, Checkbox, DatePicker, FormControl, FormLabel, Input, Select } from '@sk-web-gui/react';
import { applicationMonthOptions, formatApplicationMonth } from '@utils/application-month';
import { formatAmount, parseAmount } from '@utils/format-amount';
import { getEditableRecipientFields } from '@utils/payment-method';
import { stakeholderListLabel } from '@utils/stakeholder-name';
import { todayDate } from '@utils/today-date';
import { Plus } from 'lucide-react';
import { FC, useEffect, useState } from 'react';
import { FieldArrayWithId, useFieldArray, useForm, UseFormRegister, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

/** The fields of the Lifecare utbetalning form, in the order they appear in it. */
interface UtbetalningFormValues {
  moneyType: string;
  paymentDate: string;
  amount: string;
  applicationMonth: string;
  /** The stakeholder ids the utbetalning is reported on ("Redovisas på"). */
  reportedOnStakeholderIds: string[];
  accountingDate: string;
  excludedFromPayment: boolean;
  /** The index of the chosen payee in the proposal's `payeeOptions`, as a string for the select. */
  payeeIndex: string;
  paymentMethod: string;
  name: string;
  address: string;
  careOf: string;
  zipCode: string;
  city: string;
  clearingNumber: string;
  accountNumber: string;
  localPaymentNumber: string;
  invoiceNumber: string;
  usesOcr: boolean;
  messageLines: { text: string }[];
}

const EMPTY_FORM_VALUES: UtbetalningFormValues = {
  moneyType: '',
  paymentDate: todayDate(),
  amount: '',
  applicationMonth: '',
  reportedOnStakeholderIds: [],
  accountingDate: '',
  excludedFromPayment: false,
  payeeIndex: '',
  paymentMethod: '',
  name: '',
  address: '',
  careOf: '',
  zipCode: '',
  city: '',
  clearingNumber: '',
  accountNumber: '',
  localPaymentNumber: '',
  invoiceNumber: '',
  usesOcr: false,
  messageLines: [{ text: '' }],
};

/** The form values the proposal prefills; everything it has no opinion on keeps its empty default. */
const proposedFormValues = (proposal: PaymentProposal, applicationMonth?: string): UtbetalningFormValues => {
  const proposed = proposal.payments?.[0];
  const payee = proposed?.payee;
  // The proposed payee is one of the options; match on its contents so the select lands on the right row.
  const payeeIndex = (proposal.payeeOptions ?? []).findIndex((option) => isSamePayee(option, payee));

  return {
    ...EMPTY_FORM_VALUES,
    paymentDate: proposed?.paymentDate ?? todayDate(),
    amount: proposed?.amount == null ? '' : formatAmount(proposed.amount),
    applicationMonth: proposed?.concernedMonth ?? applicationMonth ?? '',
    payeeIndex: payeeIndex >= 0 ? String(payeeIndex) : '',
    paymentMethod: payee?.paymentMethod ?? '',
    name: payee?.name ?? '',
    clearingNumber: payee?.clearing ?? '',
    accountNumber: payee?.accountNumber ?? '',
  };
};

/** Payees have no id in Lifecare, so identity is the account they pay to. */
const isSamePayee = (candidate: Payee, payee?: Payee): boolean =>
  !!payee &&
  candidate.name === payee.name &&
  candidate.paymentMethod === payee.paymentMethod &&
  candidate.clearing === payee.clearing &&
  candidate.accountNumber === payee.accountNumber;

/** A payee as the dropdown shows it: the name plus the account it pays to. */
const payeeLabel = (payee: Payee): string =>
  [payee.name, payee.paymentMethod, [payee.clearing, payee.accountNumber].filter(Boolean).join('-')]
    .filter(Boolean)
    .join(' · ');

/** The betalsätt alternatives — every distinct one seen among the payee options. */
const paymentMethodOptions = (payeeOptions: Payee[]): string[] => [
  ...new Set(payeeOptions.map((payee) => payee.paymentMethod).filter((method): method is string => !!method)),
];

/**
 * The form as caremanagement's PaymentRequest. The fields the form keeps closed (bokföringsdatum,
 * lokalbetalningsnummer, räkningsnummer, OCR) are left out rather than sent empty, and
 * `payeeStakeholderId` stays unset because the payees come from Lifecare and have no stakeholder id —
 * the payee is identified by name and account instead.
 */
const toPaymentInput = (values: UtbetalningFormValues): PaymentInput => ({
  moneyType: values.moneyType || undefined,
  paymentDate: values.paymentDate || undefined,
  amount: parseAmount(values.amount),
  applicationMonth: values.applicationMonth || undefined,
  reportedOnStakeholderIds: values.reportedOnStakeholderIds,
  paymentMethod: values.paymentMethod || undefined,
  payeeName: values.name || undefined,
  payeeAddress: values.address || undefined,
  payeeCareOf: values.careOf || undefined,
  payeeZipCode: values.zipCode || undefined,
  payeeCity: values.city || undefined,
  clearingNumber: values.clearingNumber || undefined,
  accountNumber: values.accountNumber || undefined,
  messageLines: values.messageLines.map((line) => line.text).filter((text) => text.trim() !== ''),
});

/** "Redovisas på" — the stakeholders the utbetalning is booked on, one checkbox each. */
const ReportedOnField: FC<{
  stakeholders: Stakeholder[];
  disabled: boolean;
  register: UseFormRegister<UtbetalningFormValues>;
}> = ({ stakeholders, disabled, register }) => {
  const { t } = useTranslation('decision');

  return (
    <FormControl fieldset required disabled={disabled} className="w-full">
      <FormLabel>{t('payment.form.reportedOn')}</FormLabel>
      <div className="flex flex-col gap-8">
        {stakeholders.map((stakeholder) => (
          <Checkbox key={stakeholder.id} value={stakeholder.id ?? ''} {...register('reportedOnStakeholderIds')}>
            {stakeholderListLabel(stakeholder, t('payment.form.unknownStakeholder'))}
          </Checkbox>
        ))}
      </div>
    </FormControl>
  );
};

/** "Meddelanderader" — free-text lines sent with the utbetalning, extended one row at a time. */
const MessageLinesField: FC<{
  fields: FieldArrayWithId<UtbetalningFormValues, 'messageLines'>[];
  disabled: boolean;
  register: UseFormRegister<UtbetalningFormValues>;
  onAdd: () => void;
}> = ({ fields, disabled, register, onAdd }) => {
  const { t } = useTranslation('decision');

  return (
    // A fieldset, since the rows share one heading: the legend names the group and each row carries its
    // own numbered label, so a screen reader announces "Meddelanderad 2" rather than repeating the group.
    <FormControl fieldset disabled={disabled} className="w-full">
      <FormLabel>{t('payment.form.messageLines')}</FormLabel>
      <div className="flex flex-col gap-8">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-12">
            <Input
              {...register(`messageLines.${index}.text`)}
              aria-label={t('payment.form.messageLine', { number: index + 1 })}
              className="w-[28rem]"
            />
            {index === 0 ?
              <Button
                type="button"
                size="sm"
                variant="tertiary"
                showBackground
                disabled={disabled}
                aria-label={t('payment.form.addMessageLine')}
                onClick={onAdd}
              >
                <Plus />
              </Button>
            : null}
          </div>
        ))}
      </div>
    </FormControl>
  );
};

/**
 * The Lifecare utbetalning form ("Utbetalning"), rebuilt with sk-web-gui form components and fed by
 * caremanagement's utbetalningsförslag: the proposed date, amount, month and payee prefill the form,
 * and Betalningsmottagare lists the payees seen on the applicant's Lifecare payments (FamilyCare has
 * no payee register, so that list is the only source).
 *
 * Which recipient fields are editable follows the chosen betalsätt — see `getEditableRecipientFields`.
 * Bokföringsdatum, "Utbetalas/bokförs ej", Lokalbetalningsnummer, Räkningsnummer and OCR stay disabled:
 * the proposal carries no counterpart for them and the Lifecare rules that open them are not described
 * anywhere in the API, so enabling them would be a guess.
 *
 * "Nästa" registers the utbetalning through caremanagement's payments resource. It is stored as DRAFT
 * and queues nothing — the robot is started separately through the REGISTER_PAYMENT RPA task, so
 * saving never sets anything in motion.
 */
export const ErrandUtbetalningForm: FC<{
  errandId: string;
  /** The utbetalningsförslag; prefills the form and supplies the payee alternatives. */
  proposal: PaymentProposal;
  /** The errand's ansökningsmånad (ISO yyyy-MM), used when the proposal names no month. */
  applicationMonth?: string;
  /** Disables every field, e.g. when the section is approved. */
  disabled?: boolean;
  /** Called after the utbetalning has been registered, so the parent can refetch. */
  onSaved?: () => void;
}> = ({ errandId, proposal, applicationMonth, disabled = false, onSaved }) => {
  const { t } = useTranslation('decision');
  const { stakeholders } = useErrandStakeholders(errandId);
  const metadata = usePaymentMetadata();
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>();

  const { register, control, handleSubmit, reset, setValue } = useForm<UtbetalningFormValues>({
    defaultValues: EMPTY_FORM_VALUES,
    mode: 'onChange',
  });
  const messageLines = useFieldArray({ control, name: 'messageLines' });

  // useWatch (not the form's watch()) so the strict React-Compiler lint rule stays happy.
  const paymentMethod = useWatch({ control, name: 'paymentMethod' });
  const payeeIndex = useWatch({ control, name: 'payeeIndex' });
  const editableFields = getEditableRecipientFields(paymentMethod);

  const payeeOptions = proposal.payeeOptions ?? [];
  const monthOptions = applicationMonthOptions(proposal.payments?.[0]?.concernedMonth ?? applicationMonth);
  // Betalsätt: caremanagement's catalogue when it has one (it is a documented placeholder until the
  // real Lifecare list is known), plus whatever the applicant's own payees actually use.
  const methodOptions = [
    ...new Set([
      ...metadata.paymentMethods.map((option) => option.displayName ?? option.code ?? ''),
      ...paymentMethodOptions(payeeOptions),
    ]),
  ].filter(Boolean);

  // The proposal is derived on every read, so re-prefill whenever a new one arrives. Anything the
  // handläggare has already typed is replaced — the proposal is the starting point, not a merge.
  useEffect(() => {
    reset(proposedFormValues(proposal, applicationMonth));
  }, [proposal, applicationMonth, reset]);

  // Picking a betalningsmottagare carries its account details across, the way Lifecare ties the two.
  useEffect(() => {
    const payee = payeeOptions[Number(payeeIndex)];
    if (!payeeIndex || !payee) {
      return;
    }
    setValue('name', payee.name ?? '');
    setValue('paymentMethod', payee.paymentMethod ?? '');
    setValue('clearingNumber', payee.clearing ?? '');
    setValue('accountNumber', payee.accountNumber ?? '');
  }, [payeeIndex, payeeOptions, setValue]);

  const submit = handleSubmit(async (values) => {
    setSaving(true);
    setSaveError(undefined);
    const result = await createPayment(errandId, toPaymentInput(values));
    setSaving(false);
    if (result.error) {
      setSaveError(t('payment.form.saveError'));
      return;
    }
    onSaved?.();
  });

  return (
    // noValidate: the required markers mirror Lifecare's own form, but the browser must not block a
    // save on them. caremanagement stores the utbetalning as DRAFT with every field optional, and its
    // Pengar catalogue is still a documented placeholder — a required select with no options would
    // otherwise make the form impossible to submit at all. Validation belongs to caremanagement.
    <form className="flex flex-col gap-24" noValidate onSubmit={(event) => void submit(event)}>
      {proposal.explanation ?
        <p className="m-0 text-dark-secondary">{proposal.explanation}</p>
      : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-16 items-start">
        <FormField label={t('payment.form.moneyType')} required disabled={disabled}>
          <Select {...register('moneyType')}>
            <Select.Option value="" />
            {metadata.moneyTypes.map((option) => (
              <Select.Option key={option.code} value={option.code ?? ''}>
                {option.displayName ?? option.code}
              </Select.Option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-[1fr_16rem] gap-x-16">
          <FormField label={t('payment.form.paymentDate')} required disabled={disabled}>
            <DatePicker {...register('paymentDate')} />
          </FormField>
          <FormField label={t('payment.form.amount')} required disabled={disabled}>
            <Input {...register('amount')} inputMode="decimal" placeholder="0,00" />
          </FormField>
        </div>

        <FormField label={t('payment.form.applicationMonth')} required disabled={disabled}>
          <Select {...register('applicationMonth')}>
            <Select.Option value="" />
            {monthOptions.map((month) => (
              <Select.Option key={month} value={month}>
                {formatApplicationMonth(month)}
              </Select.Option>
            ))}
          </Select>
        </FormField>
        <div aria-hidden />

        <ReportedOnField stakeholders={stakeholders} disabled={disabled} register={register} />

        <div className="flex flex-col gap-16">
          {/* Disabled throughout: the Lifecare rule that opens the bokföring fields is not described
              in the caremanagement API. */}
          <FormField label={t('payment.form.accountingDate')} disabled>
            <DatePicker {...register('accountingDate')} />
          </FormField>
          <Checkbox {...register('excludedFromPayment')} disabled>
            {t('payment.form.excludedFromPayment')}
          </Checkbox>
        </div>

        <FormField label={t('payment.form.recipient')} disabled={disabled}>
          <Select {...register('payeeIndex')}>
            <Select.Option value="" />
            {payeeOptions.map((payee, index) => (
              <Select.Option key={payeeLabel(payee)} value={String(index)}>
                {payeeLabel(payee)}
              </Select.Option>
            ))}
          </Select>
        </FormField>

        <FormField label={t('payment.form.paymentMethod')} required disabled={disabled}>
          <Select {...register('paymentMethod')}>
            <Select.Option value="" />
            {methodOptions.map((method) => (
              <Select.Option key={method} value={method}>
                {method}
              </Select.Option>
            ))}
          </Select>
        </FormField>

        <FormField label={t('payment.form.name')} disabled={disabled}>
          <Input {...register('name')} />
        </FormField>
        <FormField label={t('payment.form.address')} disabled={disabled}>
          <Input {...register('address')} />
        </FormField>

        <FormField label={t('payment.form.careOf')} disabled={disabled || !editableFields.postalAddress}>
          <Input {...register('careOf')} />
        </FormField>
        <div className="grid grid-cols-[12rem_1fr] gap-x-16">
          <FormField label={t('payment.form.zipCode')} disabled={disabled || !editableFields.postalAddress}>
            <Input {...register('zipCode')} />
          </FormField>
          <FormField label={t('payment.form.city')} disabled={disabled || !editableFields.postalAddress}>
            <Input {...register('city')} />
          </FormField>
        </div>

        <div className="grid grid-cols-[10rem_1fr] gap-x-16">
          <FormField label={t('payment.form.clearingNumber')} disabled={disabled || !editableFields.clearingNumber}>
            <Input {...register('clearingNumber')} />
          </FormField>
          <FormField label={t('payment.form.accountNumber')} disabled={disabled || !editableFields.accountNumber}>
            <Input {...register('accountNumber')} />
          </FormField>
        </div>
        {/* No counterpart in the proposal; kept visible but closed until Lifecare's rule is known. */}
        <FormField label={t('payment.form.localPaymentNumber')} disabled>
          <Input {...register('localPaymentNumber')} />
        </FormField>

        <div className="flex items-end gap-16">
          <FormField label={t('payment.form.invoiceNumber')} disabled>
            <Input {...register('invoiceNumber')} />
          </FormField>
          <Checkbox {...register('usesOcr')} disabled className="mb-12">
            {t('payment.form.usesOcr')}
          </Checkbox>
        </div>
        <div aria-hidden />

        <MessageLinesField
          fields={messageLines.fields}
          disabled={disabled}
          register={register}
          onAdd={() => {
            messageLines.append({ text: '' });
          }}
        />
      </div>

      <div className="flex gap-16">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => {
            reset(proposedFormValues(proposal, applicationMonth));
          }}
        >
          {t('common:cancel')}
        </Button>
        <Button type="submit" variant="primary" color="primary" disabled={disabled || saving}>
          {saving ? t('payment.form.saving') : t('payment.form.next')}
        </Button>
      </div>

      {saveError ?
        <p className="m-0 text-error-surface-primary" role="alert">
          {saveError}
        </p>
      : null}
    </form>
  );
};
