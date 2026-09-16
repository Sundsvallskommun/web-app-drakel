'use client';

import {
  FormSnapshot,
  FormSnapshotAttestation,
  FormSnapshotField,
  FormSnapshotNotice,
  FormSnapshotSection,
} from '@data-contracts/backend/data-contracts';
import { applicationSectionIcon } from '@utils/application-section-icon';
import { FC } from 'react';

import { ContentBox } from './content-box.component';
import { LabeledValue } from './labeled-value.component';
import { ReadOnlyTable } from './read-only-table.component';
import { SectionAccordion } from './section-accordion.component';

// A repeating group is shown as a table when its instances are simple and narrow enough; otherwise each
// instance becomes its own white card.
const MAX_TABLE_COLUMNS = 4;

/** A field/section was shown to the applicant unless it was explicitly hidden. */
const wasVisible = (visible?: boolean): boolean => visible !== false;

const visibleFields = (fields?: FormSnapshotField[]): FormSnapshotField[] =>
  (fields ?? []).filter((field) => wasVisible(field.visible));

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

const fieldLabel = (field: FormSnapshotField): string =>
  `${field.label ?? field.name ?? ''}${field.required ? ' *' : ''}`;

const isRepeatingGroup = (field: FormSnapshotField): boolean => field.inputType === 'REPEATING_GROUP';

/** A STATIC field with no value is purely informational text the applicant saw (an intro/heading). */
const isInformationText = (field: FormSnapshotField): boolean => field.inputType === 'STATIC' && !answerText(field);

const noticeClassName = (level?: string): string =>
  level === 'ERROR' ? 'text-error-surface-primary'
  : level === 'WARNING' ? 'text-warning'
  : 'text-dark-secondary';

const Notices: FC<{ notices?: FormSnapshotNotice[] }> = ({ notices }) =>
  !notices || notices.length === 0 ?
    null
  : <span className="flex flex-col gap-2 mt-4">
      {notices.map((notice, index) => (
        <span key={index} className={`text-small ${noticeClassName(notice.level)}`}>
          {notice.text}
        </span>
      ))}
    </span>;

/** Help / info texts shown with a field, exactly as the applicant saw them. */
const HelpTexts: FC<{ field: FormSnapshotField }> = ({ field }) => {
  const texts = [field.helpText, ...(field.infoTexts ?? [])].filter(
    (text): text is string => !!text && text.length > 0
  );
  return texts.length === 0 ?
      null
    : <span className="flex flex-col gap-2 mt-4">
        {texts.map((text, index) => (
          <span key={index} className="text-small text-dark-secondary italic">
            {text}
          </span>
        ))}
      </span>;
};

/** A single answered field as a question (bold) with the answer below, plus its help and notice texts. */
const SnapshotAnswer: FC<{ field: FormSnapshotField }> = ({ field }) => {
  if (isInformationText(field)) {
    return (
      <div className="flex flex-col">
        {field.label ?
          <span className="font-bold">{field.label}</span>
        : null}
        <HelpTexts field={field} />
        <Notices notices={field.notices} />
      </div>
    );
  }
  return (
    <LabeledValue label={fieldLabel(field)}>
      <span className="block break-words">{answerText(field) || '—'}</span>
      <HelpTexts field={field} />
      <Notices notices={field.notices} />
    </LabeledValue>
  );
};

/** The answered fields of a repeating group's instances, dropping instances with nothing visible. */
const visibleInstances = (field: FormSnapshotField): FormSnapshotField[][] =>
  (field.items ?? []).map((group) => visibleFields(group.fields)).filter((instance) => instance.length > 0);

/** The column headings of a repeating group — the nested fields' labels, in first-seen order. */
const instanceColumns = (instances: FormSnapshotField[][]): { key: string; label: string }[] => {
  const columns = new Map<string, string>();
  instances.flat().forEach((nested) => {
    const key = nested.name ?? nested.label ?? '';
    if (!columns.has(key)) {
      columns.set(key, fieldLabel(nested));
    }
  });
  return [...columns.entries()].map(([key, label]) => ({ key, label }));
};

/** Whether every instance only holds plain answers without notices, and there are few enough columns. */
const fitsAsTable = (instances: FormSnapshotField[][], columnCount: number): boolean =>
  columnCount > 0 &&
  columnCount <= MAX_TABLE_COLUMNS &&
  instances
    .flat()
    .every((nested) => !isRepeatingGroup(nested) && !isInformationText(nested) && (nested.notices ?? []).length === 0);

/** A repeated instance (e.g. one child or one cost) as a white card of question/answer pairs in two columns. */
const RepeatingGroupInstance: FC<{ title?: string; fields: FormSnapshotField[] }> = ({ title, fields }) => (
  <div className="bg-background-content rounded-12 px-16 pt-12 pb-16 flex flex-col gap-16">
    {title ?
      <span className="font-bold">{title}</span>
    : null}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-32 gap-y-16">
      {fields.map((nested, index) =>
        isRepeatingGroup(nested) ?
          <div key={nested.name ?? index} className="md:col-span-2">
            <RepeatingGroupContent field={nested} />
          </div>
        : <SnapshotAnswer key={nested.name ?? index} field={nested} />
      )}
    </div>
  </div>
);

