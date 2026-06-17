'use client';

import { initiateErrand } from '@services/errand-service/errand-service';
import { Spinner } from '@sk-web-gui/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

/**
 * Registering a new errand mirrors draken: visiting this page immediately creates an empty draft
 * errand on the backend, then redirects to that errand's page where its fields are filled in.
 */
export const RegistreraPageClient = () => {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const initiated = useRef<boolean>(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    // Guard against React strict-mode double effect creating two draft errands.
    if (initiated.current) {
      return;
    }
    initiated.current = true;

    void initiateErrand().then((result) => {
      const routeSegment = result.data?.errandNumber ?? result.data?.id;
      if (result.error || !routeSegment) {
        setError('Det gick inte att initiera ett nytt ärende');
        return;
      }
      router.replace(`/${locale}/arende/${encodeURIComponent(routeSegment)}`);
    });
  }, [router, locale]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-28 gap-16">
      {error ?
        <p className="text-error-surface-primary">{error}</p>
      : <>
          <Spinner size={4} />
          <span className="text-dark-secondary">Registrerar nytt ärende…</span>
        </>
      }
    </div>
  );
};
