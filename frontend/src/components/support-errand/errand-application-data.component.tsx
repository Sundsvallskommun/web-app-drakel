'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { Errand } from '@data-contracts/backend/data-contracts';
import {
  faLabel,
  faPersonLabel,
  FinancialAssistanceData,
  formatPeriodMonth,
  SubmittedChild,
} from '@interfaces/financial-assistance';
import { getApplicationData } from '@services/errand-service/errand-service';
import { formatDateRange } from '@utils/date-range';
import type { TFunction } from 'i18next';
import {
  Banknote,
  BriefcaseBusiness,
  CalendarCheck,
  FileCheck,
  FileText,
  House,
  type LucideIcon,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react';
import { FC, ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
const yesNo = (t: TFunction, value?: boolean): string | undefined =>
  value == null ? undefined
  : value ? t('common:yes')
  : t('common:no');
/** A table cell's text, with a dash for missing values. */
const cellText = (value?: string | number): string => (value === undefined || value === '' ? '—' : String(value));
/** "100 % · 2026-09-01 – 2026-09-30" — the sick-leave level and the medical certificate's period. */
const sickLeaveSummary = (planning: SubmittedPlanning, t: TFunction): string | undefined => {
  const level = planning.sickLeaveLevel ? `${planning.sickLeaveLevel} %` : undefined;
  const period = planning.sickLeaveFrom ? formatDateRange(planning.sickLeaveFrom, planning.sickLeaveTo, t) : undefined;
  return [level, period].filter(Boolean).join(' · ') || undefined;
};
const childName = (child: SubmittedChild): string =>
  child.name?.trim() ?? [child.firstName, child.lastName].filter(Boolean).join(' ').trim();

const assetValue = (t: TFunction, asset: SubmittedAsset): string | undefined => {
  const fromValue = kr(asset.value);
  if (fromValue) return fromValue;
  const rest = [
    asset.description,
    faLabel(t, 'vehicleType', asset.vehicleType),
    faLabel(t, 'propertyType', asset.propertyType),
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

/**
 * One application data group as an open accordion whose grey boxes are stacked below each other. The icon is
 * given explicitly since the (translated) title can't be matched against the Swedish section keywords.
 */
const ApplicationAccordion: FC<{ title: string; icon: LucideIcon; children: ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <SectionAccordion title={title} icon={icon} initialOpen>
    <div className="flex flex-col gap-40">{children}</div>
  </SectionAccordion>
);

/** The submitted application data (FinancialAssistanceData), grouped into read-only accordions. */
const ApplicationSections: FC<{ data: FinancialAssistanceData }> = ({ data }) => {
  const { t, i18n } = useTranslation('application');
  const period =
    formatPeriodMonth(data.periodMonth, data.periodYear, i18n.language) ||
    faLabel(t, 'periodChoice', data.periodChoice) ||
    undefined;

  const applicationItems: AnswerItem[] = [
    { label: t('data.application.applicationType'), value: faLabel(t, 'applicationType', data.applicationType) },
    { label: t('data.application.maritalStatus'), value: faLabel(t, 'maritalStatus', data.maritalStatus) },
    { label: t('data.application.period'), value: period },
    { label: t('data.application.normType'), value: faLabel(t, 'normType', data.normType) },
    { label: t('data.application.otherBenefit'), value: data.otherBenefitDescription },
  ];
  const housingItems: AnswerItem[] = [
    { label: t('data.housing.hasChildrenUnder21'), value: yesNo(t, data.hasChildrenUnder21) },
    { label: t('data.housing.housingForm'), value: faLabel(t, 'housingForm', data.housingForm) },
    { label: t('data.housing.personCount'), value: data.housingPersonCount },
    { label: t('data.housing.roomsPlusKitchen'), value: data.housingRoomsPlusKitchen },
    { label: t('data.housing.description'), value: data.housingDescription },
  ];
  const stayItems: AnswerItem[] = [
    { label: t('data.stay.staysInMunicipality'), value: yesNo(t, data.staysInMunicipality) },
    { label: t('data.stay.description'), value: data.stayDescription },
    { label: t('data.stay.attestation'), value: yesNo(t, data.attestation) },
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
        <ApplicationAccordion title={t('data.sections.application')} icon={FileText}>
          <AnswerBox items={applicationItems} />
        </ApplicationAccordion>
      : null}

      {housingItems.some(hasAnswer) || children.length > 0 ?
        <ApplicationAccordion title={t('data.sections.householdAndHousing')} icon={House}>
          <AnswerBox items={housingItems} />
          {children.length > 0 ?
            <ContentBox title={t('data.children.title')}>
              {children.map((child, index) => (
                <PersonCard
                  key={`child-${index}`}
                  name={childName(child) || t('data.children.fallbackName', { number: index + 1 })}
                  detailColumns={[[child.schoolName]]}
                />
              ))}
            </ContentBox>
          : null}
        </ApplicationAccordion>
      : null}

      {costs.length > 0 ?
        <ApplicationAccordion title={t('data.sections.costs')} icon={Receipt}>
          <TableBox
            title={t('data.costs.title')}
            columns={[
              t('data.costs.columns.type'),
              t('data.costs.columns.amount'),
              t('data.costs.columns.specification'),
            ]}
            rows={costs.map((cost, index) => [
              cost.costType === 'OTHER' && cost.otherSubType ?
                `${faLabel(t, 'costType', cost.costType)} – ${faLabel(t, 'costOtherSubType', cost.otherSubType)}`
              : faLabel(t, 'costType', cost.costType) || t('data.costs.fallbackName', { number: index + 1 }),
              cellText(kr(cost.appliedAmount)),
              cellText(cost.specification),
            ])}
          />
        </ApplicationAccordion>
      : null}

      {incomes.length > 0 || pendingBenefits.length > 0 || assets.length > 0 ?
        <ApplicationAccordion title={t('data.sections.incomesAndAssets')} icon={Wallet}>
          {incomes.length > 0 ?
            <TableBox
              title={t('data.incomes.title')}
              columns={[
                t('data.incomes.columns.type'),
                t('data.incomes.columns.amount'),
                t('data.incomes.columns.recipient'),
              ]}
              rows={incomes.map((income, index) => [
                faLabel(t, 'incomeType', income.incomeType) || t('data.incomes.fallbackName', { number: index + 1 }),
                cellText(kr(income.amount)),
                cellText(faPersonLabel(t, income.recipient)),
              ])}
            />
          : null}
          {pendingBenefits.length > 0 ?
            <TableBox
              title={t('data.pendingBenefits.title')}
              columns={[t('data.pendingBenefits.columns.benefit'), t('data.pendingBenefits.columns.appliedBy')]}
              rows={pendingBenefits.map((benefit, index) => [
                benefit.benefitName ?? t('data.pendingBenefits.fallbackName', { number: index + 1 }),
                cellText(benefit.applicantName),
              ])}
            />
          : null}
          {assets.length > 0 ?
            <TableBox
              title={t('data.assets.title')}
              columns={[t('data.assets.columns.type'), t('data.assets.columns.valueOrDescription')]}
              rows={assets.map((asset, index) => [
                faLabel(t, 'assetCategory', asset.assetCategory) ||
                  t('data.assets.fallbackName', { number: index + 1 }),
                cellText(assetValue(t, asset)),
              ])}
            />
          : null}
        </ApplicationAccordion>
      : null}

      {plannings.length > 0 || jobApplications.length > 0 || plannedActivities.length > 0 ?
        <ApplicationAccordion title={t('data.sections.planning')} icon={CalendarCheck}>
          {plannings.map((planning, index) => (
            <AnswerBox
              key={`planning-${index}`}
              title={faPersonLabel(t, planning.person) || t('data.plannings.fallbackTitle', { number: index + 1 })}
              items={[
                { label: t('data.plannings.planning'), value: faLabel(t, 'planningType', planning.planningType) },
                { label: t('data.plannings.sickLeave'), value: sickLeaveSummary(planning, t) },
              ]}
            />
          ))}
          {jobApplications.length > 0 ?
            <TableBox
              title={t('data.jobApplications.title')}
              columns={[
                t('data.jobApplications.columns.jobTitle'),
                t('data.jobApplications.columns.employerAndPlace'),
                t('data.jobApplications.columns.applicationDate'),
              ]}
              rows={jobApplications.map((job, index) => [
                job.jobTitle ?? t('data.jobApplications.fallbackName', { number: index + 1 }),
                cellText(job.employerAndPlace),
                cellText(job.applicationDate),
              ])}
            />
          : null}
          {plannedActivities.length > 0 ?
            <TableBox
              title={t('data.activities.title')}
              columns={[
                t('data.activities.columns.activity'),
                t('data.activities.columns.from'),
                t('data.activities.columns.to'),
              ]}
              rows={plannedActivities.map((activity, index) => [
                activity.activity ?? t('data.activities.fallbackName', { number: index + 1 }),
                cellText(activity.periodFrom),
                cellText(activity.periodTo),
              ])}
            />
          : null}
        </ApplicationAccordion>
      : null}

      {persons.length > 0 ?
        <ApplicationAccordion title={t('data.sections.paymentAndContact')} icon={Banknote}>
          <ContentBox>
            {persons.map((person, index) => (
              <PersonCard
                key={`person-${index}`}
                name={faPersonLabel(t, person.role) || t('data.persons.fallbackName', { number: index + 1 })}
                detailColumns={[
                  [
                    faLabel(t, 'paymentMethod', person.paymentMethod),
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
        <ApplicationAccordion title={t('data.sections.stayAndAttestation')} icon={FileCheck}>
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
  const { t } = useTranslation('application');
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
      <ApplicationAccordion title={t('data.sections.personalDetails')} icon={Users}>
        <ErrandStakeholders errandId={errand.id ?? ''} />
      </ApplicationAccordion>

      <ApplicationAccordion title={t('data.sections.jobStimulus')} icon={BriefcaseBusiness}>
        <ErrandJobStimulus errandId={errand.id ?? ''} />
      </ApplicationAccordion>

      <AsyncContent isLoading={isLoading} errorText="" isEmpty={!data} emptyText={t('data.emptyText')}>
        {data ?
          <ApplicationSections data={data} />
        : null}
      </AsyncContent>
    </div>
  );
};
