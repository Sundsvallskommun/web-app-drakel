'use client';

import {
  FormSnapshot,
  FormSnapshotField,
  FormSnapshotNotice,
  FormSnapshotSection,
} from '@data-contracts/backend/data-contracts';
import dayjs from 'dayjs';
import { FC, ReactNode } from 'react';

/** A field/section was shown to the applicant unless it was explicitly hidden. */
const wasVisible = (visible?: boolean): boolean => visible !== false;

/** The human-readable answer for a field — the display text the applicant saw, falling back to raw value/code. */
const answerText = (field: FormSnapshotField): string => {
  const answer = field.answer;
  const single = answer?.display ?? answer?.value ?? answer?.code ?? '';
  if (single) {
    return single;
  }
  // Multi-select / option fields without a combined answer: join the labels of the selected options.
  const selected = (field.options ?? [])
    .filter((option) => option.selected)
    .map((option) => option.label ?? option.code ?? '')
    .filter((label) => label.length > 0);
  return selected.join(', ');
};

const noticeClassName = (level?: string): string =>
  level === 'ERROR' ? 'text-error-surface-primary'
  : level === 'WARNING' ? 'text-warning'
  : 'text-dark-secondary';

const Notices: FC<{ notices?: FormSnapshotNotice[] }> = ({ notices }) =>
  !notices || notices.length === 0 ?
    null
  : <div className="flex flex-col gap-2 mt-2">
      {notices.map((notice, index) => (
        <span key={index} className={`text-small ${noticeClassName(notice.level)}`}>
          {notice.text}
        </span>
      ))}
    </div>;

/** Help / info texts shown under a field label, exactly as the applicant saw them. */
const HelpTexts: FC<{ field: FormSnapshotField }> = ({ field }) => {
  const texts = [field.helpText, ...(field.infoTexts ?? [])].filter((text): text is string => !!text && text.length > 0);
  return texts.length === 0 ?
      null
    : <div className="flex flex-col gap-2 mt-2">
        {texts.map((text, index) => (
          <span key={index} className="text-small text-dark-secondary italic">
            {text}
          </span>
        ))}
      </div>;
};

const fieldLabel = (field: FormSnapshotField): string => `${field.label ?? field.name ?? ''}${field.required ? ' *' : ''}`;

/** A label/value pair laid out in two columns on wider screens; stacked on mobile. */
const FieldRow: FC<{ label?: string; help?: ReactNode; children: ReactNode }> = ({
  label,
  help,
  children,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-16 gap-y-2 py-12 border-b-1 border-divider last:border-b-0">
    <div className="md:col-span-1">
      {label ? <span className="text-small font-bold text-dark-secondary">{label}</span> : null}
      {help}
    </div>
    <div className="md:col-span-2 min-w-0">{children}</div>
  </div>
);

/** A single field rendered as it was answered. REPEATING_GROUP fields recurse into their visible instances. */
const SnapshotFieldRow: FC<{ field: FormSnapshotField }> = ({ field }) => {
  if (field.inputType === 'REPEATING_GROUP') {
    const instances = (field.items ?? [])
      .map((instance) => instance.filter((nested) => wasVisible(nested.visible)))
      .filter((instance) => instance.length > 0);
    return (
      <div className="py-12 border-b-1 border-divider last:border-b-0">
        <span className="text-small font-bold text-dark-secondary">{fieldLabel(field)}</span>
        <HelpTexts field={field} />
        {instances.length === 0 ?
          <span className="block mt-4 text-dark-secondary">—</span>
        : <div className="flex flex-col gap-8 mt-8">
            {instances.map((nested, index) => (
              <div key={index} className="border-1 border-divider rounded-12 px-16 bg-background-100">
                {instances.length > 1 ?
                  <span className="block font-bold text-small pt-8">{`${field.label ?? 'Post'} ${index + 1}`}</span>
                : null}
                <div className="flex flex-col">
                  {nested.map((nestedField, nestedIndex) => (
                    <SnapshotFieldRow key={nestedField.name ?? nestedIndex} field={nestedField} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        }
        <Notices notices={field.notices} />
      </div>
    );
  }

  const value = answerText(field);

  // A STATIC field with no value is purely informational text the applicant saw (an intro/heading).
  if (field.inputType === 'STATIC' && !value) {
    return (
      <div className="flex flex-col py-12 border-b-1 border-divider last:border-b-0">
        {field.label ? <span className="font-bold text-small">{field.label}</span> : null}
        <HelpTexts field={field} />
        <Notices notices={field.notices} />
      </div>
    );
  }

  return (
    <FieldRow label={fieldLabel(field)} help={<HelpTexts field={field} />}>
      <span className="break-words">{value || '—'}</span>
      <Notices notices={field.notices} />
    </FieldRow>
  );
};

const SnapshotSection: FC<{ section: FormSnapshotSection }> = ({ section }) => {
  const fields = (section.fields ?? []).filter((field) => wasVisible(field.visible));
  if (fields.length === 0) {
    return null;
  }
  return (
    <section className="rounded-12 border-1 border-divider overflow-hidden bg-background-content">
      {section.title || section.description ?
        <div className="bg-background-200 px-16 py-12 border-b-1 border-divider">
          {section.title ? <h3 className="m-0 text-h4-sm md:text-h4-md">{section.title}</h3> : null}
          {section.description ? <p className="m-0 mt-2 text-small text-dark-secondary">{section.description}</p> : null}
        </div>
      : null}
      <div className="flex flex-col px-16">
        {fields.map((field, index) => (
          <SnapshotFieldRow key={field.name ?? index} field={field} />
        ))}
      </div>
    </section>
  );
};

/**
 * Re-renders a captured application FormSnapshot as the read-only "sammanställning" — the form exactly as
 * the applicant saw and answered it (sections → fields → answers, with the original labels, help/notice
 * texts and option labels). Each section is a card and each field a label/value row. Only the
 * sections/fields that were visible to the applicant are shown.
 */
export const FormSnapshotView: FC<{ snapshot: FormSnapshot }> = ({ snapshot }) => {
  const sections = (snapshot.sections ?? []).filter((section) => wasVisible(section.visible));
  return (
    <div className="flex flex-col gap-16">
      <div className="flex flex-col gap-2">
        <span className="font-bold text-large">{snapshot.title ?? 'Sammanställning'}</span>
        {snapshot.capturedAt ?
          <span className="text-small text-dark-secondary">
            Ifylld {dayjs(snapshot.capturedAt).format('YYYY-MM-DD HH:mm')}
          </span>
        : null}
      </div>

      {sections.map((section, index) => (
        <SnapshotSection key={section.id ?? index} section={section} />
      ))}

      {snapshot.attestation ?
        <section className="rounded-12 border-1 border-divider bg-background-content px-16 py-12 flex flex-col gap-2">
          <span className="text-small font-bold text-dark-secondary">Försäkran</span>
          {snapshot.attestation.label ? <span className="break-words">{snapshot.attestation.label}</span> : null}
          {snapshot.attestation.answer ?
            <span className="font-bold">
              {snapshot.attestation.answer.display ?? snapshot.attestation.answer.value ?? ''}
            </span>
          : null}
        </section>
      : null}
    </div>
  );
};
