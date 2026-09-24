'use client';

import { AttachmentPdfButton } from '@components/common/attachment-pdf-button.component';
import { PdfPreview } from '@components/common/pdf-preview.component';
import { useErrand } from '@hooks/use-errand';
import { useErrandAttachments } from '@hooks/use-errand-attachments';
import { useErrandCounts } from '@hooks/use-errand-counts';
import { useErrandForm } from '@hooks/use-errand-form';
import { useErrandNotes } from '@hooks/use-errand-notes';
import { useErrandStakeholders } from '@hooks/use-errand-stakeholders';
import { useErrandWarnings } from '@hooks/use-errand-warnings';
import { useLifecareReminders } from '@hooks/use-lifecare-reminders';
import { useLifecareSectionStatus } from '@hooks/use-lifecare-section-status';
import { Badge, Spinner, Tabs } from '@sk-web-gui/react';
import { CLIENT_FILES_PDF } from '@utils/attachment-names';
import { stakeholderDisplayName } from '@utils/stakeholder-name';
import { compareByRole } from '@utils/stakeholder-role';
import { Check } from 'lucide-react';
import { FC, Fragment, ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrandAdministrationBar } from './errand-administration-bar.component';
import { ErrandAktualisering } from './errand-aktualisering.component';
import { ErrandApplicationSummary } from './errand-application-summary.component';
import { ErrandAttachments } from './errand-attachments.component';
import { ErrandAvsluta } from './errand-avsluta.component';
import { ErrandBeslut } from './errand-beslut.component';
import { ErrandBevakningar } from './errand-bevakningar.component';
import { ErrandEvents } from './errand-events.component';
import { ErrandHeaderBanner } from './errand-header-banner.component';
import { ErrandMessageAttachments } from './errand-message-attachments.component';
import { ErrandMessages } from './errand-messages.component';
import { ErrandMetaCard } from './errand-meta-card.component';
import { ErrandNormberakning } from './errand-normberakning.component';
import { ErrandNotes } from './errand-notes.component';
import { ErrandSidebar, SidebarSection } from './errand-sidebar.component';
import { ErrandUtbetalning } from './errand-utbetalning.component';
import { ErrandWarnings } from './errand-warnings.component';
import { LifecareRecordSection } from './lifecare-record-section.component';

// Drafts are created with this sentinel title until the handläggare fills the errand in.
const EMPTY_ERRAND_TITLE = 'Empty errand';

/** One tab inside a group; groups with a single tab render their content without a sub-tab row. */
interface ErrandSubTab {
  label: string;
  content: ReactNode;
  /** Count shown as a badge after the label (e.g. number of attachments). */
  counter?: number;
  /** Shows a green check next to the sub-tab label once Lifecare has the section as done. */
  approved?: boolean;
}
// Statuses an errand has once it is decided: finalize sets GRANTED/REJECTED, and CLOSED is the older end
// state. "Besluta och utbetala" is not offered on any of them — caremanagement would refuse a second finalize.
const DECIDED_STATUSES = ['GRANTED', 'REJECTED', 'CLOSED'];

/** A top-level tab group (Ärende, Meddelanden, Dokumentation) holding one or more sub-tabs. */
interface ErrandTabGroup {
  label: string;
  counter?: number;
  tabs: ErrandSubTab[];
}

/** A tab label followed by its optional count badge and "godkänd" check. */
const TabLabel: FC<{ label: string; counter?: number; approved?: boolean }> = ({ label, counter, approved }) => {
  const { t } = useTranslation('errand');
  return (
    <span className="inline-flex items-center gap-8">
      {approved ?
        <Check size={18} className="text-gronsta-surface-primary" aria-label={t('detail.approved')} />
      : null}
      {label}
      {counter !== undefined ?
        <Badge color="tertiary" inverted size="sm" counter={counter > 99 ? '99+' : counter} />
      : null}
    </span>
  );
};

/** Padding for the content of a sub-tab inside the errand's content card. */
const ErrandTabPanel: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="px-24 md:px-48 pt-40 pb-64 flex flex-col gap-24">{children}</div>
);

