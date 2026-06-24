'use client';

import { PdfPreview } from '@components/common/pdf-preview.component';
import { HeaderParty, useErrandHeader } from '@components/layout/errand-header-context';
import { useErrand } from '@hooks/use-errand';
import { useErrandAttachments } from '@hooks/use-errand-attachments';
import { useErrandBevakningar } from '@hooks/use-errand-bevakningar';
import { useErrandCounts } from '@hooks/use-errand-counts';
import { useErrandForm } from '@hooks/use-errand-form';
import { useErrandNotes } from '@hooks/use-errand-notes';
import { useErrandSectionApprovals } from '@hooks/use-errand-section-approvals';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { useErrandWarnings } from '@hooks/use-errand-warnings';
import { Spinner, Tabs } from '@sk-web-gui/react';
import { CLIENT_FILES_PDF } from '@utils/attachment-names';
import { stakeholderDisplayName } from '@utils/stakeholder-name';
import { compareByRole } from '@utils/stakeholder-role';
import { AlertTriangle, Bell, History, NotebookPen, UserCog } from 'lucide-react';
import { FC, Fragment, ReactNode, useEffect, useMemo, useState } from 'react';

import { ErrandApplicationSummary } from './errand-application-summary.component';
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
  const [activeSubTab, setActiveSubTab] = useState<number>(0);
  const [activeSidebar, setActiveSidebar] = useState<string>('info');
  const { setErrand: setHeaderErrand } = useErrandHeader();
  const { form, setField, isDirty, saving, error: saveError, save } = useErrandForm(errand, refresh);
  // The route param can be an errand NUMBER (not a UUID); caremanagement sub-resources require the
  // errand's UUID. Gate those fetches on the resolved errand.id so we never call them with a non-UUID.
  const resolvedErrandId = errand?.id ?? '';

  // Lazy-load gating: a section's data is only fetched when its tab/sidebar is actually open, so opening
  // an errand doesn't log a read of everything. Ärende sub-tab order: 0 Ansökan · 1 Bilagor · 2
  // Normberäkning · 3 Beslut · 4 Utbetalning (the last three carry the approval state).
  const onArendeGroup = activeTab === 0;
  const onNormberakningSubTab = onArendeGroup && activeSubTab === 2;
  const approvalsEnabled = onArendeGroup && activeSubTab >= 2;
  const warningsEnabled = onNormberakningSubTab || activeSidebar === 'warnings';
  const notesEnabled = activeSidebar === 'notes';
  const bevakningarEnabled = activeSidebar === 'bevakningar';

  const { notes, isLoading: notesLoading, error: notesError, refresh: refreshNotes } = useErrandNotes(
    resolvedErrandId,
    notesEnabled
  );
  const {
    warnings,
    isLoading: warningsLoading,
    error: warningsError,
    refresh: refreshWarnings,
  } = useErrandWarnings(resolvedErrandId, warningsEnabled);
  // Attachments back the default Ansökan view (the CASE_DATA PDF) and the tab counters, so they load
  // eagerly with the errand.
  const {
    attachments,
    isLoading: attachmentsLoading,
    error: attachmentsError,
    refresh: refreshAttachments,
  } = useErrandAttachments(resolvedErrandId);

  // Section approvals back the per-section checkboxes; the sidebar Avsluta button fetches them on click.
  const { approvals, pendingSection, setApproval } = useErrandSectionApprovals(resolvedErrandId, approvalsEnabled);
  const {
    bevakningar,
    isLoading: bevakningarLoading,
    error: bevakningarError,
    refresh: refreshBevakningar,
  } = useErrandBevakningar(resolvedErrandId, bevakningarEnabled);
  // Sökande + medsökande surfaced at the top of the errand (next to the errand number).
  const { stakeholders } = useErrandStakeholders(resolvedErrandId);
  // Sidebar badge counts — backed by unlogged count endpoints, so they load with the errand (the lists
  // stay lazy) and are refreshed after a section mutates.
  const { counts, refresh: refreshCounts } = useErrandCounts(resolvedErrandId);
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
  // CONVERSATION files belong to the Meddelanden → Bilagor sub-tab; everything else (application /
  // generated / errand files) to the Ärende → Bilagor tab.
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
          avslutaSlot={<ErrandAvsluta errandId={apiErrandId} onClosed={refresh} />}
        />
      ),
    },
    {
      key: 'warnings',
      label: 'Varningar',
      icon: AlertTriangle,
      badge: counts.warnings,
      component: (
        <ErrandWarnings
          errandId={errand.id ?? ''}
          warnings={warnings}
          isLoading={warningsLoading}
          loadError={!!warningsError}
          refresh={() => {
            refreshWarnings();
            refreshCounts();
          }}
        />
      ),
    },
    {
      key: 'notes',
      label: 'Anteckningar',
      icon: NotebookPen,
      badge: counts.notes,
      component: (
        <ErrandNotes
          errandId={errand.id ?? ''}
          notes={notes}
          isLoading={notesLoading}
          loadError={!!notesError}
          refresh={() => {
            refreshNotes();
            refreshCounts();
          }}
        />
      ),
    },
    {
      key: 'bevakningar',
      label: 'Bevakningar',
      icon: Bell,
      badge: counts.bevakningar,
      component: (
        <ErrandBevakningar
          errandId={errand.id ?? ''}
          bevakningar={bevakningar}
          isLoading={bevakningarLoading}
          loadError={!!bevakningarError}
          refresh={() => {
            refreshBevakningar();
            refreshCounts();
          }}
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
            <div className="pt-24 pb-40 px-24 md:px-40 flex flex-col gap-24">
              {/* Den strukturerade sammanställningen (form-snapshot "som det var", annars live-data) och den
                  genererade CASE_DATA-sammanställnings-PDF:en visas tillsammans. */}
              <ErrandApplicationSummary errandId={apiErrandId} errand={errand} />
              {caseDataAttachment?.id ?
                <PdfPreview errandId={apiErrandId} attachmentId={caseDataAttachment.id} title="Sammanställning (PDF)" />
              : null}
            </div>
          ),
        },
        {
          label: `Bilagor (${errandAttachments.length})`,
          content: (
            <div className="pt-24 pb-40 px-24 md:px-40 flex flex-col gap-24">
              <ErrandAttachments
                errandId={apiErrandId}
                attachments={errandAttachments}
                isLoading={attachmentsLoading}
                loadError={!!attachmentsError}
                refresh={refreshAttachments}
                heading="Bilagor från ansökan"
              />
              {/* The message-attachments summary PDF is mirrored here so it's also reachable under the
                  regular Bilagor tab (the full conversation list stays under Meddelanden → Bilagor). */}
              {conversationSummaryAttachment?.id ?
                <PdfPreview
                  errandId={apiErrandId}
                  attachmentId={conversationSummaryAttachment.id}
                  title="Sammanställning bilagor från meddelanden"
                />
              : null}
            </div>
          ),
        },
        {
          label: 'Normberäkning',
          content: (
            <div className="pt-24 pb-40 px-24 md:px-40 flex flex-col gap-24">
              <ErrandNormberakning
                errandId={apiErrandId}
                warnings={openWarnings}
                onWarningsChanged={refreshWarnings}
                locked={!!approvals.calculation?.approved}
              />
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
              <ErrandBeslut errandId={apiErrandId} locked={!!approvals.decision?.approved} />
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
      label: `Meddelanden (${counts.unreadMessages})`,
      tabs: [
        {
          label: 'Meddelanden',
          content: (
            <div className="pt-24 pb-40 px-24 md:px-40">
              <ErrandMessages errandId={apiErrandId} />
            </div>
          ),
        },
        {
          label: `Bilagor (${conversationAttachments.length})`,
          content: (
            <div className="pt-24 pb-40 px-24 md:px-40">
              <ErrandMessageAttachments
                errandId={apiErrandId}
                attachments={conversationAttachments}
                summaryAttachment={conversationSummaryAttachment}
                isLoading={attachmentsLoading}
                loadError={!!attachmentsError}
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
          <Tabs
            className="px-2"
            size="sm"
            current={activeTab}
            onTabChange={(index) => {
              setActiveTab(index);
              setActiveSubTab(0);
            }}
          >
            {tabGroups.map((group, groupIndex) => (
              <Tabs.Item key={group.label}>
                <Tabs.Button className="text-base">{group.label}</Tabs.Button>
                <Tabs.Content>
                  <div className="border-1 border-divider rounded-12 bg-background-content">
                    {/* Only the active group + sub-tab mounts its content, so inactive tabs never fetch
                        (and thus never log a read) until the handläggare opens them. */}
                    {groupIndex !== activeTab ?
                      null
                    : group.tabs.length > 1 ?
                      <Tabs
                        size="sm"
                        current={activeSubTab}
                        onTabChange={setActiveSubTab}
                        tabslistClassName="pt-20 px-12"
                        panelsClassName="border-t-1 border-divider"
                      >
                        {group.tabs.map((subTab, subIndex) => (
                          <Tabs.Item key={subTab.label}>
                            <Tabs.Button className="text-base">{subTab.label}</Tabs.Button>
                            <Tabs.Content>{subIndex === activeSubTab ? subTab.content : null}</Tabs.Content>
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

      <ErrandSidebar sections={sections} selected={activeSidebar} onSelect={setActiveSidebar} />
    </div>
  );
};
