'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { Bevakning, createBevakning, deleteBevakning } from '@services/bevakning-service';
import { Button, DatePicker, FormControl, FormLabel, Input, Textarea } from '@sk-web-gui/react';
import { formatDateRange } from '@utils/date-range';
import { Trash } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LifecareSourceBadge } from './lifecare-source-badge.component';

interface ErrandBevakningarProps {
  errandId: string;
  bevakningar: Bevakning[];
  isLoading: boolean;
  loadError: boolean;
  refresh: () => void;
}

/** Sidebar section listing an errand's bevakningar (date-bound watches/reminders) with add + delete. */
export const ErrandBevakningar: FC<ErrandBevakningarProps> = ({
  errandId,
  bevakningar,
  isLoading,
  loadError,
  refresh,
}) => {
  const { t } = useTranslation('sidebar');
  const [title, setTitle] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [busyId, setBusyId] = useState<string>();

  const canSave = title.trim() !== '' && startDate !== '' && !saving;

  const add = async (): Promise<void> => {
    if (!canSave) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const res = await createBevakning(errandId, {
      title: title.trim(),
      startDate,
      endDate: endDate || undefined,
      description: description.trim() || undefined,
    });
    setSaving(false);
    if (res.error) {
      setError(t('bevakningar.saveError'));
      return;
    }
    setTitle('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    refresh();
  };

  const remove = async (bevakningId?: string): Promise<void> => {
    if (!bevakningId) {
      return;
    }
    setBusyId(bevakningId);
    setError(undefined);
    const res = await deleteBevakning(errandId, bevakningId);
    setBusyId(undefined);
    if (res.error) {
      setError(t('bevakningar.deleteError'));
      return;
    }
    refresh();
  };

  return (
    <div className="flex flex-col gap-16 h-full">
      {error && <p className="text-error-surface-primary m-0">{error}</p>}

      <AsyncContent
        isLoading={isLoading}
        error={loadError}
        errorText={t('bevakningar.loadError')}
        isEmpty={bevakningar.length === 0}
        emptyText={t('bevakningar.empty')}
      >
        <ul className="flex flex-col gap-12 m-0 p-0 list-none">
          {bevakningar.map((bevakning, index) => (
            <li
              key={bevakning.id ?? index}
              className="border-1 border-divider rounded-12 p-16 flex justify-between gap-12"
            >
              <div className="flex flex-col gap-2 min-w-0">
                <span className="flex items-center gap-8 min-w-0">
                  <span className="font-bold break-words min-w-0">{bevakning.title}</span>
                  <LifecareSourceBadge source={bevakning.source} />
                </span>
                <span className="text-small text-dark-secondary">
                  {formatDateRange(bevakning.startDate, bevakning.endDate, t)}
                </span>
                {bevakning.description ?
                  <span className="text-small break-words whitespace-pre-wrap">{bevakning.description}</span>
                : null}
              </div>
              <Button
                size="sm"
                variant="tertiary"
                iconButton
                aria-label={t('bevakningar.delete')}
                loading={busyId === bevakning.id}
                leftIcon={<Trash />}
                onClick={() => void remove(bevakning.id)}
              />
            </li>
          ))}
        </ul>
      </AsyncContent>

      <div className="mt-auto flex flex-col gap-12 border-t-1 border-divider pt-16">
        <FormControl id="bevakning-titel" className="w-full">
          <FormLabel>{t('bevakningar.title')}</FormLabel>
          <Input
            size="sm"
            value={title}
            placeholder={t('bevakningar.titlePlaceholder')}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
          />
        </FormControl>
        <div className="flex gap-12">
          <FormControl id="bevakning-fran" className="w-full">
            <FormLabel>{t('bevakningar.from')}</FormLabel>
            <DatePicker
              type="date"
              size="sm"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
              }}
            />
          </FormControl>
          <FormControl id="bevakning-till" className="w-full">
            <FormLabel>{t('bevakningar.to')}</FormLabel>
            <DatePicker
              type="date"
              size="sm"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
              }}
            />
          </FormControl>
        </div>
        <FormControl id="bevakning-beskrivning" className="w-full">
          <FormLabel>{t('bevakningar.description')}</FormLabel>
          <Textarea
            rows={2}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
          />
        </FormControl>
        <Button
          color="primary"
          size="sm"
          loading={saving}
          loadingText={t('bevakningar.saving')}
          disabled={!canSave}
          onClick={() => void add()}
        >
          {t('bevakningar.add')}
        </Button>
      </div>
    </div>
  );
};
