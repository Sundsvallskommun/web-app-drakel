'use client';

import { CreateLifecareReminderDto, LifecareReminderOptionsView } from '@data-contracts/backend/data-contracts';
import { Button, DatePicker, FormControl, FormLabel, Select, Textarea } from '@sk-web-gui/react';
import { todayDate } from '@utils/today-date';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The bevakning form — for a new one, or changing one. Priority and status are Lifecare's own lists; who
 * it is "bevakad av" is not chosen here, it is always the insats's handläggare.
 *
 * A new date cannot be in the past. An existing bevakning keeps its own date as the earliest choice, so
 * an overdue one can still be marked done without moving it.
 */
export const LifecareReminderForm: FC<{
  idPrefix: string;
  options: LifecareReminderOptionsView;
  /** The bevakning being changed; left out for a new one, which starts from Lifecare's proposal. */
  initial?: CreateLifecareReminderDto;
  submitLabel: string;
  /** Saves the bevakning; resolves with Lifecare's reason when it was refused, so the form keeps its values. */
  onSubmit: (reminder: CreateLifecareReminderDto) => Promise<string | undefined>;
  onCancel?: () => void;
}> = ({ idPrefix, options, initial, submitLabel, onSubmit, onCancel }) => {
  const { t } = useTranslation('sidebar');
  const [reminderDate, setReminderDate] = useState<string>(initial?.reminderDate ?? '');
  const [priority, setPriority] = useState<string>(initial ? String(initial.priority) : '');
  const [status, setStatus] = useState<string>(initial ? String(initial.status) : '');
  const [text, setText] = useState<string>(initial?.text ?? '');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  // A new bevakning takes Lifecare's proposed priority and status once its options have loaded.
  useEffect(() => {
    if (initial) {
      return;
    }
    setPriority(options.defaultPriority ? String(options.defaultPriority) : '');
    setStatus(options.defaultStatus ? String(options.defaultStatus) : '');
  }, [initial, options]);

  const today = todayDate();
  const earliestDate = initial && initial.reminderDate < today ? initial.reminderDate : today;
  const canSave = reminderDate >= earliestDate && priority !== '' && status !== '' && text.trim() !== '' && !saving;

  const submit = async (): Promise<void> => {
    if (!canSave) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const refusal = await onSubmit({
      reminderDate,
      priority: Number(priority),
      status: Number(status),
      text: text.trim(),
    });
    setSaving(false);
    setError(refusal);
    if (!refusal && !initial) {
      setReminderDate('');
      setText('');
    }
  };

  return (
    <div className="flex flex-col gap-12">
      <FormControl id={`${idPrefix}-datum`} className="w-full">
        <FormLabel>{t('bevakningar.date')}</FormLabel>
        <DatePicker
          type="date"
          size="sm"
          min={earliestDate}
          value={reminderDate}
          onChange={(event) => {
            setReminderDate(event.target.value);
          }}
        />
      </FormControl>
      <div className="flex gap-12">
        <FormControl id={`${idPrefix}-prioritet`} className="w-full">
          <FormLabel>{t('bevakningar.priority')}</FormLabel>
          <Select
            size="sm"
            className="w-full"
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value);
            }}
          >
            {options.priorities.map((choice) => (
              <Select.Option key={choice.code} value={String(choice.code)}>
                {choice.text}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
        <FormControl id={`${idPrefix}-status`} className="w-full">
          <FormLabel>{t('bevakningar.status')}</FormLabel>
          <Select
            size="sm"
            className="w-full"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
            }}
          >
            {options.statuses.map((choice) => (
              <Select.Option key={choice.code} value={String(choice.code)}>
                {choice.text}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
      </div>
      <FormControl id={`${idPrefix}-text`} className="w-full">
        <FormLabel>{t('bevakningar.text')}</FormLabel>
        <Textarea
          rows={2}
          value={text}
          placeholder={t('bevakningar.textPlaceholder')}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
      </FormControl>
      {error ?
        <p className="text-error-surface-primary m-0" role="alert">
          {error}
        </p>
      : null}
      <div className="flex gap-8">
        <Button
          color="primary"
          size="sm"
          loading={saving}
          loadingText={t('bevakningar.saving')}
          disabled={!canSave}
          onClick={() => void submit()}
        >
          {submitLabel}
        </Button>
        {onCancel ?
          <Button size="sm" variant="tertiary" disabled={saving} onClick={onCancel}>
            {t('common:cancel')}
          </Button>
        : null}
      </div>
    </div>
  );
};
