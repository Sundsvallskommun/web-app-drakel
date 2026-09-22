'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { useAdminTemplates } from '@hooks/use-admin-templates';
import {
  AdminTemplate,
  AdminTemplateDetail,
  deleteAdminTemplate,
  getAdminTemplate,
} from '@services/admin-template-service';
import { useUserStore } from '@services/user-service/user-service';
import { Button, Modal, Tabs } from '@sk-web-gui/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { belongsToCategory, TEMPLATE_CATEGORIES } from './template-categories';
import { TemplateEditorModal, TemplateTypeOption } from './template-editor-modal.component';
import { TemplateList } from './template-list.component';

/**
 * "Mallar och frastexter" — the superadmin page for the texts handläggare pick from when writing a
 * journalanteckning or a dokument. One button per category (mall or frastext, for journalanteckning or
 * for dokument); picking one lists its templates and opens the rich-text editor for a new or existing one.
 *
 * The page is gated on `canManageTemplates`: a mall is shared by everyone in the municipality, so changing
 * one is not part of ordinary handläggning. The backend enforces the same permission — this only keeps the
 * page from rendering controls that would be refused.
 */
export const AdminPageClient = () => {
  const { t } = useTranslation('admin');
  const user = useUserStore(useShallow((state) => state.user));
  const { templates, journalTypes, documentTypes, isLoading, error, refresh } = useAdminTemplates();

  const [activeTab, setActiveTab] = useState<number>(0);
  const [editing, setEditing] = useState<AdminTemplateDetail>();
  const [creating, setCreating] = useState<boolean>(false);
  const [openingIdentifier, setOpeningIdentifier] = useState<string>();
  const [deleteTarget, setDeleteTarget] = useState<AdminTemplate>();
  const [deleting, setDeleting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>();

  const selectedCategory = TEMPLATE_CATEGORIES[activeTab] ?? TEMPLATE_CATEGORIES[0];
  const typesForTarget: TemplateTypeOption[] = selectedCategory.target === 'journal' ? journalTypes : documentTypes;
  const codesForTarget = typesForTarget.map((type) => type.code ?? '');
  const visibleTemplates = templates.filter((template) =>
    belongsToCategory(template, selectedCategory, codesForTarget)
  );

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

  if (!user.permissions.canManageTemplates) {
    return (
      <main className="mx-auto w-full max-w-[120rem] p-24">
        <h1 className="text-h2-md">{t('title')}</h1>
        <p className="text-dark-secondary">{t('noAccess')}</p>
      </main>
    );
  }

  const categoryPanel = (
    <div className="flex flex-col gap-16 pt-16">
      <div className="flex flex-wrap items-center justify-end gap-12">
        <Button
          color="vattjom"
          variant="primary"
          leftIcon={<Plus />}
          onClick={() => {
            setCreating(true);
          }}
        >
          {t(`create.${selectedCategory.kind === 'DOCUMENT' ? 'template' : 'phrase'}`)}
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
    <main className="mx-auto flex w-full max-w-[120rem] flex-col gap-24 overflow-y-auto p-24">
      <div className="flex flex-col gap-8">
        <h1 className="m-0 text-h2-md">{t('title')}</h1>
        <p className="m-0 text-dark-secondary">{t('intro')}</p>
      </div>

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
    </main>
  );
};
