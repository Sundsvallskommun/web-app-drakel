'use client';

import { useSsbtekPreference } from '@components/ssbtek/ssbtek-preference-context';
import { Button, PopupMenu } from '@sk-web-gui/react';
import { Check, ChevronRight, Settings } from 'lucide-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * The user menu's Inställningar: a submenu, like Språk, of the handläggare's own settings, each checked when it
 * is on. The settings are kept per handläggare in careM. For now: whether SSBTEK opens in a new tab.
 */
export const SettingsMenuItem: FC = () => {
  const { t } = useTranslation('header');
  const { openInNewTab, setOpenInNewTab } = useSsbtekPreference();

  return (
    <PopupMenu.Item>
      <PopupMenu position="left" align="start">
        <PopupMenu.Button className="justify-between w-full">
          <Settings />
          <span className="w-full flex justify-between">
            {t('settings.label')}
            <ChevronRight />
          </span>
        </PopupMenu.Button>
        <PopupMenu.Panel>
          <PopupMenu.Items>
            <PopupMenu.Item>
              {/* PopupMenu.Items makes every item a menuitem; aria-checked tells whether the setting is on. */}
              <Button
                type="button"
                aria-checked={openInNewTab}
                className="w-full justify-between"
                onClick={() => {
                  setOpenInNewTab(!openInNewTab);
                }}
              >
                {t('settings.ssbtekInNewTab')}
                {openInNewTab ?
                  <Check />
                : null}
              </Button>
            </PopupMenu.Item>
          </PopupMenu.Items>
        </PopupMenu.Panel>
      </PopupMenu>
    </PopupMenu.Item>
  );
};
