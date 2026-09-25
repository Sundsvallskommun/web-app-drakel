'use client';

import { Tabs } from '@sk-web-gui/react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SsbtekPayments } from './ssbtek-payments.component';

/**
 * The errand's SSBTEK page, opened in its own tab from the header so the errand stays open beside it. Laid out as
 * in Figma (Rakel 2.0, "errande-page"): a heading on a white page, then tabs, the first the payments per month.
 */
export const SsbtekPageClient: FC<{ errandId: string }> = ({ errandId }) => {
  const { t } = useTranslation('ssbtek');
  const [activeTab, setActiveTab] = useState<number>(0);

  return (
    <main className="h-full overflow-y-auto bg-background-content p-24 md:p-40">
      <div className="w-full flex flex-col gap-64">
        <div className="flex flex-col gap-8">
          <h1 className="m-0 text-h4-lg">{t('title')}</h1>
          <p className="m-0 text-small text-dark-secondary">{t('errand', { errand: errandId })}</p>
        </div>
        <Tabs current={activeTab} onTabChange={setActiveTab} panelsClassName="pt-24">
          <Tabs.Item>
            <Tabs.Button>{t('tabs.payments')}</Tabs.Button>
            <Tabs.Content>
              <SsbtekPayments errandId={errandId} />
            </Tabs.Content>
          </Tabs.Item>
        </Tabs>
      </div>
    </main>
  );
};
