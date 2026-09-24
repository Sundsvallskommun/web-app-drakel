'use client';

import TextEditor from '@components/common/text-editor.component';
import { AdminTemplateDetail, saveAdminTemplate } from '@services/admin-template-service';
import { Button, FormControl, FormLabel, Input, Modal, Select } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DECISION_PHRASE_CODE, TemplateCategory } from './template-categories';

/** A selectable CM type, as both type catalogues expose it. */
export interface TemplateTypeOption {
  code?: string;
  displayName?: string;
}

const EMPTY_CONTENT: TextEditorValue = { markup: '', plainText: '' };

/**
 * Create/edit form for a mall, frastext or beslutsformulering. The category is fixed by the tab the
 * handläggare came in through, so only the name, the type it belongs to and the text itself are editable. A
 * beslutsformulering has a kategori instead of a type — an existing one or a new one — and its name is the
 * rubrik the Beslut tab shows.
 *
 * Saving an existing template stores a new version of it rather than replacing it, so an edit that turns
 * out wrong can still be traced in the Templating service.
 */
export const TemplateEditorModal: FC<{
  category: TemplateCategory;
  types: TemplateTypeOption[];
  /** The template being edited, or undefined when creating a new one. */
  template?: AdminTemplateDetail;
  /** The kategorier the beslutsformuleringar already have, offered when writing one. */
  decisionCategories?: string[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ category, types, template, decisionCategories = [], onClose, onSaved }) => {
  const { t } = useTranslation('admin');
  const isDecisionPhrase = category.kind === 'DECISION_PHRASE';
  const [name, setName] = useState<string>(template?.name ?? '');
  const [code, setCode] = useState<string>(template?.code ?? (isDecisionPhrase ? DECISION_PHRASE_CODE : ''));
  const [phraseCategory, setPhraseCategory] = useState<string>(template?.category ?? '');
  const [content, setContent] = useState<TextEditorValue>(
    template?.content ? { markup: template.content, plainText: '' } : EMPTY_CONTENT
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const canSave = name.trim() !== '' && code !== '' && (!isDecisionPhrase || phraseCategory.trim() !== '') && !saving;

  const save = async (): Promise<void> => {
    if (!canSave) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const res = await saveAdminTemplate({
      identifier: template?.identifier,
      name: name.trim(),
      code,
      kind: category.kind,
      category: isDecisionPhrase ? phraseCategory.trim() : undefined,
      content: content.markup ?? '',
    });
    setSaving(false);
    if (res.error) {
      setError(t('editor.saveError'));
      return;
    }
    onSaved();
  };

  return (
    <Modal
      show
      onClose={onClose}
      label={template ? t('editor.editTitle') : t('editor.createTitle')}
      className="w-[88rem] max-w-[90vw]"
    >
      <Modal.Content className="flex flex-col gap-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <FormControl id="template-name" className="w-full">
            <FormLabel>{isDecisionPhrase ? t('editor.heading') : t('editor.name')}</FormLabel>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
            />
          </FormControl>

          {isDecisionPhrase ?
            <FormControl id="template-category" className="w-full">
              <FormLabel>{t('editor.category')}</FormLabel>
              <Input
                list="decision-phrase-categories"
                value={phraseCategory}
                placeholder={t('editor.categoryPlaceholder')}
                onChange={(event) => {
                  setPhraseCategory(event.target.value);
                }}
              />
              <datalist id="decision-phrase-categories">
                {decisionCategories.map((existing) => (
                  <option key={existing} value={existing} />
                ))}
              </datalist>
            </FormControl>
          : <FormControl id="template-code" className="w-full">
              <FormLabel>{t(`editor.type.${category.target}`)}</FormLabel>
              <Select
                className="w-full"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                }}
              >
                <Select.Option value="">{t('editor.selectType')}</Select.Option>
                {types.map((type) => (
                  <Select.Option key={type.code} value={type.code ?? ''}>
                    {type.displayName ?? type.code}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
          }
        </div>

        <FormControl id="template-content" className="w-full">
          <FormLabel>{t('editor.content')}</FormLabel>
          {isDecisionPhrase ?
            <p className="m-0 mb-8 text-small text-dark-secondary">{t('editor.decisionPlaceholders')}</p>
          : null}
          <TextEditor
            className="text-editor-with-toolbar w-full"
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
            }}
          />
        </FormControl>

        {error ?
          <p className="m-0 text-error-surface-primary" role="alert">
            {error}
          </p>
        : null}
      </Modal.Content>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          {t('common:cancel')}
        </Button>
        <Button color="vattjom" variant="primary" loading={saving} disabled={!canSave} onClick={() => void save()}>
          {t('editor.save')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
