'use client';

import { FormField } from '@components/common/form-field.component';
import { Stakeholder } from '@data-contracts/backend/data-contracts';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { Button, Checkbox, DatePicker, FormControl, FormLabel, Input, Select } from '@sk-web-gui/react';
import { applicationMonthOptions, formatApplicationMonth } from '@utils/application-month';
import { getEditableRecipientFields, PAYMENT_METHODS } from '@utils/payment-method';
import { stakeholderListLabel } from '@utils/stakeholder-name';
import { todayDate } from '@utils/today-date';
import { Plus } from 'lucide-react';
import { FC, useEffect } from 'react';
import { FieldArrayWithId, useFieldArray, useForm, UseFormRegister, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

/** The fields of the Lifecare utbetalning form, in the order they appear in it. */
export interface UtbetalningFormValues {
  moneyType: string;
  paymentDate: string;
  amount: string;
  applicationMonth: string;
  /** The stakeholder ids the utbetalning is reported on ("Redovisas på"). */
  reportedOnStakeholderIds: string[];
  accountingDate: string;
  excludedFromPayment: boolean;
  recipientStakeholderId: string;
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

const emptyFormValues = (applicationMonth?: string): UtbetalningFormValues => ({
  moneyType: '',
  paymentDate: todayDate(),
  amount: '',
  applicationMonth: applicationMonth ?? '',
  reportedOnStakeholderIds: [],
  accountingDate: '',
  excludedFromPayment: false,
  recipientStakeholderId: '',
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
 * The Lifecare utbetalning form ("Utbetalning"), rebuilt with sk-web-gui form components.
 *
 * Which recipient fields are editable follows the chosen betalsätt — see `getEditableRecipientFields`.
 * Bokföringsdatum and "Utbetalas/bokförs ej" stay disabled: the Lifecare rule that opens them is not
 * described anywhere in the caremanagement API, so enabling them would be a guess.
 *
 * TODO: the form is not submitted anywhere yet. caremanagement has no endpoint that takes an
 * utbetalning — the only route into Lifecare is the `REGISTER_PAYMENT` RPA task
 * (`POST /errands/{errandId}/rpa-tasks`), whose `parameters` map is untyped. Wire `onSubmit` up once
 * the RPA team has confirmed the parameter keys the robot expects.
 */
export const ErrandUtbetalningForm: FC<{
  errandId: string;
  /** The errand's ansökningsmånad (ISO yyyy-MM) — prefills and anchors "Avser månad". */
  applicationMonth?: string;
  /** Disables every field, e.g. when the section is approved. */
  disabled?: boolean;
  /** Called by "Nästa". Absent until there is an API to register the utbetalning against. */
  onSubmit?: (values: UtbetalningFormValues) => void;
}> = ({ errandId, applicationMonth, disabled = false, onSubmit }) => {
  const { t } = useTranslation('decision');
  const { stakeholders } = useErrandStakeholders(errandId);

  const { register, control, handleSubmit, reset, setValue } = useForm<UtbetalningFormValues>({
    defaultValues: emptyFormValues(applicationMonth),
    mode: 'onChange',
  });
  const messageLines = useFieldArray({ control, name: 'messageLines' });

  // useWatch (not the form's watch()) so the strict React-Compiler lint rule stays happy.
  const paymentMethod = useWatch({ control, name: 'paymentMethod' });
  const recipientStakeholderId = useWatch({ control, name: 'recipientStakeholderId' });
  const editableFields = getEditableRecipientFields(paymentMethod);
  const monthOptions = applicationMonthOptions(applicationMonth);

  // The name and address of a chosen betalningsmottagare are already known from the errand's
  // stakeholders — prefill them so the handläggare only has to correct what differs.
  useEffect(() => {
    const recipient = stakeholders.find((stakeholder) => stakeholder.id === recipientStakeholderId);
    if (!recipient) {
      return;
    }
    setValue('name', stakeholderListLabel(recipient, ''));
    setValue('address', recipient.address ?? '');
    setValue('careOf', recipient.careOf ?? '');
    setValue('zipCode', recipient.zipCode ?? '');
    setValue('city', recipient.city ?? '');
  }, [recipientStakeholderId, stakeholders, setValue]);

  const submit = handleSubmit((values) => onSubmit?.(values));

  return (
    <form className="flex flex-col gap-24" onSubmit={(event) => void submit(event)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-16 items-start">
        <FormField label={t('payment.form.moneyType')} required disabled={disabled}>
          {/* TODO: the Lifecare money types ("Ek. Bistånd 3,00" etc.) have no source in the
              caremanagement API — the options have to come from Lifecare metadata. */}
          <Select {...register('moneyType')}>
            <Select.Option value="" />
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
          <Select {...register('recipientStakeholderId')}>
            <Select.Option value="" />
            {stakeholders.map((stakeholder) => (
              <Select.Option key={stakeholder.id} value={stakeholder.id ?? ''}>
                {stakeholderListLabel(stakeholder, t('payment.form.unknownStakeholder'))}
              </Select.Option>
            ))}
          </Select>
        </FormField>

        <FormField label={t('payment.form.paymentMethod')} required disabled={disabled}>
          <Select {...register('paymentMethod')}>
            <Select.Option value="" />
            {PAYMENT_METHODS.map((method) => (
              <Select.Option key={method} value={method}>
                {t(`payment.form.paymentMethods.${method}`)}
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
          <FormField label={t('payment.form.clearingNumber')} disabled={disabled || !editableFields.bankAccount}>
            <Input {...register('clearingNumber')} />
          </FormField>
          <FormField label={t('payment.form.accountNumber')} disabled={disabled || !editableFields.bankAccount}>
            <Input {...register('accountNumber')} />
          </FormField>
        </div>
        <FormField
          label={t('payment.form.localPaymentNumber')}
          disabled={disabled || !editableFields.localPaymentNumber}
        >
          <Input {...register('localPaymentNumber')} />
        </FormField>

        <div className="flex items-end gap-16">
          <FormField label={t('payment.form.invoiceNumber')} disabled={disabled || !editableFields.invoiceReference}>
            <Input {...register('invoiceNumber')} />
          </FormField>
          <Checkbox {...register('usesOcr')} disabled={disabled || !editableFields.invoiceReference} className="mb-12">
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
            reset();
          }}
        >
          {t('common:cancel')}
        </Button>
        <Button type="submit" variant="primary" color="primary" disabled={disabled}>
          {t('payment.form.next')}
        </Button>
      </div>
    </form>
  );
};
