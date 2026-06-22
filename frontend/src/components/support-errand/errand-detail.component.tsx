'use client';

import { useErrandHeader } from '@components/layout/errand-header-context';
import { useErrand } from '@hooks/use-errand';
import { useErrandAttachments } from '@hooks/use-errand-attachments';
import { useErrandBevakningar } from '@hooks/use-errand-bevakningar';
import { useErrandForm } from '@hooks/use-errand-form';
import { useErrandNotes } from '@hooks/use-errand-notes';
import { useErrandSectionApprovals } from '@hooks/use-errand-section-approvals';
import { useErrandWarnings } from '@hooks/use-errand-warnings';
import { Spinner, Tabs } from '@sk-web-gui/react';
import { CLIENT_FILES_PDF } from '@utils/attachment-names';
import { AlertTriangle, Bell, NotebookPen, UserCog } from 'lucide-react';
import { FC, useEffect, useState } from 'react';

import { ErrandApplicationData } from './errand-application-data.component';
import { ErrandAttachments } from './errand-attachments.component';
import { ErrandAvsluta } from './errand-avsluta.component';
import { ErrandBeslut } from './errand-beslut.component';
import { ErrandBevakningar } from './errand-bevakningar.component';
import { ErrandInfoPanel } from './errand-info-panel.component';
import { ErrandJournal } from './errand-journal.component';
import { ErrandMessageAttachments } from './errand-message-attachments.component';
import { ErrandMessages } from './errand-messages.component';
import { ErrandNormberakning } from './errand-normberakning.component';
import { ErrandNotes } from './errand-notes.component';
import { ErrandSidebar, SidebarSection } from './errand-sidebar.component';
import { ErrandUtbetalning } from './errand-utbetalning.component';
import { ErrandWarnings } from './errand-warnings.component';
import { LockableSection } from './lockable-section.component';
import { SectionApprovalCheckbox } from './section-approval-checkbox.component';

// Drafts are created with this sentinel title until the handläggare fills the errand in.
const EMPTY_ERRAND_TITLE = 'Empty errand';