/** A repeating group's instances, as a table when they fit one and as cards otherwise. */
const RepeatingGroupContent: FC<{ field: FormSnapshotField }> = ({ field }) => {
  const instances = visibleInstances(field);
  if (instances.length === 0) {
    return <span className="text-dark-secondary">—</span>;
  }

  const columns = instanceColumns(instances);
  if (fitsAsTable(instances, columns.length)) {
    const rows = instances.map((instance) =>
      columns.map((column) => {
        const cellField = instance.find((nested) => (nested.name ?? nested.label ?? '') === column.key);
        return cellField ? answerText(cellField) || '—' : '—';
      })
    );
    return <ReadOnlyTable ariaLabel={field.label} columns={columns.map((column) => column.label)} rows={rows} />;
  }

  return (
    <div className="flex flex-col gap-16">
      {instances.map((instance, index) => (
        <RepeatingGroupInstance
          key={index}
          title={instances.length > 1 ? `${field.label ?? 'Post'} ${index + 1}` : undefined}
          fields={instance}
        />
      ))}
    </div>
  );
};

/** A repeating group in its own grey box: the question, its help texts, then the answered instances. */
const RepeatingGroupBox: FC<{ field: FormSnapshotField }> = ({ field }) => (
  <ContentBox>
    <div className="flex flex-col gap-16">
      <div className="flex flex-col">
        <span className="font-bold">{fieldLabel(field)}</span>
        <HelpTexts field={field} />
      </div>
      <RepeatingGroupContent field={field} />
      <Notices notices={field.notices} />
    </div>
  </ContentBox>
);

/** A grey box in a section: either one repeating group, or a run of consecutive plain answers. */
type SnapshotBox =
  | { kind: 'repeatingGroup'; field: FormSnapshotField }
  | { kind: 'answers'; fields: FormSnapshotField[] };

/** Consecutive plain answers are grouped into one grey box; each repeating group gets a box of its own. */
const groupFieldsIntoBoxes = (fields: FormSnapshotField[]): SnapshotBox[] =>
  fields.reduce<SnapshotBox[]>((boxes, field) => {
    const lastBox = boxes.at(-1);
    if (isRepeatingGroup(field)) {
      boxes.push({ kind: 'repeatingGroup', field });
    } else if (lastBox?.kind === 'answers') {
      lastBox.fields.push(field);
    } else {
      boxes.push({ kind: 'answers', fields: [field] });
    }
    return boxes;
  }, []);

const SnapshotSection: FC<{ section: FormSnapshotSection; fallbackTitle: string }> = ({ section, fallbackTitle }) => {
  const fields = visibleFields(section.fields);
  if (fields.length === 0) {
    return null;
  }
  const title = section.title ?? fallbackTitle;
  return (
    <SectionAccordion title={title} icon={applicationSectionIcon(title)} initialOpen>
      <div className="flex flex-col gap-40">
        {section.description ?
          <p className="m-0 text-dark-secondary">{section.description}</p>
        : null}
        {groupFieldsIntoBoxes(fields).map((box, index) =>
          box.kind === 'repeatingGroup' ?
            <RepeatingGroupBox key={box.field.name ?? index} field={box.field} />
          : <ContentBox key={box.fields[0]?.name ?? index}>
              <div className="flex flex-col gap-40">
                {box.fields.map((field, fieldIndex) => (
                  <SnapshotAnswer key={field.name ?? fieldIndex} field={field} />
                ))}
              </div>
            </ContentBox>
        )}
      </div>
    </SectionAccordion>
  );
};

const AttestationSection: FC<{ attestation: FormSnapshotAttestation }> = ({ attestation }) => (
  <SectionAccordion title="Försäkran" icon={applicationSectionIcon('Försäkran')} initialOpen>
    <ContentBox>
      <LabeledValue label={attestation.label ?? 'Försäkran'}>
        {attestation.answer?.display ?? attestation.answer?.value ?? '—'}
      </LabeledValue>
    </ContentBox>
  </SectionAccordion>
);

/**
 * Re-renders a captured application FormSnapshot as the read-only "sammanställning" — the form exactly as
 * the applicant saw and answered it (sections → fields → answers, with the original labels, help/notice
 * texts and option labels). Each section is an accordion of grey boxes with question/answer pairs;
 * repeating groups become tables or cards. Only the sections/fields that were visible to the applicant are
 * shown. The heading (title, capture time, "Visa pdf") is rendered by the surrounding tab.
 */
export const FormSnapshotView: FC<{ snapshot: FormSnapshot }> = ({ snapshot }) => {
  const sections = (snapshot.sections ?? []).filter((section) => wasVisible(section.visible));
  return (
    <div className="flex flex-col gap-24">
      {sections.map((section, index) => (
        <SnapshotSection key={section.id ?? index} section={section} fallbackTitle={`Avsnitt ${index + 1}`} />
      ))}
      {snapshot.attestation ?
        <AttestationSection attestation={snapshot.attestation} />
      : null}
    </div>
  );
};
