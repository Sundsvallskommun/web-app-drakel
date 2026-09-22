'use client';

import { AdminTemplate } from '@services/admin-template-service';
import { Button, Table } from '@sk-web-gui/react';
import { Pencil, Trash } from 'lucide-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { TemplateTypeOption } from './template-editor-modal.component';

/** Lists the templates of the chosen category, with a way into the editor and into deletion. */
export const TemplateList: FC<{
  templates: AdminTemplate[];
  /** The type catalogue of the category's target, used to name the type column. */
  types: TemplateTypeOption[];
  onEdit: (template: AdminTemplate) => void;
  onDelete: (template: AdminTemplate) => void;
  /** The identifier currently being opened, so only that row's button shows the wait. */
  openingIdentifier?: string;
}> = ({ templates, types, onEdit, onDelete, openingIdentifier }) => {
  const { t } = useTranslation('admin');

  const typeName = (code: string): string => types.find((type) => type.code === code)?.displayName ?? code;

  return (
    <Table dense background>
      <Table.Header>
        <Table.HeaderColumn>{t('list.name')}</Table.HeaderColumn>
        <Table.HeaderColumn>{t('list.type')}</Table.HeaderColumn>
        <Table.HeaderColumn>{t('list.version')}</Table.HeaderColumn>
        <Table.HeaderColumn>{t('list.actions')}</Table.HeaderColumn>
      </Table.Header>
      <Table.Body>
        {templates.map((template) => (
          <Table.Row key={template.identifier}>
            <Table.Column>{template.name}</Table.Column>
            <Table.Column>{typeName(template.code)}</Table.Column>
            <Table.Column className="tabular-nums">{template.version ?? '—'}</Table.Column>
            <Table.Column>
              <span className="flex gap-8">
                <Button
                  size="sm"
                  variant="tertiary"
                  showBackground
                  leftIcon={<Pencil />}
                  loading={openingIdentifier === template.identifier}
                  onClick={() => {
                    onEdit(template);
                  }}
                >
                  {t('list.edit')}
                </Button>
                <Button
                  size="sm"
                  variant="tertiary"
                  showBackground
                  leftIcon={<Trash />}
                  onClick={() => {
                    onDelete(template);
                  }}
                >
                  {t('list.delete')}
                </Button>
              </span>
            </Table.Column>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};
