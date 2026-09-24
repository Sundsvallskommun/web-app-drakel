'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { useAdminTemplates } from '@hooks/use-admin-templates';
import {
  addDefaultDecisionPhrases,
  AdminTemplate,
  AdminTemplateDetail,
  deleteAdminTemplate,
  getAdminTemplate,
} from '@services/admin-template-service';
import { Button, Modal, Tabs } from '@sk-web-gui/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { belongsToCategory, DECISION_PHRASE_CODE, TEMPLATE_CATEGORIES } from './template-categories';
import { TemplateEditorModal, TemplateTypeOption } from './template-editor-modal.component';
import { TemplateList } from './template-list.component';

/**
 * "Mallar och frastexter" — the texts handläggare pick from when writing a journalanteckning or a
 * dokument, and the beslutsformuleringar of the Beslut tab. One tab per category (mall or frastext, for
 * journalanteckning or for dokument, and beslutsformulering); each lists its templates and opens the
 * rich-text editor for a new or existing one. The beslutsformuleringar the Beslut tab used to carry in code
 * are put into Templating from here, once.
 *
 * A mall is shared by everyone in the municipality, so changing one is not part of ordinary handläggning.
 * The permission gate lives in AdminSection, which checks the page's own permission.
 */
export const TemplatePageClient = () => {
  const { t } = useTranslation('admin');
  const { templates, journalTypes, documentTypes, isLoading, error, refresh } = useAdminTemplates();

  const [activeTab, setActiveTab] = useState<number>(0);
  const [editing, setEditing] = useState<AdminTemplateDetail>();
  const [creating, setCreating] = useState<boolean>(false);
  const [openingIdentifier, setOpeningIdentifier] = useState<string>();
  const [deleteTarget, setDeleteTarget] = useState<AdminTemplate>();
  const [deleting, setDeleting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>();
  const [addingDefaults, setAddingDefaults] = useState<boolean>(false);

  const selectedCategory = TEMPLATE_CATEGORIES[activeTab] ?? TEMPLATE_CATEGORIES[0];
  const isDecisionTab = selectedCategory.target === 'decision';
  const typesByTarget: Record<typeof selectedCategory.target, TemplateTypeOption[]> = {
    journal: journalTypes,
    document: documentTypes,
    decision: [{ code: DECISION_PHRASE_CODE, displayName: t('editor.type.decision') }],
  };
  const typesForTarget = typesByTarget[selectedCategory.target];
  const codesForTarget = typesForTarget.map((type) => type.code ?? '');
  const visibleTemplates = templates
    .filter((template) => belongsToCategory(template, selectedCategory, codesForTarget))
    // Beslutsformuleringar are read by kategori, as the Beslut tab offers them.
    .sort((first, second) =>
      isDecisionTab ?
        (first.category ?? '').localeCompare(second.category ?? '', 'sv') || first.name.localeCompare(second.name, 'sv')
      : 0
    );
  const decisionCategories = [
    ...new Set(templates.map((template) => template.category).filter((name): name is string => !!name)),
  ];

  const addDefaults = async (): Promise<void> => {
    setAddingDefaults(true);
    setActionError(undefined);
    const res = await addDefaultDecisionPhrases();
    setAddingDefaults(false);
    if (res.error) {
      setActionError(t('defaults.error'));
      return;
    }
    refresh();
  };

  const openForEdit = async (template: AdminTemplate): Promise<void> => {
    setOpeningIdentifier(template.identifier);
    setActionError(undefined);
    const res = await getAdminTemplate(template.identifier);
    setOpeningIdentifier(undefined);
    if (res.error || !res.data) {
      setActionError(t('list.openError'));
      return;
    }
    setEditing(res.data);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    setActionError(undefined);
    const res = await deleteAdminTemplate(deleteTarget.identifier);
    setDeleting(false);
    setDeleteTarget(undefined);
    if (res.error) {
      setActionError(t('delete.error'));
      return;
    }
    refresh();
  };

  const categoryPanel = (
    <div className="flex flex-col gap-16 pt-16">
      <div className="flex flex-wrap items-center justify-end gap-12">
        {isDecisionTab ?
          <Button variant="secondary" loading={addingDefaults} onClick={() => void addDefaults()}>
            {t('defaults.add')}
          </Button>
        : null}
        <Button
          color="vattjom"
          variant="primary"
          leftIcon={<Plus />}
          onClick={() => {
            setCreating(true);
          }}
        >
          {t(
            `create.${
              isDecisionTab ? 'decisionPhrase'
              : selectedCategory.kind === 'DOCUMENT' ? 'template'
              : 'phrase'
            }`
          )}
        </Button>
      </div>

      <AsyncContent
        isLoading={isLoading}
        error={error}
        errorText={t('loadError')}
        isEmpty={visibleTemplates.length === 0}
        emptyText={t('empty')}
        centered
      >
        <TemplateList
          templates={visibleTemplates}
          types={typesForTarget}
          openingIdentifier={openingIdentifier}
          byCategory={isDecisionTab}
          onEdit={(template) => void openForEdit(template)}
          onDelete={setDeleteTarget}
        />
      </AsyncContent>

      {actionError ?
        <p className="m-0 text-error-surface-primary" role="alert">
          {actionError}
        </p>
      : null}
    </div>
  );

  return (
    <div className="flex flex-col gap-24">
      <p className="m-0 text-dark-secondary">{t('intro')}</p>

      <div className="rounded-16 bg-background-content p-24">
        <Tabs current={activeTab} onTabChange={setActiveTab}>
          {TEMPLATE_CATEGORIES.map((category, index) => (
            <Tabs.Item key={category.id}>
              <Tabs.Button>{t(`categories.${category.id}`)}</Tabs.Button>
              {/* Only the open tab renders its panel — the others hold the same list for another category
                  and would each mount their own copy of it. */}
              <Tabs.Content>{index === activeTab ? categoryPanel : null}</Tabs.Content>
            </Tabs.Item>
          ))}
        </Tabs>
      </div>

      {creating || editing ?
        <TemplateEditorModal
          category={selectedCategory}
          types={typesForTarget}
          template={editing}
          decisionCategories={decisionCategories}
          onClose={() => {
            setCreating(false);
            setEditing(undefined);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(undefined);
            refresh();
          }}
        />
      : null}

      <Modal
        show={!!deleteTarget}
        onClose={() => {
          setDeleteTarget(undefined);
        }}
        label={t('delete.title')}
      >
        <Modal.Content>
          <p className="m-0">{t('delete.confirm', { name: deleteTarget?.name ?? '' })}</p>
        </Modal.Content>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteTarget(undefined);
            }}
          >
            {t('common:cancel')}
          </Button>
          <Button color="error" variant="primary" loading={deleting} onClick={() => void confirmDelete()}>
            {t('delete.confirmButton')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
