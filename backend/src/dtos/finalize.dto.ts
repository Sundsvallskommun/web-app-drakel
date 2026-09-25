import { DecisionNotificationDto } from '@/dtos/decision-notification.dto';

/**
 * What the handläggare sends with "Besluta och utbetala": the channels the beslut goes out through.
 * Everything else is what they already saved — careM reads the beslut, orsak included, from Lifecare
 * itself, and the Utbetalning tab has registered the utbetalningar there — rather than trusting a second
 * copy from the browser.
 */
export class FinalizeErrandDto extends DecisionNotificationDto {}
