'use client';

import { Avatar } from '@sk-web-gui/react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface ConversationHeaderProps {
  /** The counterpart of the conversation (e.g. the applicant's name). */
  name: string;
  /** Avatar initials (derived by the caller, e.g. from the first applicant's name). */
  initials: string;
  errandNumber?: string;
}

/** Heading of the open conversation: counterpart avatar + name and the errand number underneath. */
export const ConversationHeader: FC<ConversationHeaderProps> = ({ name, initials, errandNumber }) => {
  const { t } = useTranslation('messages');
  return (
    <div className="flex items-center gap-8 px-20 md:pl-40 md:pr-16 pt-16 pb-24">
      <Avatar size="sm" rounded accent color="juniskar" className="shrink-0" initials={initials} />
      <div className="flex min-w-0 flex-col">
        <p className="m-0 truncate text-base text-dark-primary">{name}</p>
        {errandNumber ?
          <span className="truncate text-small text-dark-secondary">
            {t('conversation.errandNumber', { errandNumber })}
          </span>
        : null}
      </div>
    </div>
  );
};
