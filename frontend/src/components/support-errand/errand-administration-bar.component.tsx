'use client';

import { useAdministrators } from '@hooks/use-administrators';
import { ErrandForm } from '@hooks/use-errand-form';
import { useStatuses } from '@hooks/use-statuses';
import { useUserStore } from '@services/user-service/user-service';
import { Button, Divider, Select } from '@sk-web-gui/react';
import { PRIORITY_OPTIONS } from '@utils/errand-priority';
import { errandStatusLabel } from '@utils/errand-status';
import { FC, ReactNode, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { ErrandTilldela } from './errand-tilldela.component';

interface ErrandAdministrationBarProps {
  form: ErrandForm;
  setField: (key: keyof ErrandForm, value: string) => void;
  isDirty: boolean;
  saving: boolean;
  error?: string;
  onSave: () => void;
  /** Process actions shown after "Tilldela" (e.g. "Besluta och utbetala", "Arkivera till aktualisering"). */
  actions?: ReactNode;
}

const BarDivider: FC = () => <Divider orientation="vertical" className="self-stretch max-lg:hidden" />;

/**
 * The bar under the app header holding the errand's handläggning: assignee ("Ta ärende"/"Tilldela"), the
 * process actions, status and priority, and the single central "Spara" button that saves every edited field
 * across the errand view.
 */
export const ErrandAdministrationBar: FC<ErrandAdministrationBarProps> = ({
  form,
  setField,
  isDirty,
  saving,
  error,
  onSave,
  actions,
}) => {
  const { statuses } = useStatuses();
  const { administrators } = useAdministrators();
  const username = useUserStore(useShallow((state) => state.user.username));

  // Statusalternativen kommer från STATUS-metadata, men den listan är ofta tom i caremanagement —
  // då saknas options och Select:en faller tillbaka på "Välj status" trots att ärendet har en status.
  // Inkludera därför alltid ärendets nuvarande status så den visas och kan behållas.
  const statusOptions = useMemo(() => {
    const options = statuses.map((lookup) => ({
      name: lookup.name ?? '',
      label: lookup.displayName ?? errandStatusLabel(lookup.name ?? ''),
    }));
    if (form.status && !options.some((option) => option.name === form.status)) {
      options.unshift({ name: form.status, label: errandStatusLabel(form.status) });
    }
    return options;
  }, [statuses, form.status]);

  // Handläggare come from Active Directory. Always include the errand's current assignee (even if it's not
  // in the roster, e.g. "Ta ärende" set it to the logged-in user) so it stays selectable and displayable.
  const assigneeOptions = useMemo(() => {
    const options = administrators.map((admin) => ({ value: admin.username, label: admin.displayName }));
    if (form.assignedUserId && !options.some((option) => option.value === form.assignedUserId)) {
      options.unshift({ value: form.assignedUserId, label: form.assignedUserId });
    }
    return options;
  }, [administrators, form.assignedUserId]);

  const assigneeName = assigneeOptions.find((option) => option.value === form.assignedUserId)?.label;

  return (
    <div className="shrink-0 bg-background-content shadow-50 px-24 py-16 flex flex-wrap items-center gap-x-24 gap-y-12 relative z-10">
      <div className="flex items-center gap-6 text-small whitespace-nowrap">
        <span>
          <strong>Handläggare:</strong> {assigneeName ?? 'Ej tilldelad'}
        </span>
        {username && form.assignedUserId !== username ?
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setField('assignedUserId', username);
            }}
          >
            Ta ärende
          </Button>
        : null}
      </div>

      <BarDivider />

      <div className="flex flex-wrap items-center gap-12">
        <ErrandTilldela
          assignedUserId={form.assignedUserId}
          options={assigneeOptions}
          onAssign={(assignee) => {
            setField('assignedUserId', assignee);
          }}
        />
        {actions}
      </div>

      <BarDivider />

      <div className="flex flex-wrap items-center gap-24">
        <label htmlFor="errand-status" className="flex items-center gap-8 text-small font-bold">
          Status
          <Select
            id="errand-status"
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
        </label>

        <label htmlFor="errand-priority" className="flex items-center gap-8 text-small font-bold">
          Prioritet
          <Select
            id="errand-priority"
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
            {PRIORITY_OPTIONS.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </label>
      </div>

      <BarDivider />

      <div className="flex flex-1 items-center justify-end gap-12">
        {error && <p className="text-error-surface-primary text-small m-0">{error}</p>}
        <Button
          color="vattjom"
          inverted
          size="sm"
          disabled={!isDirty}
          loading={saving}
          loadingText="Sparar…"
          onClick={onSave}
        >
          Spara
        </Button>
      </div>
    </div>
  );
};
