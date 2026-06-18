'use client';

import { useErrandNormberakning } from '@hooks/use-errand-normberakning';
import { Button, FormControl, FormLabel, Input, Select, Spinner, Tabs } from '@sk-web-gui/react';
import {
  BeslutOption,
  PLACEHOLDER_BESLUT_OPTIONS,
  resolveBeslutAmount,
  resolveBeslutPeriod,
} from '@utils/beslut';
import { formatAmount } from '@utils/format-amount';
import dayjs from 'dayjs';
import { FC, useEffect, useMemo, useState } from 'react';

const todayDate = (): string => dayjs().format('YYYY-MM-DD');

/**
 * "Beslut" tab — the foundation of the Nytt beslut form (mirroring Lifecare's BESLUT /
 * BESLUTSMEDDELANDE view). Datum is prefilled with today and Från/Till with the application month from
 * the normberäkning. Beslutsfattare and Tjänst are intentionally omitted.
 *
 * Several data sources are not exposed by caremanagement yet and are stubbed behind TODO(api) seams:
 * the beslut alternatives, the recommended beslut/amount from the normberäkning, and saving the beslut.
 */
export const ErrandBeslut: FC<{ errandId: string }> = ({ errandId }) => {
  const { draft, isLoading } = useErrandNormberakning(errandId);

  // TODO(api): beslut alternatives should come from caremanagement; no decisions/lookup endpoint
  // exists yet (see @utils/beslut). Placeholder list keeps the foundation functional.
  const options = PLACEHOLDER_BESLUT_OPTIONS;

  // TODO(api): the recommended beslut and its amount come from the normberäkning result
  // (Decision RECOMMENDATION), which caremanagement does not expose yet. Modelled as getters so the
  // wiring point is explicit; both return undefined until the endpoint lands.
  const getRecommendedOption = (): BeslutOption | undefined => undefined;
  const getRecommendedAmount = (): number | undefined => undefined;
  const recommendedOption = getRecommendedOption();
  const recommendedAmount = getRecommendedAmount();

  const period = useMemo(() => resolveBeslutPeriod(draft), [draft]);

  const [date, setDate] = useState<string>(todayDate);
  const [beslutCode, setBeslutCode] = useState<string>(recommendedOption?.code ?? '');
  const [fromDate, setFromDate] = useState<string>(period.fromDate);
  const [toDate, setToDate] = useState<string>(period.toDate);

  // Prefill Från/Till once the period resolves from the (async) normberäkning draft.
  useEffect(() => {
    setFromDate(period.fromDate);
    setToDate(period.toDate);
  }, [period.fromDate, period.toDate]);

  const selectedOption = options.find((option) => option.code === beslutCode) ?? recommendedOption;
  const amount = resolveBeslutAmount(selectedOption, recommendedAmount);

  const resetForm = (): void => {
    setDate(todayDate());
    setBeslutCode(recommendedOption?.code ?? '');
    setFromDate(period.fromDate);
    setToDate(period.toDate);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-32">
        <Spinner size={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-24">
      <h2 className="text-h3-sm md:text-h3-md m-0">Nytt beslut</h2>

      <Tabs size="sm">
        <Tabs.Item>
          <Tabs.Button>Beslut</Tabs.Button>
          <Tabs.Content>
            <div className="pt-24 flex flex-col gap-24 max-w-[48rem]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <FormControl id="beslut-datum" className="w-full">
                  <FormLabel>Datum *</FormLabel>
                  <Input
                    type="date"
                    size="sm"
                    value={date}
                    onChange={(event) => {
                      setDate(event.target.value);
                    }}
                  />
                </FormControl>

                <FormControl id="beslut-typ" className="w-full">
                  <FormLabel>Beslut *</FormLabel>
                  <Select
                    className="w-full"
                    size="sm"
                    value={beslutCode}
                    onChange={(event) => {
                      setBeslutCode(event.target.value);
                    }}
                  >
                    <Select.Option value="">Välj beslut</Select.Option>
                    {options.map((option) => (
                      <Select.Option key={option.code} value={option.code}>
                        {option.label}
                      </Select.Option>
                    ))}
                  </Select>
                  <span className="text-small text-dark-secondary mt-4">
                    Rekommenderat beslut: {recommendedOption?.label ?? '— (hämtas från normberäkningen)'}
                  </span>
                </FormControl>

                <FormControl id="beslut-orsak" className="w-full">
                  <FormLabel>Orsak</FormLabel>
                  {/* TODO(api): orsak left empty until the reason catalog is wired. */}
                  <Select className="w-full" size="sm" value="" disabled>
                    <Select.Option value="">—</Select.Option>
                  </Select>
                </FormControl>

                <FormControl id="beslut-belopp" className="w-full">
                  <FormLabel>Belopp</FormLabel>
                  {/* Avslag ⇒ 0; annars beloppet från normberäkningen (TODO(api): ej exponerat ännu). */}
                  <Input readOnly size="sm" value={formatAmount(amount ?? 0)} />
                </FormControl>

                <FormControl id="beslut-fran" className="w-full">
                  <FormLabel>Från</FormLabel>
                  <Input
                    type="date"
                    size="sm"
                    value={fromDate}
                    onChange={(event) => {
                      setFromDate(event.target.value);
                    }}
                  />
                </FormControl>

                <FormControl id="beslut-till" className="w-full">
                  <FormLabel>Till</FormLabel>
                  <Input
                    type="date"
                    size="sm"
                    value={toDate}
                    onChange={(event) => {
                      setToDate(event.target.value);
                    }}
                  />
                </FormControl>
              </div>

              <div className="flex gap-16">
                <Button variant="secondary" onClick={resetForm}>
                  Avbryt
                </Button>
                {/* TODO(api): no create-decision endpoint in the BFF yet (decisions are set aside). */}
                <Button color="vattjom" variant="primary" disabled>
                  Spara
                </Button>
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Item>

        <Tabs.Item>
          <Tabs.Button>Beslutsmeddelande</Tabs.Button>
          <Tabs.Content>
            <p className="pt-24 my-0 text-dark-secondary">Beslutsmeddelande tillkommer senare.</p>
          </Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </div>
  );
};
