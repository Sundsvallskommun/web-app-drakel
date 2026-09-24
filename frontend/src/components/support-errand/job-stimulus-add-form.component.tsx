'use client';

import { addJobStimulusPeriod } from '@services/job-stimulus-service';
import { Button, DatePicker, FormControl, FormLabel } from '@sk-web-gui/react';
import { Plus } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Adds a jobbstimulans period for the sökande, straight to the insats in Lifecare. The end may be left
 * empty: Lifecare then sets it by its own two-year rule.
 */
export const JobStimulusAddForm: FC<{ errandId: string; onAdded: () => void }> = ({ errandId, onAdded }) => {
  const { t } = useTranslation('application');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const add = async (): Promise<void> => {
    setSaving(true);
    setError(undefined);
    const result = await addJobStimulusPeriod(errandId, { fromDate, toDate: toDate || undefined });
    setSaving(false);
    if (result.error) {
      // Lifecare's own reason, or why Drakel will not send the change, when there is one.
      setError(result.message ?? t('jobStimulus.addError'));
      return;
    }
    setFromDate('');
    setToDate('');
    onAdded();
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-end gap-16">
        <FormControl id="job-stimulus-from" className="w-full sm:w-[20rem]">
          <FormLabel>{t('jobStimulus.fromDate')}</FormLabel>
          <DatePicker
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
            }}
          />
        </FormControl>
        <FormControl id="job-stimulus-to" className="w-full sm:w-[20rem]">
          <FormLabel>{t('jobStimulus.toDate')}</FormLabel>
          <DatePicker
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
            }}
          />
        </FormControl>
        <Button
          color="vattjom"
          variant="secondary"
          leftIcon={<Plus />}
          loading={saving}
          disabled={!fromDate || saving}
          onClick={() => void add()}
        >
          {t('jobStimulus.add')}
        </Button>
      </div>
      <p className="m-0 text-small text-dark-secondary">{t('jobStimulus.toDateHelp')}</p>
      {error ?
        <p className="m-0 text-error-surface-primary">{error}</p>
      : null}
    </div>
  );
};
