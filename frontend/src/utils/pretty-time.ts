import dayjs from 'dayjs';

/**
 * Formats a timestamp relatively: "Idag HH:mm", "Igår HH:mm" eller "YYYY-MM-DD HH:mm".
 * Portad från web-app-draken-public (helper-service.prettyTime).
 */
export const prettyTime = (time?: string | Date): string => {
  if (!time) {
    return '';
  }
  const d = dayjs(time);
  if (d.isSame(dayjs(), 'day')) {
    return `Idag ${d.format('HH:mm')}`;
  }
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) {
    return `Igår ${d.format('HH:mm')}`;
  }
  return d.format('YYYY-MM-DD HH:mm');
};
