import { SsbtekPayment, SsbtekPaymentPersonEnum } from '@data-contracts/backend/data-contracts';
import { TFunction } from 'i18next';

/**
 * Whose an SSBTEK payment is, as the Person column says it: "Sökande", "Medsökande", or the child by name —
 * "Alva Testsson (barn)" — as the ansökan names the child ("Barn" when it gives no name).
 */
export const ssbtekPersonLabel = (payment: SsbtekPayment, t: TFunction): string => {
  if (payment.person === SsbtekPaymentPersonEnum.CHILD) {
    return payment.childName ? t('ssbtek:persons.namedChild', { name: payment.childName }) : t('ssbtek:persons.CHILD');
  }
  return t(`ssbtek:persons.${payment.person}`);
};
