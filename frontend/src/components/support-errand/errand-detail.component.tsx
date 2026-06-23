'use client';

import { PdfPreviewFrame } from '@components/common/pdf-preview.component';
import { HeaderParty, useErrandHeader } from '@components/layout/errand-header-context';
import { useErrand } from '@hooks/use-errand';
import { useErrandAttachments } from '@hooks/use-errand-attachments';
import { useErrandBevakningar } from '@hooks/use-errand-bevakningar';
import { useErrandForm } from '@hooks/use-errand-form';
import { useErrandNotes } from '@hooks/use-errand-notes';
import { useErrandSectionApprovals } from '@hooks/use-errand-section-approvals';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { useErrandWarnings } from '@hooks/use-errand-warnings';
import { Disclosure, Spinner, Tabs } from '@sk-web-gui/react';
import { CLIENT_FILES_PDF } from '@utils/attachment-names';
import { stakeholderDisplayName } from '@utils/stakeholder-name';
import { compareByRole } from '@utils/stakeholder-role';
import { AlertTriangle, Bell, History, NotebookPen, Paperclip, UserCog } from 'lucide-react';
import { FC, Fragment, ReactNode, useEffect, useMemo, useState } from 'react';

import { ErrandApplicationData } from './errand-application-data.component';
import { ErrandAttachments } from './errand-attachments.component';
import { ErrandAvsluta } from './errand-avsluta.component';
import { ErrandBeslut } from './errand-beslut.component';
import { ErrandBevakningar } from './errand-bevakningar.component';
import { ErrandDocuments } from './errand-documents.component';
import { ErrandEvents } from './errand-events.component';
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