export const ErrandDetail: FC<{ errandId: string }> = ({ errandId }) => {
  const { t } = useTranslation('errand');
  const { errand, isLoading, error, refresh } = useErrand(errandId);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<number>(0);
  // Keys of the expanded right-column sections; a section's data only loads once it's expanded.
  // Bevakningar are open from the start: they are the section a handläggare is expected to act on, and
  // a collapsed list hides work rather than saving space.
  const [openSidebarSections, setOpenSidebarSections] = useState<string[]>(['bevakningar']);
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
  // The route param can be an errand NUMBER (not a UUID); caremanagement sub-resources require the
  // errand's UUID. Gate those fetches on the resolved errand.id so we never call them with a non-UUID.
  const resolvedErrandId = errand?.id ?? '';

  // The tab layout depends on the application type. New and supplementary applications have no
  // calculation/decision/payment flow, and a new application also omits the Dokumentation group. Renewal — and
  // any unknown or generic type — gets the full set.
  const typeSlug = errand?.typeSlug ?? '';
  const isNewApplication = typeSlug === 'financial-assistance-new';
  const isSupplementaryApplication = typeSlug === 'financial-assistance-supplementary';
  const isRenewalApplication = typeSlug === 'financial-assistance-renewal';
  const showCalculationSections = !isNewApplication && !isSupplementaryApplication;
  const showDocumentation = !isNewApplication;

  // The checks on Normberäkning, Beslut and Utbetalning follow Lifecare: a slutlig beräkning, a saved beslut
  // and a registered utbetalning. Read with the errand so they show as it opens, and again after each change.
  const { status: sectionStatus, refresh: refreshSectionStatus } = useLifecareSectionStatus(
    resolvedErrandId,
    showCalculationSections
  );

  const saveAll = useCallback(async () => {
    setSavingAll(true);
    await save();
    if (beslutSaveRef.current && (await beslutSaveRef.current())) {
      refreshSectionStatus();
    }
    setSavingAll(false);
  }, [save, refreshSectionStatus]);

  // Lazy-load gating: most sections' data is only fetched when their tab/sidebar is actually open, so
  // opening an errand doesn't log a read of everything. When shown, the Ärende sub-tab order is
  // 0 Ansökan · 1 Bilagor · 2 Normberäkning · 3 Beslut · 4 Utbetalning (the last three carry a Lifecare check).
  // Warnings load with the errand rather than on demand: the SSBTEK read-failure banner has to appear
  // as soon as the errand opens, and caremanagement exposes no unlogged way to ask whether that warning
  // exists. The trade-off is accepted — listing warnings is recorded in the errand's event log, unlike
  // the count endpoints the badges use.
  const warningsEnabled = true;
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

  // Bevakningar live in Lifecare and are read from there; the list also gives the section its badge.
  const {
    reminders,
    isLoading: remindersLoading,
    error: remindersError,
    refresh: refreshReminders,
  } = useLifecareReminders(resolvedErrandId, bevakningarEnabled);
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
        .map((stakeholder) => stakeholderDisplayName(stakeholder, t('common:unknownStakeholder'))),
    [stakeholders, t]
  );

  // Only OPEN warnings are actionable — acknowledged/closed ones disappear from the right column.
  // The SSBTEK read failure is an errand-wide state, not a calculation row: on a failed day the rules
  // are deliberately not evaluated and nothing in the calculation changes, so the banner is the only
  // sign of it. caremanagement closes the warning itself once a later read succeeds.
  const ssbtekFailure = warnings.find((warning) => warning.type === 'SSBTEK_READ_FAILED' && warning.status === 'OPEN');

  // The normberäkning tab shows only the warnings caremanagement places there. DECISION and PAYMENT
  // warnings belong to their own tabs (the payment ones ride along on the utbetalningsförslag), and
  // without this filter they would surface beside the calculation tables where they do not belong.
  const openWarnings = warnings.filter(
    (warning) => warning.status === 'OPEN' && (warning.section ?? 'CALCULATION') === 'CALCULATION'
  );

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
  // The generated "ärendeuppgifter" PDF (documentType CASE_DATA) is opened via "Visa pdf" on the Ansökan tab,
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
    return (
      <p className="my-32">
        {t('detail.loadError', {
          error: String(error ?? t('detail.unknownError')),
          interpolation: { escapeValue: false },
        })}
      </p>
    );
  }

  const heading = errand.title && errand.title !== EMPTY_ERRAND_TITLE ? errand.title : t('detail.newErrandHeading');
  const apiErrandId = errand.id ?? errandId;

  const sections: SidebarSection[] = [
    {
      key: 'warnings',
      label: t('sidebar:sections.warnings'),
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
      label: t('sidebar:sections.notes'),
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
      label: t('sidebar:sections.bevakningar'),
      badge: reminders.length,
      badgeColor: reminders.length > 0 ? 'warning' : 'tertiary',
      component: (
        <ErrandBevakningar
          errandId={errand.id ?? ''}
          reminders={reminders}
          isLoading={remindersLoading}
          loadError={!!remindersError}
          refresh={refreshReminders}
        />
      ),
    },
    {
      key: 'events',
      label: t('sidebar:sections.events'),
      component: <ErrandEvents errandId={errand.id ?? ''} />,
    },
  ];

  // Tabs are grouped into top-level sections; a group with several tabs gets a secondary sub-tab row, a
  // single-tab group renders its content directly. "Ärende" holds the whole application/decision flow;
  // Meddelanden and Dokumentation are separate groups (Händelselogg lives in the right column).
  const tabGroups: ErrandTabGroup[] = [
    {
      label: t('detail.tabs.errand'),
      tabs: [
        {
          label: t('detail.tabs.application'),
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
                        label={t('detail.showPdf')}
                        modalLabel={t('detail.summaryPdf')}
                      />
                    </div>
                  : null
                }
              />
            </ErrandTabPanel>
          ),
        },
        {
          label: t('detail.tabs.attachments'),
          counter: errandAttachments.length + conversationAttachments.length,
          content: (
            <ErrandTabPanel>
              <ErrandAttachments
                errandId={apiErrandId}
                attachments={errandAttachments}
                messageAttachments={conversationAttachments}
                isLoading={attachmentsLoading}
                loadError={!!attachmentsError}
                heading={t('detail.attachmentsFromApplication')}
              />
              {/* The message-attachments summary PDF is mirrored here so it's also reachable under the
                  regular Bilagor tab (the full conversation list stays under Meddelanden → Bilagor). */}
              {conversationSummaryAttachment?.id ?
                <PdfPreview
                  errandId={apiErrandId}
                  attachmentId={conversationSummaryAttachment.id}
                  title={t('detail.messageAttachmentsSummary')}
                />
              : null}
            </ErrandTabPanel>
          ),
        },
        // Calculation / decision / payment only apply to a renewal (and any unknown/generic type).
        ...(showCalculationSections ?
          [
            {
              label: t('detail.tabs.calculation'),
              approved: sectionStatus.calculationFinalized,
              content: (
                <ErrandTabPanel>
                  <ErrandNormberakning
                    errandId={apiErrandId}
                    warnings={openWarnings}
                    onWarningsChanged={refreshWarnings}
                    onLifecareChanged={refreshSectionStatus}
                    handlaggare={errand.assignedUserId}
                  />
                </ErrandTabPanel>
              ),
            },
            {
              label: t('detail.tabs.decision'),
              approved: sectionStatus.decisionSaved,
              content: (
                <ErrandTabPanel>
                  <ErrandBeslut errandId={apiErrandId} onRegisterSave={registerBeslutSave} />
                </ErrandTabPanel>
              ),
            },
            {
              label: t('detail.tabs.payment'),
              approved: sectionStatus.paymentRegistered,
              content: (
                <ErrandTabPanel>
                  <ErrandUtbetalning errandId={apiErrandId} onLifecareChanged={refreshSectionStatus} />
                </ErrandTabPanel>
              ),
            },
          ]
        : []),
      ],
    },
    {
      label: t('detail.tabs.messages'),
      counter: counts.unreadMessages,
      // A single tab: the conversation fills the content card itself and holds its own Meddelanden /
      // Delade bilagor tabs in the conversation header.
      tabs: [
        {
          label: t('detail.tabs.messages'),
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
          label: t('detail.tabs.documentation'),
          tabs: [
            {
              label: t('detail.tabs.journal'),
              content: (
                <ErrandTabPanel>
                  <LifecareRecordSection errandId={apiErrandId} category="JOURNAL_NOTE" />
                </ErrandTabPanel>
              ),
            },
            {
              label: t('detail.tabs.documents'),
              content: (
                <ErrandTabPanel>
                  <LifecareRecordSection errandId={apiErrandId} category="DOCUMENT" />
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
            {/* Beslut/utbetalning gäller bara återansökan, och bara medan ärendet inte är beslutat. */}
            {isRenewalApplication && !DECIDED_STATUSES.includes(errand.status ?? '') ?
              <ErrandAvsluta
                errandId={apiErrandId}
                onFinalized={() => {
                  refresh();
                  refreshAttachments();
                }}
              />
            : null}
            {isSupplementaryApplication ?
              <ErrandAktualisering errandId={apiErrandId} onArchived={refresh} />
            : null}
          </>
        }
      />

      {ssbtekFailure ?
        <ErrandHeaderBanner>
          {ssbtekFailure.message ?? ssbtekFailure.typeDisplayName ?? t('detail.ssbtekReadFailed')}
        </ErrandHeaderBanner>
      : null}

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
