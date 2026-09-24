'use client';

import { FormField } from '@components/common/form-field.component';
import { LifecarePaymentOptionsView, PaymentInputDto, Stakeholder } from '@data-contracts/backend/data-contracts';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { registerLifecarePayment } from '@services/lifecare-payment-service';
import { Button, Checkbox, DatePicker, FormControl, FormLabel, Input, Select } from '@sk-web-gui/react';
import { formatAmount, parseAmount } from '@utils/format-amount';
import { getEditableRecipientFields } from '@utils/payment-method';
import { stakeholderListLabel } from '@utils/stakeholder-name';
import { todayDate } from '@utils/today-date';
import { Plus } from 'lucide-react';
import { FC, useEffect, useRef, useState } from 'react';
import { FieldArrayWithId, useFieldArray, useForm, UseFormRegister, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { PayeePicker } from './payee-picker.component';

/** The fields of the Lifecare utbetalning form, in the order they appear in it. */
interface UtbetalningFormValues {
  paymentDate: string;
  amount: string;
  applicationMonth: string;
  /** The stakeholder ids the utbetalning is reported on ("Redovisas på"). */
  reportedOnStakeholderIds: string[];
  accountingDate: string;
  excludedFromPayment: boolean;
  /** The Lifecare id of the chosen betalningsmottagare, as a string for the select. */
  payeeId: string;
  paymentMethod: string;
  name: string;
  address: string;
  careOf: string;
  zipCode: string;
  city: string;
  clearingNumber: string;
  accountNumber: string;
  accountingCode: string;
  localPaymentNumber: string;
  invoiceNumber: string;
  usesOcr: boolean;
  messageLines: { text: string }[];
}

const EMPTY_FORM_VALUES: UtbetalningFormValues = {
  paymentDate: todayDate(),
  amount: '',
  applicationMonth: '',
  reportedOnStakeholderIds: [],
  accountingDate: '',
  excludedFromPayment: false,
  payeeId: '',
  paymentMethod: '',
  name: '',
  address: '',
  careOf: '',
  zipCode: '',
  city: '',
  clearingNumber: '',
  accountNumber: '',
  accountingCode: '',
  localPaymentNumber: '',
  invoiceNumber: '',
  usesOcr: false,
  messageLines: [{ text: '' }],
};

/**
 * The form values Lifecare prefills — its proposed date and month, what is left on the saldo, the payee
 * the insats was last paid to (whose account and address then follow), and the ändamål when the insats
 * has a single konteringsrad. Everything else keeps its empty default.
 */
const proposedFormValues = ({ proposal, postings }: LifecarePaymentOptionsView): UtbetalningFormValues => ({
  ...EMPTY_FORM_VALUES,
  paymentDate: proposal.paymentDate ?? todayDate(),
  amount: proposal.amount === undefined ? '' : formatAmount(proposal.amount),
  applicationMonth: proposal.concernedMonth ?? '',
  payeeId: proposal.payeeId === undefined ? '' : String(proposal.payeeId),
  accountingCode: postings.length === 1 && postings[0] ? String(postings[0].purpose) : '',
});

/**
 * The form as the BFF's utbetalning input. The fields the form keeps closed (bokföringsdatum, OCR) are
 * left out rather than sent empty. The payee goes as its fields — name, account and address, the way
 * Lifecare's own utbetalning copies them from the chosen payee.
 */
const toPaymentInput = (values: UtbetalningFormValues): PaymentInputDto => ({
  paymentDate: values.paymentDate || undefined,
  amount: parseAmount(values.amount),
  applicationMonth: values.applicationMonth || undefined,
  paymentMethod: values.paymentMethod || undefined,
  payeeName: values.name || undefined,
  payeeAddress: values.address || undefined,
  payeeCareOf: values.careOf || undefined,
  payeeZipCode: values.zipCode || undefined,
  payeeCity: values.city || undefined,
  clearingNumber: values.clearingNumber || undefined,
  accountNumber: values.accountNumber || undefined,
  accountingCode: values.accountingCode || undefined,
  localPaymentNumber: values.localPaymentNumber || undefined,
  invoiceNumber: values.invoiceNumber || undefined,
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
      {/* sk-web-gui renders a fieldset's label as a `display: contents` legend, which would put the asterisk
          on a line of its own — so the text and the asterisk share one element here. */}
      <FormLabel showRequired={false}>
        <span>
          {t('payment.form.reportedOn')}
          <span className="sk-form-required-indicator" aria-hidden="true">
            *
          </span>
        </span>
      </FormLabel>
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
 * The Lifecare utbetalning form ("Utbetalning"), rebuilt with sk-web-gui form components. Everything it
 * offers and proposes is Lifecare's own, read live for the insats: the date, amount, month and payee it
 * starts from, the months, Betalningsmottagare, Betalsätt and konteringsrader to choose between.
 *
 * Which recipient fields are editable follows the chosen betalsätt — see `getEditableRecipientFields`.
 * Lokalbetalningsnummer opens when Lifecare says the betalsätt takes one. Räkningsnummer is open: Lifecare
 * refuses a Bankgiro via Plusgiro utbetalning without it. Bokföringsdatum, "Utbetalas/bokförs ej" and OCR
 * stay disabled — the Lifecare rules that open them are not known yet, so enabling them would be a guess.
 *
 * "Spara utbetalning i Lifecare" registers it there straight away — careM keeps no copy. The BFF refuses
 * one it cannot make safely (a saldo that does not cover it, a likadan utbetalning already made) and
 * Lifecare its own; either reason is shown as it came.
 */
export const ErrandUtbetalningForm: FC<{
  errandId: string;
  /** Disables every field, e.g. when the section is approved. */
  disabled?: boolean;
  /** Lifecare's betalsätt, betalningsmottagare and konteringsrader for the insats. */
  options: LifecarePaymentOptionsView;
  /** Lifecare's own reason when it would not hand those lists over. */
  optionsError?: string;
  /** Called after the utbetalning has been registered, so the parent can refetch. */
  onSaved?: () => void;
}> = ({ errandId, options, optionsError, disabled = false, onSaved }) => {
  const { t } = useTranslation('decision');
  const { stakeholders } = useErrandStakeholders(errandId);
  const { payees, paymentMethods, postings } = options;
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>();
  const [savedId, setSavedId] = useState<string>();

  const { register, control, handleSubmit, reset, setValue } = useForm<UtbetalningFormValues>({
    defaultValues: EMPTY_FORM_VALUES,
    mode: 'onChange',
  });
  const messageLines = useFieldArray({ control, name: 'messageLines' });

  // useWatch (not the form's watch()) so the strict React-Compiler lint rule stays happy.
  const paymentMethod = useWatch({ control, name: 'paymentMethod' });
  const payeeId = useWatch({ control, name: 'payeeId' });
  const editableFields = getEditableRecipientFields(paymentMethod);
  // A chosen betalningsmottagare brings its betalsätt, account and address from Lifecare's register, so
  // those fields are shown but cannot be changed here.
  const recipientLocked = disabled || payeeId !== '';
  const chosenMethod = paymentMethods.find((method) => method.name === paymentMethod);

  // Re-prefill when Lifecare proposes something new. The lists are read again after a payee is added,
  // which must not throw away what the handläggare has typed, so an unchanged proposal is left alone.
  const proposedValues = proposedFormValues(options);
  const proposedKey = JSON.stringify(proposedValues);
  const appliedProposalKey = useRef<string>('');
  useEffect(() => {
    if (appliedProposalKey.current !== proposedKey) {
      appliedProposalKey.current = proposedKey;
      reset(proposedValues);
    }
  }, [proposedKey, proposedValues, reset]);

  // Picking a betalningsmottagare carries its account and address across, the way Lifecare's own
  // utbetalning copies them from the payee.
  useEffect(() => {
    const payee = payees.find((option) => String(option.id) === payeeId);
    if (!payee) {
      return;
    }
    setValue('name', payee.name);
    setValue('paymentMethod', payee.paymentMethod);
    setValue('clearingNumber', payee.clearing);
    setValue('accountNumber', payee.accountNumber);
    setValue('address', payee.streetAddress);
    setValue('careOf', payee.careOfAddress);
    setValue('zipCode', payee.postalCode);
    setValue('city', payee.postalAddress);
  }, [payeeId, payees, setValue]);

  const submit = handleSubmit(async (values) => {
    setSaving(true);
    setSaveError(undefined);
    setSavedId(undefined);
    const result = await registerLifecarePayment(errandId, toPaymentInput(values));
    setSaving(false);
    if (result.error || !result.data) {
      setSaveError(result.message ?? t('payment.form.saveError'));
      return;
    }
    setSavedId(result.data.lifecareId);
    onSaved?.();
  });

  return (
    // noValidate: the required markers mirror Lifecare's own form, but the browser must not block a
    // save on them — the BFF and Lifecare validate, and say what is missing in their own words.
    <form className="flex flex-col gap-24" noValidate onSubmit={(event) => void submit(event)}>
      {/* Without Lifecare's lists there is nothing to pick a mottagare, betalsätt or kontering from — say why. */}
      {optionsError ?
        <p className="m-0 text-error-surface-primary" role="alert">
          {t('payment.form.optionsLoadError', { reason: optionsError, interpolation: { escapeValue: false } })}
        </p>
      : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-16 items-start">
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
            {options.concernMonths.map((concernMonth) => (
              <Select.Option key={concernMonth.month} value={concernMonth.month}>
                {concernMonth.label}
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

        <PayeePicker
          payees={payees}
          value={payeeId}
          onChange={(id) => {
            setValue('payeeId', id);
          }}
          disabled={disabled}
        />

        <FormField label={t('payment.form.paymentMethod')} required disabled={recipientLocked}>
          <Select {...register('paymentMethod')}>
            <Select.Option value="" />
            {paymentMethods.map((method) => (
              <Select.Option key={method.code} value={method.name}>
                {method.name}
              </Select.Option>
            ))}
          </Select>
        </FormField>

        <FormField label={t('payment.form.name')} disabled={recipientLocked}>
          <Input {...register('name')} />
        </FormField>
        <FormField label={t('payment.form.address')} disabled={recipientLocked}>
          <Input {...register('address')} />
        </FormField>

        <FormField label={t('payment.form.careOf')} disabled={recipientLocked || !editableFields.postalAddress}>
          <Input {...register('careOf')} />
        </FormField>
        <div className="grid grid-cols-[12rem_1fr] gap-x-16">
          <FormField label={t('payment.form.zipCode')} disabled={recipientLocked || !editableFields.postalAddress}>
            <Input {...register('zipCode')} />
          </FormField>
          <FormField label={t('payment.form.city')} disabled={recipientLocked || !editableFields.postalAddress}>
            <Input {...register('city')} />
          </FormField>
        </div>

        <div className="grid grid-cols-[10rem_1fr] gap-x-16">
          <FormField
            label={t('payment.form.clearingNumber')}
            disabled={recipientLocked || !editableFields.clearingNumber}
          >
            <Input {...register('clearingNumber')} />
          </FormField>
          <FormField
            label={t('payment.form.accountNumber')}
            disabled={recipientLocked || !editableFields.accountNumber}
          >
            <Input {...register('accountNumber')} />
          </FormField>
        </div>
        {/* Kontering is the ändamål the amount is booked on — one of the insats's own konteringsrader in
            Lifecare. The whole amount goes on the one picked. */}
        <FormField label={t('payment.form.accountingCode')} required disabled={disabled}>
          <Select {...register('accountingCode')}>
            <Select.Option value="" />
            {postings.map((posting) => (
              <Select.Option key={posting.purpose} value={String(posting.purpose)}>
                {posting.text}
              </Select.Option>
            ))}
          </Select>
        </FormField>

        {/* Lifecare says per betalsätt whether a lokalbetalningsnummer is taken, and whether it must be. */}
        <FormField
          label={t('payment.form.localPaymentNumber')}
          required={chosenMethod?.localNumberMandatory}
          disabled={disabled || !chosenMethod?.localNumberEnabled}
        >
          <Input {...register('localPaymentNumber')} />
        </FormField>

        <div className="flex items-end gap-16">
          <FormField label={t('payment.form.invoiceNumber')} disabled={disabled}>
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
            reset(proposedValues);
          }}
        >
          {t('common:cancel')}
        </Button>
        <Button type="submit" variant="primary" color="primary" disabled={disabled || saving}>
          {saving ? t('payment.form.saving') : t('payment.form.save')}
        </Button>
      </div>

      {saveError ?
        <p className="m-0 text-error-surface-primary" role="alert">
          {saveError}
        </p>
      : null}
      {savedId ?
        <p className="m-0 text-success-surface-primary" role="status">
          {t('payment.form.saved', { id: savedId })}
        </p>
      : null}
    </form>
  );
};
