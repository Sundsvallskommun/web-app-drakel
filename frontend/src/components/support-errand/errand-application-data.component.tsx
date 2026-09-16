'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { faLabel, FinancialAssistanceData, SubmittedChild, swedishMonth } from '@interfaces/financial-assistance';
import { getApplicationData } from '@services/errand-service/errand-service';
import { Spinner } from '@sk-web-gui/react';
import { applicationSectionIcon } from '@utils/application-section-icon';
import { formatDateRange } from '@utils/date-range';
import { FC, ReactNode, useEffect, useState } from 'react';

import { ContentBox } from './content-box.component';
import { ErrandJobStimulus } from './errand-job-stimulus.component';
import { ErrandStakeholders } from './errand-stakeholders.component';
import { LabeledValue } from './labeled-value.component';
import { PersonCard } from './person-card.component';
import { ReadOnlyTable } from './read-only-table.component';
import { SectionAccordion } from './section-accordion.component';

type SubmittedPlanning = NonNullable<FinancialAssistanceData['plannings']>[number];
type SubmittedAsset = NonNullable<FinancialAssistanceData['assets']>[number];

interface AnswerItem {
  label: string;
  value?: ReactNode;
}

const kr = (value?: number): string | undefined => (value == null ? undefined : `${value} kr`);
const yesNo = (value?: boolean): string | undefined =>
  value == null ? undefined
  : value ? 'Ja'
  : 'Nej';
/** A table cell's text, with a dash for missing values. */
const cellText = (value?: string | number): string => (value === undefined || value === '' ? '—' : String(value));
/** "100 % · 2026-09-01 – 2026-09-30" — the sick-leave level and the medical certificate's period. */
const sickLeaveSummary = (planning: SubmittedPlanning): string | undefined => {
  const level = planning.sickLeaveLevel ? `${planning.sickLeaveLevel} %` : undefined;
  const period = planning.sickLeaveFrom ? formatDateRange(planning.sickLeaveFrom, planning.sickLeaveTo) : undefined;
  return [level, period].filter(Boolean).join(' · ') || undefined;
};
const childName = (child: SubmittedChild): string =>
  child.name?.trim() ?? [child.firstName, child.lastName].filter(Boolean).join(' ').trim();

const assetValue = (asset: SubmittedAsset): string | undefined => {
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

const hasAnswer = (item: AnswerItem): boolean => item.value !== undefined && item.value !== null && item.value !== '';

/** The answered items as question/answer pairs in a grey box; nothing when no item has an answer. */
const AnswerBox: FC<{ title?: string; items: AnswerItem[] }> = ({ title, items }) => {
  const answeredItems = items.filter(hasAnswer);
  if (answeredItems.length === 0) return null;
  return (
    <ContentBox title={title}>
      <div className="flex flex-col gap-40">
        {answeredItems.map((item) => (
          <LabeledValue key={item.label} label={item.label} className="break-words">
            {item.value}
          </LabeledValue>
        ))}
      </div>
    </ContentBox>
  );
};

/** A titled grey box holding a read-only table. */
const TableBox: FC<{ title: string; columns: string[]; rows: ReactNode[][] }> = ({ title, columns, rows }) => (
  <ContentBox title={title}>
    <ReadOnlyTable ariaLabel={title} columns={columns} rows={rows} />
  </ContentBox>
);

/** One application data group as an open accordion whose grey boxes are stacked below each other. */
const ApplicationAccordion: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <SectionAccordion title={title} icon={applicationSectionIcon(title)} initialOpen>
    <div className="flex flex-col gap-40">{children}</div>
  </SectionAccordion>
);

