import { Button, PopupMenu } from '@sk-web-gui/react';
import { LogOut } from 'lucide-react';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Menu groups for the header UserMenu: logout. The app always runs in light mode, so there is no colour scheme switcher. */
export const userMenuGroups = [
  {
    label: 'Meny',
    showLabel: false,
    showOnDesktop: true,
    showOnMobile: true,
    elements: [
      {
        label: 'Logga ut',
        element: () => (
          <PopupMenu.Item>
            <Button
              type="button"
              className="usermenu-item w-full text-left inline-flex items-center gap-2"
              onClick={() => {
                window.location.assign(`${basePath}/logout`);
              }}
            >
              <LogOut />
              <span>Logga ut</span>
            </Button>
          </PopupMenu.Item>
        ),
      },
    ],
  },
];
