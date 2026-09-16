'use client';

import { AttachmentPdfButton } from '@components/common/attachment-pdf-button.component';
import { PdfPreview } from '@components/common/pdf-preview.component';
import { useErrand } from '@hooks/use-errand';
import { useErrandAttachments } from '@hooks/use-errand-attachments';
import { useErrandBevakningar } from '@hooks/use-errand-bevakningar';
import { useErrandCounts } from '@hooks/use-errand-counts';
import { useErrandForm } from '@hooks/use-errand-form';
import { useErrandNotes } from '@hooks/use-errand-notes';
import { useErrandSectionApprovals } from '@hooks/use-errand-section-approvals';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { useErrandWarnings } from '@hooks/use-errand-warnings';
import { Badge, Spinner, Tabs } from '@sk-web-gui/react';
import { CLIENT_FILES_PDF } from '@utils/attachment-names';
import { stakeholderDisplayName } from '@utils/stakeholder-name';
import { compareByRole } from '@utils/stakeholder-role';
import { Check } from 'lucide-react';
import { FC, Fragment, ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { ErrandAdministrationBar } from './errand-administration-bar.component';
import { ErrandAktualisering } from './errand-aktualisering.component';
import { ErrandApplicationSummary } from './errand-application-summary.component';
import { ErrandAttachments } from './errand-attachments.component';
import { ErrandAvsluta } from './errand-avsluta.component';
import { ErrandBeslut } from './errand-beslut.component';
import { ErrandBevakningar } from './errand-bevakningar.component';
import { ErrandDocuments } from './errand-documents.component';
import { ErrandEvents } from './errand-events.component';
import { ErrandJournal } from './errand-journal.component';
import { ErrandMessageAttachments } from './errand-message-attachments.component';
import { ErrandMessages } from './errand-messages.component';
import { ErrandMetaCard } from './errand-meta-card.component';
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
  /** Count shown as a badge after the label (e.g. number of attachments). */
  counter?: number;
  /** Shows a green check next to the sub-tab label once the section is approved. */
  approved?: boolean;
}
/** A top-level tab group (Ärende, Meddelanden, Dokumentation) holding one or more sub-tabs. */
interface ErrandTabGroup {
  label: string;
  counter?: number;
  tabs: ErrandSubTab[];
}

/** A tab label followed by its optional count badge and "godkänd" check. */
const TabLabel: FC<{ label: string; counter?: number; approved?: boolean }> = ({ label, counter, approved }) => (
  <span className="inline-flex items-center gap-8">
    {approved ?
      <Check size={18} className="text-gronsta-surface-primary" aria-label="Godkänd" />
    : null}
    {label}
    {counter !== undefined ?
      <Badge color="tertiary" inverted size="sm" counter={counter > 99 ? '99+' : counter} />
    : null}
  </span>
);

/** Padding for the content of a sub-tab inside the errand's content card. */
const ErrandTabPanel: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="px-24 md:px-48 pt-40 pb-64 flex flex-col gap-24">{children}</div>
);

