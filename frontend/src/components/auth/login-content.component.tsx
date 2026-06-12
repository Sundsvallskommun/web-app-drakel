'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, FormErrorMessage } from '@sk-web-gui/react';
import EmptyLayout from '@layouts/empty-layout/empty-layout.component';
import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { appURL } from '@utils/app-url';
import { useTranslation } from 'react-i18next';
import { apiURL } from '@utils/api-url';
import { capitalize } from 'lodash';
import { PATH } from '@utils/constants';

const autoLogin = false;

const LoginContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathName = usePathname();
  const { t } = useTranslation();

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const initialFocusRef = useRef<HTMLButtonElement>(null);

  const isLoggedOut = searchParams.get('loggedout') === '';
  const failMessage = searchParams.get('failMessage');

  const getRedirectPath = () => {
    const searchPath = searchParams.get('path');

    if (pathName && !pathName.includes(PATH.api.login)) return pathName;
    if (searchPath && !/\/login|\/logout/.test(searchPath)) return searchPath;

    return '/';
  };

  const onLogin = useCallback(() => {
    const path = getRedirectPath();

    const url = new URL(apiURL(PATH.api.samlLogin));
    url.search = new URLSearchParams({
      successRedirect: appURL(path),
      failureRedirect: `${appURL()}${PATH.api.login}`,
    }).toString();

    router.push(url.toString());
  }, [router, searchParams, pathName]);

  useEffect(() => {
    initialFocusRef.current?.focus();

    if (!router) return;

    if (isLoggedOut) {
      router.push('/login');
      return setIsLoading(false);
    }

    if (failMessage === 'NOT_AUTHORIZED' && autoLogin) {
      onLogin();
      return;
    }

    if (failMessage) {
      setErrorMessage(t(`login:errors.${failMessage}`));
    }

    setIsLoading(false);
  }, [failMessage, isLoggedOut, onLogin, router, t]);

  if (isLoading) {
    return (
      <EmptyLayout>
        <LoaderFullScreen />
      </EmptyLayout>
    );
  }

  return (
    <EmptyLayout>
      <main>
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-5xl w-full flex flex-col text-light-primary bg-inverted-background-content p-20 shadow-lg text-left">
            <div className="mb-14">
              <h1 className="mb-10 text-xl">{process.env.NEXT_PUBLIC_APP_NAME}</h1>
              <p className="my-0">{t('login:description')}</p>
            </div>

            <Button
              inverted
              onClick={onLogin}
              ref={initialFocusRef}
              data-cy="loginButton"
            >
              {capitalize(t('common:login'))}
            </Button>

            {errorMessage && (
              <FormErrorMessage className="mt-lg">
                {errorMessage}
              </FormErrorMessage>
            )}
          </div>
        </div>
      </main>
    </EmptyLayout>
  );
};

export default LoginContent;