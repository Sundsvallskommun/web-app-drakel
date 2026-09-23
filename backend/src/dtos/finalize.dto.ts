import { DecisionNotificationDto } from '@/dtos/decision-notification.dto';

/**
 * What the handläggare sends with "Besluta och utbetala": the channels the beslut goes out through.
 * Everything else in the finalize payload is what they already saved — the beslut, orsak included, is
 * read from Lifecare and the utbetalningar from caremanagement — rather than trusting a second copy from
 * the browser.
 */
export class FinalizeErrandDto extends DecisionNotificationDto {}
