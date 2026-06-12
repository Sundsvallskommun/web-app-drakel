"use client";

import { useUserStore } from '@services/user-service/user-service';
import { Link } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import NextLink from 'next/link';
import { capitalize } from 'lodash';
import { useShallow } from 'zustand/react/shallow';
 

const Example: React.FC = () => {
  const user = useUserStore(useShallow((s) => s.user));
  const { t } = useTranslation();
  console.log('user', user);
  const userString = user.name ? ` ${user.name}` : '';
  return (
        <div data-cy="example-text" className="text-content">
          <h1>{`${capitalize(t('example:welcome'))}${userString}!`}</h1>
          <p>{t('example:description')}</p>
          {user.name ?
            <NextLink href={`/logout`}>
              <Link as="span" variant="link">
                {capitalize(t('common:logout'))}
              </Link>
            </NextLink>
          : ''}
        </div>
  );
};

export default Example;