export const ErrandDetail: FC<{ errandId: string }> = ({ errandId }) => {
  const { errand, isLoading, error, refresh } = useErrand(errandId);
  const [activeTab, setActiveTab] = useState<number>(0);
  const { setErrand: setHeaderErrand } = useErrandHeader();
  const { form, setField, isDirty, saving, error: saveError, save } = useErrandForm(errand, refresh);
  // The route param can be an errand NUMBER (not a UUID); caremanagement sub-resources (notes,
  // warnings, attachments) require the errand's UUID. Gate those fetches on the resolved errand.id so
  // we never call them with a non-UUID identifier (which caremanagement rejects with a 400).
  const resolvedErrandId = errand?.id ?? '';
  const { notes, isLoading: notesLoading, error: notesError, refresh: refreshNotes } =
    useErrandNotes(resolvedErrandId);
  const {
    warnings,
    isLoading: warningsLoading,
    error: warningsError,
    refresh: refreshWarnings,
  } = useErrandWarnings(resolvedErrandId);
  // Fetched once here so the tab counters and both attachment tabs share a single source.
  const {
    attachments,
    isLoading: attachmentsLoading,
    error: attachmentsError,
    refresh: refreshAttachments,
  } = useErrandAttachments(resolvedErrandId);

  // Section approvals are shared between the per-section checkboxes and the sidebar "Avsluta" button.
  const { approvals, pendingSection, setApproval } = useErrandSectionApprovals(resolvedErrandId);
  const {
    bevakningar,
    isLoading: bevakningarLoading,
    error: bevakningarError,
    refresh: refreshBevakningar,
  } = useErrandBevakningar(resolvedErrandId);

  // Only OPEN warnings are actionable — acknowledged/closed ones disappear from the sidebar.
  const openWarnings = warnings.filter((warning) => warning.status === 'OPEN');

  // The consolidated client conversation files PDF (origin CONVERSATION) — previewed atop the
  // message-attachments tab, so it's excluded from that tab's file list below to avoid showing twice.
  const conversationSummaryAttachment = attachments.find(
    (attachment) => (attachment.fileName ?? '').toLowerCase() === CLIENT_FILES_PDF
  );
  // CONVERSATION files belong to the "Bilagor från meddelanden" tab; everything else (application /
  // generated / errand files) to the "Bilagor" tab.
  const conversationAttachments = attachments.filter(
    (attachment) => attachment.origin === 'CONVERSATION' && attachment.id !== conversationSummaryAttachment?.id
  );
  const errandAttachments = attachments.filter((attachment) => attachment.origin !== 'CONVERSATION');

  // Surface the errand's status/title into the slim app header, and clear it on leave.
  useEffect(() => {
    if (errand) {
      setHeaderErrand({ id: errand.id, errandNumber: errand.errandNumber, title: errand.title, status: errand.status });
    }
    return () => {
      setHeaderErrand(undefined);
    };
  }, [errand?.id, errand?.errandNumber, errand?.title, errand?.status, setHeaderErrand]);

  if (isLoading) {
    return (
      <div className="flex justify-center my-32">
        <Spinner size={5} />
      </div>
    );
  }

  if (error || !errand) {
    return <p className="my-32">Det gick inte att hämta ärendet ({String(error ?? 'okänt fel')})</p>;
  }

  const heading = errand.title && errand.title !== EMPTY_ERRAND_TITLE ? errand.title : 'Registrera nytt ärende';
  const apiErrandId = errand.id ?? errandId;

  const sections: SidebarSection[] = [
    {
      key: 'info',
      label: 'Handläggning',
      icon: UserCog,
      component: (
        <ErrandInfoPanel
          errand={errand}
          form={form}
          setField={setField}
          isDirty={isDirty}
          saving={saving}
          error={saveError}
          onSave={() => void save()}
          avslutaSlot={<ErrandAvsluta errandId={apiErrandId} approvals={approvals} onClosed={refresh} />}
        />
      ),
    },
    {
      key: 'warnings',
      label: 'Varningar',
      icon: AlertTriangle,
      badge: openWarnings.length,
      component: (
        <ErrandWarnings
          errandId={errand.id ?? ''}
          warnings={warnings}
          isLoading={warningsLoading}
          loadError={!!warningsError}
          refresh={refreshWarnings}
        />
      ),
    },
    {
      key: 'notes',
      label: 'Anteckningar',
      icon: NotebookPen,
      badge: notes.length,
      component: (
        <ErrandNotes
          errandId={errand.id ?? ''}
          notes={notes}
          isLoading={notesLoading}
          loadError={!!notesError}
          refresh={refreshNotes}
        />
      ),
    },
    {
      key: 'bevakningar',
      label: 'Bevakningar',
      icon: Bell,
      badge: bevakningar.length,
      component: (
        <ErrandBevakningar
          errandId={errand.id ?? ''}
          bevakningar={bevakningar}
          isLoading={bevakningarLoading}
          loadError={!!bevakningarError}
          refresh={refreshBevakningar}
        />
      ),
    },
  ];

  return (
    // The AppShell provides the bg-background-100 page background and full height; the sidebar sits
    // flush against the right edge while the main content is padded.
    <div className="flex w-full h-full overflow-hidden">
      <main className="flex-grow min-w-0 flex justify-center px-24 md:px-40 pt-24 pb-40 overflow-y-auto">
        <div className="w-full max-w-errand flex flex-col gap-16">
          <h1 className="m-0 break-words">{heading}</h1>

          <Tabs
            className="border-1 border-divider rounded-12 bg-background-content pt-22 pl-5"
            panelsClassName="border-t-1 border-divider"
            size="sm"
            current={activeTab}
            onTabChange={setActiveTab}
          >
            <Tabs.Item>
              <Tabs.Button className="text-base ml-10">Ärendeuppgifter</Tabs.Button>
              <Tabs.Content>
                <ErrandApplicationData errand={errand} />
              </Tabs.Content>
            </Tabs.Item>
            <Tabs.Item>
              <Tabs.Button className="text-base">Normberäkning</Tabs.Button>
              <Tabs.Content>
                <div className="pt-24 pb-40 px-24 md:px-40 flex flex-col gap-24">
                  <LockableSection locked={!!approvals.calculation?.approved}>
                    <ErrandNormberakning
                      errandId={apiErrandId}
                      warnings={openWarnings}
                      onWarningsChanged={refreshWarnings}
                    />
                  </LockableSection>
                  <SectionApprovalCheckbox
                    label="Godkänn normberäkning"
                    approval={approvals.calculation}
                    disabled={pendingSection === 'CALCULATION'}
                    onChange={(approved) => void setApproval('CALCULATION', approved)}
                  />
                </div>
              </Tabs.Content>
            </Tabs.Item>
            <Tabs.Item>
              <Tabs.Button className="text-base">Beslut</Tabs.Button>
              <Tabs.Content>
                <div className="pt-24 pb-40 px-24 md:px-40 flex flex-col gap-24">
                  <LockableSection locked={!!approvals.decision?.approved}>
                    <ErrandBeslut errandId={apiErrandId} />
                  </LockableSection>
                  <SectionApprovalCheckbox
                    label="Godkänn beslut"
                    approval={approvals.decision}
                    disabled={pendingSection === 'DECISION'}
                    onChange={(approved) => void setApproval('DECISION', approved)}
                  />
                </div>
              </Tabs.Content>
            </Tabs.Item>
            <Tabs.Item>
              <Tabs.Button className="text-base">Utbetalning</Tabs.Button>
              <Tabs.Content>
                <div className="pt-24 pb-40 px-24 md:px-40 flex flex-col gap-24">
                  <ErrandUtbetalning errandId={apiErrandId} />
                  <SectionApprovalCheckbox
                    label="Godkänn utbetalning"
                    approval={approvals.payment}
                    disabled={pendingSection === 'PAYMENT'}
                    onChange={(approved) => void setApproval('PAYMENT', approved)}
                  />
                </div>
              </Tabs.Content>
            </Tabs.Item>
            <Tabs.Item>
              <Tabs.Button className="text-base">Bilagor ({errandAttachments.length})</Tabs.Button>
              <Tabs.Content>
                <div className="pt-24 pb-40 px-24 md:px-40">
                  <ErrandAttachments
                    errandId={apiErrandId}
                    attachments={errandAttachments}
                    isLoading={attachmentsLoading}
                    loadError={!!attachmentsError}
                    refresh={refreshAttachments}
                  />
                </div>
              </Tabs.Content>
            </Tabs.Item>
            <Tabs.Item>
              <Tabs.Button className="text-base">Meddelanden</Tabs.Button>
              <Tabs.Content>
                <div className="pt-24 pb-40 px-24 md:px-40">
                  <ErrandMessages errandId={apiErrandId} />
                </div>
              </Tabs.Content>
            </Tabs.Item>
            <Tabs.Item>
              <Tabs.Button className="text-base">Journal</Tabs.Button>
              <Tabs.Content>
                <div className="pt-24 pb-40 px-24 md:px-40">
                  <ErrandJournal errandId={apiErrandId} />
                </div>
              </Tabs.Content>
            </Tabs.Item>
            <Tabs.Item>
              <Tabs.Button className="text-base">Bilagor från meddelanden ({conversationAttachments.length})</Tabs.Button>
              <Tabs.Content>
                <div className="pt-24 pb-40 px-24 md:px-40">
                  <ErrandMessageAttachments
                    errandId={apiErrandId}
                    attachments={conversationAttachments}
                    summaryAttachment={conversationSummaryAttachment}
                    isLoading={attachmentsLoading}
                    loadError={!!attachmentsError}
                  />
                </div>
              </Tabs.Content>
            </Tabs.Item>
          </Tabs>
        </div>
      </main>

      <ErrandSidebar sections={sections} />
    </div>
  );
};
