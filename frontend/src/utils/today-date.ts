import dayjs from 'dayjs';

/** Today's date as yyyy-MM-dd, for prefilling date inputs. */
export const todayDate = (): string => dayjs().format('YYYY-MM-DD');
