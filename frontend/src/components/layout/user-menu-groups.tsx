import i18nConfig from '@app/i18nConfig';
import { permittedAdminPages } from '@components/admin/admin-pages';
import { useChangeLanguage } from '@hooks/use-change-language';
import { useUserStore } from '@services/user-service/user-service';
import { Button, PopupMenu } from '@sk-web-gui/react';
import { Check, ChevronRight, FileText, Languages, LogOut } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Submenu listing the available UI languages; the current one is checked. */
const LanguageMenuItem = () => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useChangeLanguage();

  return (
    <PopupMenu.Item>
      <PopupMenu position="left" align="start">
        <PopupMenu.Button className="justify-between w-full">
          <Languages />
          <span className="w-full flex justify-between">
            {t('common:language')}
            <ChevronRight />
          </span>
        </PopupMenu.Button>
        <PopupMenu.Panel>
          <PopupMenu.Items>
            {i18nConfig.locales.map((language) => (
              <PopupMenu.Item key={language}>
                <Button
                  type="button"
                  className="w-full justify-between"
                  aria-current={language === currentLanguage ? 'true' : undefined}
                  lang={language}
                  onClick={() => {
                    changeLanguage(language);
                  }}
                >
                  {t(`common:languages.${language}`)}
                  {language === currentLanguage ?
                    <Check />
                  : null}
                </Button>
              </PopupMenu.Item>
            ))}
          </PopupMenu.Items>
        </PopupMenu.Panel>
      </PopupMenu>
    </PopupMenu.Item>
  );
};

/** Takes an administrator into /admin, which opens on the first page their groups let them reach. */
const AdminMenuItem = () => {
  const { t } = useTranslation('admin');
  const { locale } = useParams<{ locale: string }>();
  return (
    <PopupMenu.Item>
      <Button
        type="button"
        className="usermenu-item w-full text-left inline-flex items-center gap-2"
        onClick={() => {
          window.location.assign(`${basePath}/${locale}/admin`);
        }}
      >
        <FileText />
        <span>{t('admin:title')}</span>
      </Button>
    </PopupMenu.Item>
  );
};

const LogoutMenuItem = () => {
  const { t } = useTranslation();
  return (
    <PopupMenu.Item>
      <Button
        type="button"
        className="usermenu-item w-full text-left inline-flex items-center gap-2"
        onClick={() => {
          window.location.assign(`${basePath}/logout`);
        }}
      >
        <LogOut />
        <span>{t('common:logout')}</span>
      </Button>
    </PopupMenu.Item>
  );
};

/**
 * Menu groups for the header UserMenu: administration (only for those whose AD groups open at least one
 * of its pages), language and logout.
 */
export const useUserMenuGroups = () => {
  const { t } = useTranslation();
  const permissions = useUserStore((state) => state.user.permissions);
  const canAdminister = permittedAdminPages(permissions).length > 0;
  return [
    {
      label: t('header:userMenu.label'),
      showLabel: false,
      showOnDesktop: true,
      showOnMobile: true,
      elements: [
        ...(canAdminister ? [{ label: t('admin:title'), element: () => <AdminMenuItem /> }] : []),
        { label: t('common:language'), element: () => <LanguageMenuItem /> },
        { label: t('common:logout'), element: () => <LogoutMenuItem /> },
      ],
    },
  ];
};
