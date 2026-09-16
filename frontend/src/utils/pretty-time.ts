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
  const d = dayjs(time);
  if (d.isSame(dayjs(), 'day')) {
    return t('overview:relativeTime.today', { time: d.format('HH:mm') });
  }
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) {
    return t('overview:relativeTime.yesterday', { time: d.format('HH:mm') });
  }
  return d.format('YYYY-MM-DD HH:mm');
};
