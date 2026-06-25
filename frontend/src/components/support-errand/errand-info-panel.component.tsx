'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { ErrandForm } from '@hooks/use-errand-form';
import { useStatuses } from '@hooks/use-statuses';
import { useUserStore } from '@services/user-service/user-service';
import { Button, Divider, FormControl, FormLabel, Input, Select } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { FC, ReactNode, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

const PRIORITIES = [
  { value: 'LOW', label: 'Låg' },
  { value: 'MEDIUM', label: 'Medel' },
  { value: 'HIGH', label: 'Hög' },
];

const formatDate = (value?: string): string => (value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '—');

interface ErrandInfoPanelProps {
  errand: Errand;
  form: ErrandForm;
  setField: (key: keyof ErrandForm, value: string) => void;
  isDirty: boolean;
  saving: boolean;
  error?: string;
  onSave: () => void;
  /** Rendered under the "Spara ärende" divider (the sidebar's "Avsluta ärende" action). */
  avslutaSlot?: ReactNode;
  /** Rendered above the Avsluta action (e.g. the supplementary-application "Arkivera till aktualisering"). */
  actualiseringSlot?: ReactNode;
}

/**
 * "Handläggning" panel — assignee, status and priority. Holds the single central "Spara ärende"
 * button that saves every edited field across the errand view (basics + handläggning).
 */
export const ErrandInfoPanel: FC<ErrandInfoPanelProps> = ({
  errand,
  form,
  setField,
  isDirty,
  saving,
  error,
  onSave,
  avslutaSlot,
  actualiseringSlot,
}) => {
  const { statuses } = useStatuses();
  const username = useUserStore(useShallow((state) => state.user.username));

  // Statusalternativen kommer från STATUS-metadata, men den listan är ofta tom i caremanagement —
  // då saknas options och Select:en faller tillbaka på "Välj status" trots att ärendet har en status.
  // Inkludera därför alltid ärendets nuvarande status så den visas och kan behållas.
  const statusOptions = useMemo(() => {
    const options = statuses.map((lookup) => ({
      name: lookup.name ?? '',
      label: lookup.displayName ?? lookup.name ?? '',
    }));
    if (form.status && !options.some((option) => option.name === form.status)) {
      options.unshift({ name: form.status, label: form.status });
    }
    return options;
  }, [statuses, form.status]);

  return (
    <div className="flex flex-col gap-16">
      <h2 className="text-h4-sm md:text-h4-md m-0">Handläggning</h2>

      <FormControl id="assignee" className="w-full">
        <div className="flex justify-between items-center gap-8">
          <FormLabel className="mb-0">Ansvarig</FormLabel>
          {username && form.assignedUserId !== username && (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setField('assignedUserId', username);
              }}
            >
              Ta ärende
            </Button>
          )}
        </div>
        <Input
          size="sm"
          value={form.assignedUserId}
          onChange={(event) => {
            setField('assignedUserId', event.target.value);
          }}
        />
      </FormControl>

      <FormControl id="status" className="w-full">
        <FormLabel>Ärendestatus</FormLabel>
        <Select
          className="w-full"
          size="sm"
          value={form.status}
          onChange={(event) => {
            setField('status', event.target.value);
          }}
        >
          {!form.status && (
            <Select.Option value="" disabled>
              Ej satt
            </Select.Option>
          )}
          {statusOptions.map((option) => (
            <Select.Option key={option.name} value={option.name}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      </FormControl>

      <FormControl id="priority" className="w-full">
        <FormLabel>Prioritet</FormLabel>
        <Select
          className="w-full"
          size="sm"
          value={form.priority}
          onChange={(event) => {
            setField('priority', event.target.value);
          }}
        >
          {!form.priority && (
            <Select.Option value="" disabled>
              Ej satt
            </Select.Option>
          )}
          {PRIORITIES.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              {option.label}
            </Select.Option>
          ))}
        </Select>
      </FormControl>

      {error && <p className="text-error-surface-primary m-0">{error}</p>}

      <Button
        color="vattjom"
        variant="primary"
        disabled={!isDirty}
        loading={saving}
        loadingText="Sparar…"
        onClick={onSave}
      >
        Spara ärende
      </Button>

      <Divider />

      {actualiseringSlot}

      {avslutaSlot}

      <div className="flex flex-col gap-8 text-small">
        <span>
          <span className="font-bold">Rapportör:</span> {errand.reporterUserId ?? '—'}
        </span>
        <span>
          <span className="font-bold">Registrerad:</span> {formatDate(errand.created)}
        </span>
        <span>
          <span className="font-bold">Senast ändrad:</span> {formatDate(errand.modified)}
        </span>
        <span className="break-words">
          <span className="font-bold">Ärendenummer:</span> {errand.errandNumber ?? '—'}
        </span>
        <span>
          <span className="font-bold">Ärendetyp:</span> {errand.typeSlug ?? '—'}
        </span>
      </div>
    </div>
  );
};
