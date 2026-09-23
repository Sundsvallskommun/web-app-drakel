'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { CreateLifecareReminderDto, LifecareReminderView } from '@data-contracts/backend/data-contracts';
import { useLifecareReminderOptions } from '@hooks/use-lifecare-reminder-options';
import {
  createLifecareReminder,
  removeLifecareReminder,
  updateLifecareReminder,
} from '@services/lifecare-reminder-service';
import { Button } from '@sk-web-gui/react';
import { Pencil, Trash } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LifecareReminderForm } from './lifecare-reminder-form.component';
import { LifecareReminderRemoveConfirm } from './lifecare-reminder-remove-confirm.component';

interface ErrandBevakningarProps {
  errandId: string;
  reminders: LifecareReminderView[];
  isLoading: boolean;
  loadError: boolean;
  refresh: () => void;
}

/** The form's values for an existing bevakning. */
const toFormValues = (reminder: LifecareReminderView): CreateLifecareReminderDto => ({
  reminderDate: reminder.date,
  priority: reminder.priorityCode,
  status: reminder.statusCode,
  text: reminder.text,
});

/** One bevakning: date and status on top, the text, then who it is "bevakad av" and what it hangs on. */
const ReminderSummary: FC<{ reminder: LifecareReminderView; onEdit: () => void; onRemove: () => void }> = ({
  reminder,
  onEdit,
  onRemove,
}) => {
  const { t } = useTranslation('sidebar');

  return (
    <div className="flex justify-between gap-12">
      <div className="flex flex-col gap-2 min-w-0">
        <span className="flex items-center gap-8">
          <span className="font-bold">{reminder.date}</span>
          <span className="text-small text-dark-secondary">
            {[reminder.status, reminder.priority].filter(Boolean).join(' · ')}
          </span>
        </span>
        {reminder.text ?
          <span className="break-words whitespace-pre-wrap">{reminder.text}</span>
        : null}
        <span className="text-small text-dark-secondary">
          {[reminder.caseworker, reminder.type].filter(Boolean).join(' · ')}
        </span>
      </div>
      <div className="flex shrink-0 gap-4">
        <Button
          size="sm"
          variant="tertiary"
          iconButton
          aria-label={t('bevakningar.edit')}
          leftIcon={<Pencil />}
          onClick={onEdit}
        />
        <Button
          size="sm"
          variant="tertiary"
          iconButton
          aria-label={t('bevakningar.remove')}
          leftIcon={<Trash />}
          onClick={onRemove}
        />
      </div>
    </div>
  );
};

/**
 * Sidebar section with the bevakningar on the errand's insats, read live from Lifecare. A bevakning is
 * added, changed or removed there — changing the status to "Klar" is how one is marked done. It is always an
 * IFO.Insats "Manuell bevakning insats", "bevakad av" the insats's handläggare.
 */
export const ErrandBevakningar: FC<ErrandBevakningarProps> = ({
  errandId,
  reminders,
  isLoading,
  loadError,
  refresh,
}) => {
  const { t } = useTranslation('sidebar');
  const { options } = useLifecareReminderOptions(errandId);
  const [editingId, setEditingId] = useState<number>();
  const [removingId, setRemovingId] = useState<number>();

  const add = async (reminder: CreateLifecareReminderDto): Promise<string | undefined> => {
    const res = await createLifecareReminder(errandId, reminder);
    if (res.error) {
      return res.message ?? t('bevakningar.saveError');
    }
    refresh();
    return undefined;
  };

  const change = async (reminderId: number, reminder: CreateLifecareReminderDto): Promise<string | undefined> => {
    const res = await updateLifecareReminder(errandId, reminderId, reminder);
    if (res.error) {
      return res.message ?? t('bevakningar.saveError');
    }
    setEditingId(undefined);
    refresh();
    return undefined;
  };

  const remove = async (reminderId: number): Promise<string | undefined> => {
    const res = await removeLifecareReminder(errandId, reminderId);
    if (res.error) {
      return res.message ?? t('bevakningar.removeError');
    }
    setRemovingId(undefined);
    refresh();
    return undefined;
  };

  return (
    <div className="flex flex-col gap-16 h-full">
      <AsyncContent
        isLoading={isLoading}
        error={loadError}
        errorText={t('bevakningar.loadError')}
        isEmpty={reminders.length === 0}
        emptyText={t('bevakningar.empty')}
      >
        <ul className="flex flex-col gap-12 m-0 p-0 list-none">
          {reminders.map((reminder) => (
            <li key={reminder.id} className="border-1 border-divider rounded-12 p-16 min-w-0">
              {editingId === reminder.id ?
                <LifecareReminderForm
                  idPrefix={`bevakning-${String(reminder.id)}`}
                  options={options}
                  initial={toFormValues(reminder)}
                  submitLabel={t('common:save')}
                  onSubmit={(values) => change(reminder.id, values)}
                  onCancel={() => {
                    setEditingId(undefined);
                  }}
                />
              : <>
                  <ReminderSummary
                    reminder={reminder}
                    onEdit={() => {
                      setRemovingId(undefined);
                      setEditingId(reminder.id);
                    }}
                    onRemove={() => {
                      setEditingId(undefined);
                      setRemovingId(reminder.id);
                    }}
                  />
                  {removingId === reminder.id ?
                    <LifecareReminderRemoveConfirm
                      onConfirm={() => remove(reminder.id)}
                      onCancel={() => {
                        setRemovingId(undefined);
                      }}
                    />
                  : null}
                </>
              }
            </li>
          ))}
        </ul>
      </AsyncContent>

      <div className="mt-auto border-t-1 border-divider pt-16">
        <LifecareReminderForm
          idPrefix="bevakning-ny"
          options={options}
          submitLabel={t('bevakningar.add')}
          onSubmit={add}
        />
      </div>
    </div>
  );
};
