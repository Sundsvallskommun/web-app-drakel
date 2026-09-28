import { formatDateTime } from '@utils/date-time';
import dayjs from 'dayjs';
import { TFunction } from 'i18next';

/**
 * Formats a timestamp relatively in the UI language: "Idag HH:mm" / "Today HH:mm", "Igår HH:mm" / "Yesterday HH:mm",
 * otherwise "YYYY-MM-DD HH:mm". Pass the calling component's `t` (from useTranslation).
 * Portad från web-app-draken-public (helper-service.prettyTime).
 */
export const prettyTime = (time: string | Date | undefined, t: TFunction): string => {
  if (!time) {
    return '';
  }
  const moment = dayjs(time);
  if (moment.isSame(dayjs(), 'day')) {
    return t('overview:relativeTime.today', { time: moment.format('HH:mm') });
  }
  if (moment.isSame(dayjs().subtract(1, 'day'), 'day')) {
    return t('overview:relativeTime.yesterday', { time: moment.format('HH:mm') });
  }
  return formatDateTime(time);
};