/** One tab inside a group; groups with a single tab render their content without a sub-tab row. */
interface ErrandSubTab {
  label: string;
  content: ReactNode;
}
/** A top-level tab group (Ansökan, Dokumentation, …) holding one or more sub-tabs. */
interface ErrandTabGroup {
  label: string;
  tabs: ErrandSubTab[];
}

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
  // Sökande + medsökande surfaced at the top of the errand (next to the errand number).
  const { stakeholders } = useErrandStakeholders(resolvedErrandId);
  const headerParties = useMemo<HeaderParty[]>(
    () =>
      stakeholders
        .filter((stakeholder) => stakeholder.role === 'APPLICANT' || stakeholder.role === 'CO_APPLICANT')
        .sort(compareByRole)
        .map((stakeholder) => ({
          role: stakeholder.role,
          name: stakeholderDisplayName(stakeholder),
          personalNumber: stakeholder.personalNumber,
        })),
    [stakeholders]
  );

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
  // The generated "ärendeuppgifter" PDF (origin CASE_DATA) is previewed on the Ärendeuppgifter tab, so
  // it's excluded from the Bilagor list below to avoid showing it twice.
  const caseDataAttachment = attachments.find((attachment) => attachment.origin === 'CASE_DATA');
  const errandAttachments = attachments.filter(
    (attachment) => attachment.origin !== 'CONVERSATION' && attachment.origin !== 'CASE_DATA'
  );

  // Surface the errand's status/title into the slim app header, and clear it on leave.
  useEffect(() => {
    if (errand) {
      setHeaderErrand({
        id: errand.id,
        errandNumber: errand.errandNumber,
        title: errand.title,
        status: errand.status,
        parties: headerParties,
      });
    }
    return () => {
      setHeaderErrand(undefined);
    };
  }, [errand?.id, errand?.errandNumber, errand?.title, errand?.status, headerParties, setHeaderErrand]);

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
    {
      key: 'events',
      label: 'Händelselogg',
      icon: History,
      component: <ErrandEvents errandId={errand.id ?? ''} />,
    },
  ];

  // Tabs are grouped into top-level sections; a group with several tabs gets a secondary sub-tab row, a
  // single-tab group renders its content directly. "Ärende" holds the whole application/decision flow;
  // Dokumentation and Händelselogg stay separate (the latter is an audit log).
  const tabGroups: ErrandTabGroup[] = [
    {
      label: 'Ärende',
      tabs: [
        {
          label: 'Ansökan',
          content: (
            <div className="pt-24 pb-40 px-24 md:px-40">
              {/* Tills vidare visas den genererade CASE_DATA-PDF:en i stället för det strukturerade
                  formuläret; ErrandApplicationData renderas bara som fallback när ingen PDF finns. */}
              {caseDataAttachment?.id ?
                <PdfPreviewFrame errandId={apiErrandId} attachmentId={caseDataAttachment.id} title="Ansökan" />
              : <ErrandApplicationData errand={errand} />}
            </div>
          ),
        },
        {
          label: `Bilagor till ansökan (${errandAttachments.length})`,
          content: (
            <div className="pt-24 pb-40 px-24 md:px-40">
              <ErrandAttachments
                errandId={apiErrandId}
                attachments={errandAttachments}
                isLoading={attachmentsLoading}
                loadError={!!attachmentsError}
                refresh={refreshAttachments}
              />
            </div>
          ),
        },
        {
          label: `Meddelanden och bilagor (${conversationAttachments.length})`,
          content: (
            <div className="pt-24 pb-40 px-24 md:px-40 flex flex-col gap-16">
              <ErrandMessages errandId={apiErrandId} />
              {/* Bilagorna som delats i meddelandetråden, hopfällbara under själva meddelandena. */}
              <Disclosure variant="alt" initalOpen={conversationAttachments.length > 0}>
                <Disclosure.Header>
                  <Disclosure.Icon icon={<Paperclip size={18} />} />
                  <Disclosure.Title>Bilagor i meddelanden ({conversationAttachments.length})</Disclosure.Title>
                  <Disclosure.Button />
                </Disclosure.Header>
                <Disclosure.Content>
                  <ErrandMessageAttachments
                    errandId={apiErrandId}
                    attachments={conversationAttachments}
                    summaryAttachment={conversationSummaryAttachment}
                    isLoading={attachmentsLoading}
                    loadError={!!attachmentsError}
                    hideHeading
                  />
                </Disclosure.Content>
              </Disclosure>
            </div>
          ),
        },
        {
          label: 'Normberäkning',
          content: (
            <div className="pt-24 pb-40 px-24 md:px-40 flex flex-col gap-24">
              <LockableSection locked={!!approvals.calculation?.approved}>
                <ErrandNormberakning errandId={apiErrandId} warnings={openWarnings} onWarningsChanged={refreshWarnings} />
              </LockableSection>
              <SectionApprovalCheckbox
                label="Godkänn normberäkning"
                approval={approvals.calculation}
                disabled={pendingSection === 'CALCULATION'}
                onChange={(approved) => void setApproval('CALCULATION', approved)}
              />
            </div>
          ),
        },
        {
          label: 'Beslut',
          content: (
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
          ),
        },
        {
          label: 'Utbetalning',
          content: (
            <div className="pt-24 pb-40 px-24 md:px-40 flex flex-col gap-24">
              <ErrandUtbetalning errandId={apiErrandId} />
              <SectionApprovalCheckbox
                label="Godkänn utbetalning"
                approval={approvals.payment}
                disabled={pendingSection === 'PAYMENT'}
                onChange={(approved) => void setApproval('PAYMENT', approved)}
              />
            </div>
          ),
        },
      ],
    },
    {
      label: 'Dokumentation',
      tabs: [
        {
          label: 'Journal',
          content: (
            <div className="pt-24 pb-40 px-24 md:px-40">
              <ErrandJournal errandId={apiErrandId} />
            </div>
          ),
        },
        {
          label: 'Dokument',
          content: (
            <div className="pt-24 pb-40 px-24 md:px-40">
              <ErrandDocuments errandId={apiErrandId} />
            </div>
          ),
        },
      ],
    },
  ];

  return (
    // The AppShell provides the bg-background-100 page background and full height; the sidebar sits
    // flush against the right edge while the main content is padded.
    <div className="flex w-full h-full overflow-hidden">
      <main className="flex-grow min-w-0 flex justify-center px-24 md:px-40 pt-24 pb-40 overflow-y-auto">
        <div className="w-full max-w-errand flex flex-col gap-16">
          <h1 className="m-0 break-words">{heading}</h1>

          {/* Huvudtabsen (grupperna) ligger direkt på main-bakgrunden; själva innehållskortet (vit
              bakgrund + ram) flyttas in i varje panel, med ev. sub-tabs högst upp i kortet. */}
          <Tabs className="px-2" size="sm" current={activeTab} onTabChange={setActiveTab}>
            {tabGroups.map((group) => (
              <Tabs.Item key={group.label}>
                <Tabs.Button className="text-base">{group.label}</Tabs.Button>
                <Tabs.Content>
                  <div className="border-1 border-divider rounded-12 bg-background-content">
                    {group.tabs.length > 1 ?
                      <Tabs size="sm" tabslistClassName="pt-20 px-12" panelsClassName="border-t-1 border-divider">
                        {group.tabs.map((subTab) => (
                          <Tabs.Item key={subTab.label}>
                            <Tabs.Button className="text-base">{subTab.label}</Tabs.Button>
                            <Tabs.Content>{subTab.content}</Tabs.Content>
                          </Tabs.Item>
                        ))}
                      </Tabs>
                    : group.tabs.map((subTab) => <Fragment key={subTab.label}>{subTab.content}</Fragment>)}
                  </div>
                </Tabs.Content>
              </Tabs.Item>
            ))}
          </Tabs>
        </div>
      </main>

      <ErrandSidebar sections={sections} />
    </div>
  );
};