/** The submitted application data (FinancialAssistanceData), grouped into read-only accordions. */
const ApplicationSections: FC<{ data: FinancialAssistanceData }> = ({ data }) => {
  const period =
    data.periodMonth && data.periodYear ?
      `${swedishMonth(data.periodMonth)} ${data.periodYear}`
    : faLabel('periodChoice', data.periodChoice) || undefined;

  const applicationItems: AnswerItem[] = [
    { label: 'Typ av ansökan', value: faLabel('applicationType', data.applicationType) },
    { label: 'Civilstånd', value: faLabel('maritalStatus', data.maritalStatus) },
    { label: 'Ansökningsperiod', value: period },
    { label: 'Norm', value: faLabel('normType', data.normType) },
    { label: 'Annat bistånd', value: data.otherBenefitDescription },
  ];
  const housingItems: AnswerItem[] = [
    { label: 'Barn under 21 i hemmet', value: yesNo(data.hasChildrenUnder21) },
    { label: 'Boendeform', value: faLabel('housingForm', data.housingForm) },
    { label: 'Antal personer i hushållet', value: data.housingPersonCount },
    { label: 'Antal rum + kök', value: data.housingRoomsPlusKitchen },
    { label: 'Beskrivning av boende', value: data.housingDescription },
  ];
  const stayItems: AnswerItem[] = [
    { label: 'Vistas i kommunen under ansökningsmånaden', value: yesNo(data.staysInMunicipality) },
    { label: 'Beskrivning av vistelse', value: data.stayDescription },
    { label: 'Försäkran lämnad', value: yesNo(data.attestation) },
  ];

  const children = data.children ?? [];
  const costs = data.costs ?? [];
  const incomes = data.incomes ?? [];
  const pendingBenefits = data.pendingBenefits ?? [];
  const assets = data.assets ?? [];
  const plannings = data.plannings ?? [];
  const jobApplications = data.jobApplications ?? [];
  const plannedActivities = data.plannedActivities ?? [];
  const persons = data.persons ?? [];

  return (
    <>
      {applicationItems.some(hasAnswer) ?
        <ApplicationAccordion title="Ansökan">
          <AnswerBox items={applicationItems} />
        </ApplicationAccordion>
      : null}

      {housingItems.some(hasAnswer) || children.length > 0 ?
        <ApplicationAccordion title="Hushåll och boende">
          <AnswerBox items={housingItems} />
          {children.length > 0 ?
            <ContentBox title="Barn">
              {children.map((child, index) => (
                <PersonCard
                  key={`child-${index}`}
                  name={childName(child) || `Barn ${index + 1}`}
                  detailColumns={[[child.schoolName]]}
                />
              ))}
            </ContentBox>
          : null}
        </ApplicationAccordion>
      : null}

      {costs.length > 0 ?
        <ApplicationAccordion title="Kostnader">
          <TableBox
            title="Sökta kostnader"
            columns={['Typ av kostnad', 'Belopp', 'Specifikation']}
            rows={costs.map((cost, index) => [
              cost.costType === 'OTHER' && cost.otherSubType ?
                `${faLabel('costType', cost.costType)} – ${faLabel('costOtherSubType', cost.otherSubType)}`
              : faLabel('costType', cost.costType) || `Kostnad ${index + 1}`,
              cellText(kr(cost.appliedAmount)),
              cellText(cost.specification),
            ])}
          />
        </ApplicationAccordion>
      : null}

      {incomes.length > 0 || pendingBenefits.length > 0 || assets.length > 0 ?
        <ApplicationAccordion title="Inkomster och tillgångar">
          {incomes.length > 0 ?
            <TableBox
              title="Inkomster"
              columns={['Typ av inkomst', 'Belopp', 'Mottagare']}
              rows={incomes.map((income, index) => [
                faLabel('incomeType', income.incomeType) || `Inkomst ${index + 1}`,
                cellText(kr(income.amount)),
                cellText(faLabel('person', income.recipient)),
              ])}
            />
          : null}
          {pendingBenefits.length > 0 ?
            <TableBox
              title="Väntande ersättningar"
              columns={['Ersättning', 'Sökt av']}
              rows={pendingBenefits.map((benefit, index) => [
                benefit.benefitName ?? `Ersättning ${index + 1}`,
                cellText(benefit.applicantName),
              ])}
            />
          : null}
          {assets.length > 0 ?
            <TableBox
              title="Tillgångar"
              columns={['Typ av tillgång', 'Värde / beskrivning']}
              rows={assets.map((asset, index) => [
                faLabel('assetCategory', asset.assetCategory) || `Tillgång ${index + 1}`,
                cellText(assetValue(asset)),
              ])}
            />
          : null}
        </ApplicationAccordion>
      : null}

      {plannings.length > 0 || jobApplications.length > 0 || plannedActivities.length > 0 ?
        <ApplicationAccordion title="Planering">
          {plannings.map((planning, index) => (
            <AnswerBox
              key={`planning-${index}`}
              title={faLabel('person', planning.person) || `Planering ${index + 1}`}
              items={[
                { label: 'Planering', value: faLabel('planningType', planning.planningType) },
                { label: 'Sjukskrivning', value: sickLeaveSummary(planning) },
              ]}
            />
          ))}
          {jobApplications.length > 0 ?
            <TableBox
              title="Sökta jobb"
              columns={['Tjänst', 'Arbetsgivare och ort', 'Ansökningsdatum']}
              rows={jobApplications.map((job, index) => [
                job.jobTitle ?? `Sökt jobb ${index + 1}`,
                cellText(job.employerAndPlace),
                cellText(job.applicationDate),
              ])}
            />
          : null}
          {plannedActivities.length > 0 ?
            <TableBox
              title="Aktiviteter"
              columns={['Aktivitet', 'Från', 'Till']}
              rows={plannedActivities.map((activity, index) => [
                activity.activity ?? `Aktivitet ${index + 1}`,
                cellText(activity.periodFrom),
                cellText(activity.periodTo),
              ])}
            />
          : null}
        </ApplicationAccordion>
      : null}

      {persons.length > 0 ?
        <ApplicationAccordion title="Utbetalning och kontaktuppgifter">
          <ContentBox>
            {persons.map((person, index) => (
              <PersonCard
                key={`person-${index}`}
                name={faLabel('person', person.role) || `Person ${index + 1}`}
                detailColumns={[
                  [
                    faLabel('paymentMethod', person.paymentMethod),
                    [person.clearingNumber, person.accountNumber].filter(Boolean).join(' '),
                  ],
                  [person.email, person.phone],
                ]}
              />
            ))}
          </ContentBox>
        </ApplicationAccordion>
      : null}

      {stayItems.some(hasAnswer) ?
        <ApplicationAccordion title="Vistelse och försäkran">
          <AnswerBox items={stayItems} />
        </ApplicationAccordion>
      : null}
    </>
  );
};

/**
 * Ansökan utan form-snapshot — intressenterna och jobbstimulansen från Lifecare högst upp (skrivskyddat),
 * därefter de uppgifter medborgaren skickade in (FinancialAssistanceData), varje grupp som ett dragspel.
 */
export const ErrandApplicationData: FC<{ errand: Errand }> = ({ errand }) => {
  const [data, setData] = useState<FinancialAssistanceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void getApplicationData(errand.id ?? '').then((res) => {
      if (!active) return;
      setData(res.error ? null : (res.data ?? null));
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [errand.id]);

  return (
    <div className="flex flex-col gap-24">
      <ApplicationAccordion title="Personuppgifter">
        <ErrandStakeholders errandId={errand.id ?? ''} />
      </ApplicationAccordion>

      <ApplicationAccordion title="Jobbstimulans">
        <ErrandJobStimulus errandId={errand.id ?? ''} />
      </ApplicationAccordion>

      {isLoading ?
        <Spinner size={3} />
      : data ?
        <ApplicationSections data={data} />
      : <p className="m-0">Inga inskickade uppgifter att visa för det här ärendet.</p>}
    </div>
  );
};
