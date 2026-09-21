'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { Checkbox } from '@sk-web-gui/react';
import { formatDateRange } from '@utils/date-range';
import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentBox } from './content-box.component';
import { usePreviousNormberakning } from './previous-normberakning-context';

/**
 * The single global toggle, shown at the right end of the sub-tab row. Ticking it reveals the previous
 * normberäkning under every sub-tab at once and triggers the one shared fetch.
 */
export const PreviousNormberakningCheckbox: FC = () => {
  const { t } = useTranslation('calculation');
  const { isShown, setShown } = usePreviousNormberakning();

  return (
    <Checkbox
      checked={isShown}
      onChange={(event) => {
        setShown(event.target.checked);
      }}
    >
      {t('previous.toggle')}
    </Checkbox>
  );
};

/**
 * The read-only box a sub-tab renders below its own table. Renders nothing until the toggle is ticked,
 * then shows the shared loading/error/empty state and otherwise the section's rows.
 */
export const PreviousNormberakningBox: FC<{
  title: string;
  /** The section's total, shown to the right of the title once there is a calculation. */
  summary?: ReactNode;
  children: ReactNode;
}> = ({ title, summary, children }) => {
  const { t } = useTranslation('calculation');
  const { isShown, calculation, isLoading, error } = usePreviousNormberakning();

  if (!isShown) {
    return null;
  }

  const hasCalculation = !isLoading && !error && !!calculation;

  return (
    <ContentBox>
      <div className="flex flex-col gap-16">
        <div className="flex items-baseline justify-between gap-16 flex-wrap">
          <h3 className="text-base font-bold m-0">
            {title}
            {hasCalculation ?
              <span className="font-normal text-dark-secondary">
                {' · '}
                {formatDateRange(calculation.fromDate, calculation.toDate, t)}
              </span>
            : null}
          </h3>
          {hasCalculation ? summary : null}
        </div>

        <AsyncContent
          isLoading={isLoading}
          error={error}
          errorText={t('previous.loadError')}
          isEmpty={!calculation}
          emptyText={t('previous.empty')}
        >
          {children}
        </AsyncContent>
      </div>
    </ContentBox>
  );
};
