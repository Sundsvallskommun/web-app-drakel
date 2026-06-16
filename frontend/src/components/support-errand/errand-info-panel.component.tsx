'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { ErrandForm } from '@hooks/use-errand-form';
import { useStatuses } from '@hooks/use-statuses';
import { useUserStore } from '@services/user-service/user-service';
import { Button, Divider, FormControl, FormLabel, Input, Select } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { FC } from 'react';
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
}) => {
  const { statuses } = useStatuses();
  const username = useUserStore(useShallow((state) => state.user.username));

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
          value={form.assignedUserId}
          onChange={(event) => {
            setField('assignedUserId', event.target.value);
          }}
        />
      </FormControl>

      <FormControl id="status" className="w-full">
        <FormLabel>Ärendestatus</FormLabel>
        <Select
          value={form.status}
          onChange={(event) => {
            setField('status', event.target.value);
          }}
        >
          <Select.Option value="">Välj status</Select.Option>
          {statuses.map((lookup) => (
            <Select.Option key={lookup.name} value={lookup.name ?? ''}>
              {lookup.displayName ?? lookup.name}
            </Select.Option>
          ))}
        </Select>
      </FormControl>

      <FormControl id="priority" className="w-full">
        <FormLabel>Prioritet</FormLabel>
        <Select
          value={form.priority}
          onChange={(event) => {
            setField('priority', event.target.value);
          }}
        >
          <Select.Option value="">Välj prioritet</Select.Option>
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
          <span className="font-bold">Ärende-id:</span> {errand.id ?? '—'}
        </span>
        <span>
          <span className="font-bold">Ärendetyp:</span> {errand.typeSlug ?? '—'}
        </span>
      </div>
    </div>
  );
};
