'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { FinancialAssistanceData, SubmittedChild, faLabel, swedishMonth } from '@interfaces/financial-assistance';
import { FC, ReactNode } from 'react';

// Errandets `data` (FinancialAssistanceData) släpps igenom av backend men saknas i det genererade
// frontend-kontraktets Errand-typ — vi läser ut det med en smal typning.
type ErrandWithData = Errand & { data?: FinancialAssistanceData };

const kr = (value?: number): string | undefined => (value == null ? undefined : `${value} kr`);
const yesNo = (value?: boolean): string | undefined => (value == null ? undefined : value ? 'Ja' : 'Nej');
const childName = (child: SubmittedChild): string =>
  child.name?.trim() || [child.firstName, child.lastName].filter(Boolean).join(' ').trim();

const Row: FC<{ label: string; value: ReactNode }> = ({ label, value }) => {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="text-small text-dark-secondary">{label}</div>
      <div className="font-bold break-words">{value}</div>
    </div>
  );
};

const Section: FC<{ heading: string; children: ReactNode }> = ({ heading, children }) => (
  <section className="flex flex-col gap-12">
    <h3 className="text-h4-sm md:text-h4-md m-0">{heading}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-40 gap-y-12">{children}</div>
  </section>
);

/**
 * Fliken "Ärendeuppgifter" — listar de uppgifter medborgaren skickade in på ärendet
 * (FinancialAssistanceData) skrivskyddat för handläggaren.
 */
export const ErrandApplicationData: FC<{ errand: Errand }> = ({ errand }) => {
  const data = (errand as ErrandWithData).data;

  if (!data) {
    return (
      <div className="pt-24 pb-40 px-24 md:px-40">
        <p>Inga inskickade uppgifter att visa för det här ärendet.</p>
      </div>
    );
  }

  const period =
    data.periodMonth && data.periodYear
      ? `${swedishMonth(data.periodMonth)} ${data.periodYear}`
      : faLabel('periodChoice', data.periodChoice) || undefined;

  const assetValue = (asset: NonNullable<FinancialAssistanceData['assets']>[number]): string | undefined => {
    const fromValue = kr(asset.value);
    if (fromValue) return fromValue;
    const rest = [
      asset.description,
      faLabel('vehicleType', asset.vehicleType),
      faLabel('propertyType', asset.propertyType),
      asset.companyName,
    ]
      .filter(Boolean)
      .join(', ');
    return rest || undefined;
  };

  return (
    <div className="pt-24 pb-40 px-24 md:px-40 flex flex-col gap-32">
      <div className="flex flex-col gap-8">
        <h2 className="text-h2-sm md:text-h2-md m-0">Inskickade uppgifter</h2>
        <span>Uppgifterna som sökanden lämnade i ansökan via Mina sidor.</span>
      </div>

      <Section heading="Ansökan">
        <Row label="Typ av ansökan" value={faLabel('applicationType', data.applicationType)} />
        <Row label="Civilstånd" value={faLabel('maritalStatus', data.maritalStatus)} />
        <Row label="Ansökningsperiod" value={period} />
        <Row label="Norm" value={faLabel('normType', data.normType)} />
        <Row label="Annat bistånd" value={data.otherBenefitDescription} />
      </Section>

      <Section heading="Hushåll och boende">
        <Row label="Barn under 21 i hemmet" value={yesNo(data.hasChildrenUnder21)} />
        {(data.children ?? []).map((child, index) => (
          <Row key={`child-${index}`} label={`Barn ${index + 1}`} value={childName(child)} />
        ))}
        <Row label="Boendeform" value={faLabel('housingForm', data.housingForm)} />
        <Row label="Antal personer i hushållet" value={data.housingPersonCount} />
        <Row label="Antal rum + kök" value={data.housingRoomsPlusKitchen} />
        <Row label="Beskrivning av boende" value={data.housingDescription} />
      </Section>

      {(data.costs ?? []).length > 0 ? (
        <Section heading="Kostnader">
          {(data.costs ?? []).map((cost, index) => (
            <Row
              key={`cost-${index}`}
              label={
                cost.costType === 'OTHER' && cost.otherSubType
                  ? `${faLabel('costType', cost.costType)} – ${faLabel('costOtherSubType', cost.otherSubType)}`
                  : faLabel('costType', cost.costType) || `Kostnad ${index + 1}`
              }
              value={[kr(cost.appliedAmount), cost.specification].filter(Boolean).join(' · ')}
            />
          ))}
        </Section>
      ) : null}

      {(data.incomes ?? []).length > 0 ? (
        <Section heading="Inkomster">
          {(data.incomes ?? []).map((income, index) => (
            <Row
              key={`income-${index}`}
              label={faLabel('incomeType', income.incomeType) || `Inkomst ${index + 1}`}
              value={[kr(income.amount), faLabel('person', income.recipient)].filter(Boolean).join(' · ')}
            />
          ))}
        </Section>
      ) : null}

      {(data.pendingBenefits ?? []).length > 0 ? (
        <Section heading="Väntande ersättningar">
          {(data.pendingBenefits ?? []).map((benefit, index) => (
            <Row key={`benefit-${index}`} label={benefit.benefitName || `Ersättning ${index + 1}`} value={benefit.applicantName} />
          ))}
        </Section>
      ) : null}

      {(data.assets ?? []).length > 0 ? (
        <Section heading="Tillgångar">
          {(data.assets ?? []).map((asset, index) => (
            <Row
              key={`asset-${index}`}
              label={faLabel('assetCategory', asset.assetCategory) || `Tillgång ${index + 1}`}
              value={assetValue(asset)}
            />
          ))}
        </Section>
      ) : null}

      {(data.plannings ?? []).length > 0 ? (
        <Section heading="Planering">
          {(data.plannings ?? []).map((planning, index) => (
            <Row
              key={`planning-${index}`}
              label={faLabel('person', planning.person) || `Planering ${index + 1}`}
              value={faLabel('planningType', planning.planningType)}
            />
          ))}
          {(data.jobApplications ?? []).map((job, index) => (
            <Row
              key={`job-${index}`}
              label={`Sökt jobb ${index + 1}`}
              value={[job.jobTitle, job.employerAndPlace, job.applicationDate].filter(Boolean).join(' · ')}
            />
          ))}
          {(data.plannedActivities ?? []).map((activity, index) => (
            <Row
              key={`activity-${index}`}
              label={`Aktivitet ${index + 1}`}
              value={[activity.activity, activity.periodFrom, activity.periodTo].filter(Boolean).join(' · ')}
            />
          ))}
        </Section>
      ) : null}

      {(data.persons ?? []).length > 0 ? (
        <Section heading="Utbetalning och kontaktuppgifter">
          {(data.persons ?? []).map((person, index) => (
            <Row
              key={`person-${index}`}
              label={faLabel('person', person.role) || `Person ${index + 1}`}
              value={[
                faLabel('paymentMethod', person.paymentMethod),
                [person.clearingNumber, person.accountNumber].filter(Boolean).join(' '),
                person.email,
                person.phone,
              ]
                .filter(Boolean)
                .join(' · ')}
            />
          ))}
        </Section>
      ) : null}

      <Section heading="Vistelse och försäkran">
        <Row label="Vistas i kommunen under ansökningsmånaden" value={yesNo(data.staysInMunicipality)} />
        <Row label="Beskrivning av vistelse" value={data.stayDescription} />
        <Row label="Försäkran lämnad" value={yesNo(data.attestation)} />
      </Section>
    </div>
  );
};