export const ErrandDetail: FC<{ errandId: string }> = ({ errandId }) => {
  const { errand, isLoading, error, refresh } = useErrand(errandId);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<number>(0);
  // Keys of the expanded right-column sections; a section's data only loads once it's expanded.
  const [openSidebarSections, setOpenSidebarSections] = useState<string[]>([]);
  const toggleSidebarSection = useCallback((key: string) => {
    setOpenSidebarSections((current) =>
      current.includes(key) ? current.filter((openKey) => openKey !== key) : [...current, key]
    );
  }, []);
  const { form, setField, isDirty, saving, error: saveError, save } = useErrandForm(errand, refresh);

  // The central "Spara" button also saves the Beslut tab: ErrandBeslut registers its save here
  // (only while that tab is mounted), and the button runs both. canSaveBeslut keeps the button enabled
  // while a beslut can be saved even when the handläggning fields aren't dirty.
  const beslutSaveRef = useRef<(() => Promise<boolean>) | null>(null);
  const [canSaveBeslut, setCanSaveBeslut] = useState<boolean>(false);
  const [savingAll, setSavingAll] = useState<boolean>(false);
  const registerBeslutSave = useCallback((beslutSave: (() => Promise<boolean>) | null) => {
    beslutSaveRef.current = beslutSave;
    setCanSaveBeslut(beslutSave !== null);
  }, []);
  const saveAll = useCallback(async () => {
    setSavingAll(true);
    await save();
    if (beslutSaveRef.current) {
      await beslutSaveRef.current();
    }
    setSavingAll(false);
  }, [save]);
  // The route param can be an errand NUMBER (not a UUID); caremanagement sub-resources require the
  // errand's UUID. Gate those fetches on the resolved errand.id so we never call them with a non-UUID.
  const resolvedErrandId = errand?.id ?? '';

  // The tab layout depends on the application type. A new application has no calculation/decision/payment
  // flow; both new and supplementary applications omit the Dokumentation group. Renewal — and any unknown
  // or generic type — gets the full set.
  const typeSlug = errand?.typeSlug ?? '';
  const isNewApplication = typeSlug === 'financial-assistance-new';
  const isSupplementaryApplication = typeSlug === 'financial-assistance-supplementary';
  const isRenewalApplication = typeSlug === 'financial-assistance-renewal';
  const showCalculationSections = !isNewApplication && !isSupplementaryApplication;
  const showDocumentation = !isNewApplication;

  // Lazy-load gating: a section's data is only fetched when its tab/sidebar is actually open, so opening
  // an errand doesn't log a read of everything. When shown, the Ärende sub-tab order is 0 Ansökan · 1
  // Bilagor · 2 Normberäkning · 3 Beslut · 4 Utbetalning (the last three carry the approval state).
  const onArendeGroup = activeTab === 0;
  const onNormberakningSubTab = showCalculationSections && onArendeGroup && activeSubTab === 2;
  // Approvals load eagerly (not gated on the active sub-tab) so the per-section "godkänd" checks show on
  // the Normberäkning/Beslut/Utbetalning tabs the moment the errand opens.
  const approvalsEnabled = showCalculationSections;
  const warningsEnabled = onNormberakningSubTab || openSidebarSections.includes('warnings');
  const notesEnabled = openSidebarSections.includes('notes');
  const bevakningarEnabled = openSidebarSections.includes('bevakningar');

  const {
    notes,
    isLoading: notesLoading,
    error: notesError,
    refresh: refreshNotes,
  } = useErrandNotes(resolvedErrandId, notesEnabled);
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

  // Section approvals back the per-section checkboxes, the tab "godkänd" checks and the "Besluta och
  // utbetala" action — so they load eagerly with the errand (see approvalsEnabled above).
  const { approvals, pendingSection, setApproval } = useErrandSectionApprovals(resolvedErrandId, approvalsEnabled);
  const {
    bevakningar,
    isLoading: bevakningarLoading,
    error: bevakningarError,
    refresh: refreshBevakningar,
  } = useErrandBevakningar(resolvedErrandId, bevakningarEnabled);
  // Sökande + medsökande surfaced in the meta card under the errand title.
  const { stakeholders } = useErrandStakeholders(resolvedErrandId);
  // Right-column badge counts — backed by unlogged count endpoints, so they load with the errand (the lists
  // stay lazy) and are refreshed after a section mutates.
  const { counts, refresh: refreshCounts } = useErrandCounts(resolvedErrandId);
  const applicantNames = useMemo<string[]>(
    () =>
      stakeholders
        .filter((stakeholder) => stakeholder.role === 'APPLICANT' || stakeholder.role === 'CO_APPLICANT')
        .sort(compareByRole)
        .map((stakeholder) => stakeholderDisplayName(stakeholder)),
    [stakeholders]
  );

  // Only OPEN warnings are actionable — acknowledged/closed ones disappear from the right column.
  const openWarnings = warnings.filter((warning) => warning.status === 'OPEN');

  // The consolidated client conversation files PDF (documentType CONVERSATION) — previewed atop the
  // message-attachments tab, so it's excluded from that tab's file list below to avoid showing twice.
  const conversationSummaryAttachment = attachments.find(
    (attachment) => (attachment.fileName ?? '').toLowerCase() === CLIENT_FILES_PDF
  );
  // CONVERSATION files belong to the Meddelanden → Bilagor sub-tab; everything else (application /
  // generated / errand files) to the Ärende → Bilagor tab.
  const conversationAttachments = attachments.filter(
    (attachment) => attachment.documentType === 'CONVERSATION' && attachment.id !== conversationSummaryAttachment?.id
  );
  // The generated "ärendeuppgifter" PDF (documentType CASE_DATA) is previewed on the Ärendeuppgifter tab,
  // so it's excluded from the Bilagor list below to avoid showing it twice.
  const caseDataAttachment = attachments.find((attachment) => attachment.documentType === 'CASE_DATA');
  // The generated beslut PDF (documentType DECISION) is sent/saved by "Besluta och utbetala" but not listed here.
  const errandAttachments = attachments.filter(
    (attachment) =>
      attachment.documentType !== 'CONVERSATION' &&
      attachment.documentType !== 'CASE_DATA' &&
      attachment.documentType !== 'DECISION'
  );

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
      key: 'warnings',
      label: 'Varningar',
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
            <ErrandTabPanel>
              {/* Den strukturerade sammanställningen (form-snapshot "som det var", annars live-data). Den
                  genererade CASE_DATA-sammanställnings-PDF:en nås via "Visa pdf"-knappen till höger om titeln. */}
              <ErrandApplicationSummary
                errandId={apiErrandId}
                errand={errand}
                action={
                  caseDataAttachment?.id ?
                    // Wrap so the button is one flex item — its fragment (Button + Modal) would otherwise
                    // be two children and justify-between would push the button to the middle.
                    <div>
                      <AttachmentPdfButton
                        errandId={apiErrandId}
                        attachmentId={caseDataAttachment.id}
                        label="Visa pdf"
                        modalLabel="Sammanställning (PDF)"
                      />
                    </div>
                  : null
                }
              />
            </ErrandTabPanel>
          ),
        },
        {
          label: 'Bilagor',
          counter: errandAttachments.length,
          content: (
            <ErrandTabPanel>
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
            </ErrandTabPanel>
          ),
        },
        // Calculation / decision / payment only apply to a renewal (and any unknown/generic type).
        ...(showCalculationSections ?
          [
            {
              label: 'Normberäkning',
              approved: !!approvals.calculation?.approved,
              content: (
                <ErrandTabPanel>
                  <ErrandNormberakning
                    errandId={apiErrandId}
                    warnings={openWarnings}
                    onWarningsChanged={refreshWarnings}
                    locked={!!approvals.calculation?.approved}
                    handlaggare={errand.assignedUserId}
                    headerSlot={
                      <SectionApprovalCheckbox
                        label="Markera normberäkning som komplett"
                        approval={approvals.calculation}
                        disabled={pendingSection === 'CALCULATION'}
                        onChange={(approved) => void setApproval('CALCULATION', approved)}
                      />
                    }
                  />
                </ErrandTabPanel>
              ),
            },
            {
              label: 'Beslut',
              approved: !!approvals.decision?.approved,
              content: (
                <ErrandTabPanel>
                  <ErrandBeslut
                    errandId={apiErrandId}
                    locked={!!approvals.decision?.approved}
                    headerSlot={
                      <SectionApprovalCheckbox
                        label="Markera beslut som komplett"
                        approval={approvals.decision}
                        disabled={pendingSection === 'DECISION'}
                        onChange={(approved) => void setApproval('DECISION', approved)}
                      />
                    }
                    onRegisterSave={registerBeslutSave}
                  />
                </ErrandTabPanel>
              ),
            },
            {
              label: 'Utbetalning',
              approved: !!approvals.payment?.approved,
              content: (
                <ErrandTabPanel>
                  <ErrandUtbetalning
                    errandId={apiErrandId}
                    locked={!!approvals.payment?.approved}
                    headerSlot={
                      <SectionApprovalCheckbox
                        label="Markera utbetalning som komplett"
                        approval={approvals.payment}
                        disabled={pendingSection === 'PAYMENT'}
                        onChange={(approved) => void setApproval('PAYMENT', approved)}
                      />
                    }
                  />
                </ErrandTabPanel>
              ),
            },
          ]
        : []),
      ],
    },
    {
      label: 'Meddelanden',
      counter: counts.unreadMessages,
      // A single tab: the conversation fills the content card itself and holds its own Meddelanden /
      // Delade bilagor tabs in the conversation header.
      tabs: [
        {
          label: 'Meddelanden',
          content: (
            <ErrandMessages
              errandId={apiErrandId}
              applicantNames={applicantNames}
              errandNumber={errand.errandNumber}
              sharedAttachments={
                <ErrandMessageAttachments
                  errandId={apiErrandId}
                  attachments={conversationAttachments}
                  summaryAttachment={conversationSummaryAttachment}
                  isLoading={attachmentsLoading}
                  loadError={!!attachmentsError}
                  hideHeading
                />
              }
            />
          ),
        },
      ],
    },
    // Dokumentation is omitted for a new application.
    ...(showDocumentation ?
      [
        {
          label: 'Dokumentation',
          tabs: [
            {
              label: 'Journal',
              content: (
                <ErrandTabPanel>
                  <ErrandJournal errandId={apiErrandId} />
                </ErrandTabPanel>
              ),
            },
            {
              label: 'Dokument',
              content: (
                <ErrandTabPanel>
                  <ErrandDocuments errandId={apiErrandId} />
                </ErrandTabPanel>
              ),
            },
          ],
        },
      ]
    : []),
  ];

  return (
    // The AppShell provides the bg-background-100 page background and full height: the administration bar
    // sits under the header, the main content scrolls and the right column sits flush against the edge.
    <div className="flex flex-col w-full h-full overflow-hidden">
      <ErrandAdministrationBar
        form={form}
        setField={setField}
        isDirty={isDirty || canSaveBeslut}
        saving={saving || savingAll}
        error={saveError}
        onSave={() => void saveAll()}
        actions={
          <>
            {/* Beslut/utbetalning gäller bara återansökan, och bara medan ärendet inte är avslutat. */}
            {isRenewalApplication && errand.status !== 'CLOSED' ?
              <ErrandAvsluta
                errandId={apiErrandId}
                onClosed={() => {
                  refresh();
                  refreshAttachments();
                }}
                checkApprovals={showCalculationSections}
              />
            : null}
            {isSupplementaryApplication ?
              <ErrandAktualisering errandId={apiErrandId} onArchived={refresh} />
            : null}
          </>
        }
      />

      <div className="flex grow min-h-0">
        <main className="flex-grow min-w-0 overflow-y-auto px-24 md:px-64 pb-40">
          <div className="w-full max-w-errand mx-auto flex flex-col">
            <div className="py-40 flex flex-col gap-24">
              <h1 className="m-0 break-words text-h2-sm md:text-h2-md">{heading}</h1>
              <ErrandMetaCard errand={errand} applicantNames={applicantNames} />
            </div>

            {/* Huvudtabsen (grupperna) ligger direkt på sidbakgrunden; innehållskortet (vit bakgrund + ram) ligger
                i varje panel, med ev. sub-tabs i kortets sidhuvud. */}
            <Tabs
              className="px-2"
              size="lg"
              panelsClassName="pt-40"
              current={activeTab}
              onTabChange={(index) => {
                setActiveTab(index);
                setActiveSubTab(0);
              }}
            >
              {tabGroups.map((group, groupIndex) => (
                <Tabs.Item key={group.label}>
                  <Tabs.Button>
                    <TabLabel label={group.label} counter={group.counter} />
                  </Tabs.Button>
                  <Tabs.Content>
                    <div className="border-1 border-divider rounded-16 bg-background-content">
                      {/* Only the active group + sub-tab mounts its content, so inactive tabs never fetch
                          (and thus never log a read) until the handläggare opens them. */}
                      {groupIndex !== activeTab ?
                        null
                      : group.tabs.length > 1 ?
                        <Tabs
                          current={activeSubTab}
                          onTabChange={setActiveSubTab}
                          tabslistClassName="px-20 pt-16"
                          panelsClassName="border-t-1 border-divider"
                        >
                          {group.tabs.map((subTab, subIndex) => (
                            <Tabs.Item key={subTab.label}>
                              <Tabs.Button>
                                <TabLabel label={subTab.label} counter={subTab.counter} approved={subTab.approved} />
                              </Tabs.Button>
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

        <ErrandSidebar sections={sections} openKeys={openSidebarSections} onToggle={toggleSidebarSection} />
      </div>
    </div>
  );
};
