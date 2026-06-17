'use client';

import { useErrandHeader } from '@components/layout/errand-header-context';
import { useErrand } from '@hooks/use-errand';
import { useErrandForm } from '@hooks/use-errand-form';
import { useErrandNotes } from '@hooks/use-errand-notes';
import { Spinner, Tabs } from '@sk-web-gui/react';
import { NotebookPen, UserCog } from 'lucide-react';
import { FC, useEffect, useState } from 'react';

import { ErrandApplicationData } from './errand-application-data.component';
import { ErrandAttachments } from './errand-attachments.component';
import { ErrandBasicsTab } from './errand-basics-tab.component';
import { ErrandInfoPanel } from './errand-info-panel.component';
import { ErrandMessages } from './errand-messages.component';
import { ErrandNotes } from './errand-notes.component';
import { ErrandSidebar, SidebarSection } from './errand-sidebar.component';

// Drafts are created with this sentinel title until the handläggare fills the errand in.
const EMPTY_ERRAND_TITLE = 'Empty errand';

export const ErrandDetail: FC<{ errandId: string }> = ({ errandId }) => {
  const { errand, isLoading, error, refresh } = useErrand(errandId);
  const [activeTab, setActiveTab] = useState<number>(0);
  const { setErrand: setHeaderErrand } = useErrandHeader();
  const { form, setField, isDirty, saving, error: saveError, save } = useErrandForm(errand, refresh);
  const { notes, isLoading: notesLoading, error: notesError, refresh: refreshNotes } = useErrandNotes(errandId);

  // Surface the errand's status/title into the slim app header, and clear it on leave.
  useEffect(() => {
    if (errand) {
      setHeaderErrand({ id: errand.id, title: errand.title, status: errand.status });
    }
    return () => {
      setHeaderErrand(undefined);
    };
  }, [errand?.id, errand?.title, errand?.status, setHeaderErrand]);

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
              <Tabs.Button className="text-base">Grunduppgifter</Tabs.Button>
              <Tabs.Content>
                <ErrandBasicsTab errand={errand} form={form} setField={setField} />
              </Tabs.Content>
            </Tabs.Item>
            <Tabs.Item>
              <Tabs.Button className="text-base">Ärendeuppgifter</Tabs.Button>
              <Tabs.Content>
                <ErrandApplicationData errand={errand} />
              </Tabs.Content>
            </Tabs.Item>
            <Tabs.Item>
              <Tabs.Button className="text-base">Bilagor</Tabs.Button>
              <Tabs.Content>
                <div className="pt-24 pb-40 px-24 md:px-40">
                  <ErrandAttachments errandId={errandId} />
                </div>
              </Tabs.Content>
            </Tabs.Item>
            <Tabs.Item>
              <Tabs.Button className="text-base">Meddelanden</Tabs.Button>
              <Tabs.Content>
                <div className="pt-24 pb-40 px-24 md:px-40">
                  <ErrandMessages errandId={errandId} />
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
