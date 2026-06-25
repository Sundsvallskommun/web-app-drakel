'use client';

import { useErrandBeslut } from '@hooks/use-errand-beslut';
import { useErrandNormberakning } from '@hooks/use-errand-normberakning';
import { createBeslut } from '@services/beslut-service';
import { getDocumentTemplateContent } from '@services/document-template-service';
import { Button, FormControl, FormLabel, Input, Select, Spinner, Tabs } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { resolveBeslutAmount, resolveBeslutPeriod } from '@utils/beslut';
import { formatAmount } from '@utils/format-amount';
import dayjs from 'dayjs';
import { FC, useEffect, useMemo, useState } from 'react';

import { BeslutMeddelande } from './beslut-meddelande.component';
import { LockedBanner, LockFieldset } from './lockable-section.component';

const todayDate = (): string => dayjs().format('YYYY-MM-DD');

const EMPTY_MESSAGE: TextEditorValue = { markup: '', plainText: '' };

// The fullföljdshänvisning (appeal instructions) lives in the Templating service; it's appended to the
// beslutsmeddelande when the handläggare ticks the box.
const FULLFOLJD_TEMPLATE_IDENTIFIER = 'drakel.fa.beslut.fullfoljdshanvisning';

/**
 * "Beslut" tab — the Nytt beslut form (mirroring Lifecare's BESLUT / BESLUTSMEDDELANDE view). Datum,
 * Beslut and Från/Till are prefilled from the automated recommendation (falling back to today and the
 * normberäkning month); Belopp is 0 for an avslag, otherwise the recommended amount. Beslutsfattare and
 * Tjänst are intentionally omitted.
 */
export const ErrandBeslut: FC<{ errandId: string; locked?: boolean }> = ({ errandId, locked = false }) => {
  const { draft, isLoading: draftLoading } = useErrandNormberakning(errandId);
  const { options, recommendation, isLoading: beslutLoading, refresh } = useErrandBeslut(errandId);

  const period = useMemo(() => resolveBeslutPeriod(recommendation, draft), [recommendation, draft]);

  const [date, setDate] = useState<string>(todayDate);
  const [beslutCode, setBeslutCode] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(period.fromDate);
  const [toDate, setToDate] = useState<string>(period.toDate);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>();
  const [saved, setSaved] = useState<boolean>(false);
  // The beslutsmeddelande (composed on the second sub-tab) is saved as the decision's decisionMessage.
  const [messageValue, setMessageValue] = useState<TextEditorValue>(EMPTY_MESSAGE);
  const [addFullfoljd, setAddFullfoljd] = useState<boolean>(true);

  // Prefill from the recommendation (and resolved period) once they load.
  useEffect(() => {
    setDate(recommendation?.decisionDate ?? todayDate());
    setBeslutCode(recommendation?.value ?? '');
  }, [recommendation]);
  useEffect(() => {
    setFromDate(period.fromDate);
    setToDate(period.toDate);
  }, [period.fromDate, period.toDate]);

  const selectedOption = options.find((option) => option.code === beslutCode);
  const recommendedOption = options.find((option) => option.code === recommendation?.value);
  const amount = resolveBeslutAmount(selectedOption, recommendation?.amount);

  const recommendationLabel =
    recommendedOption?.displayName ??
    recommendation?.value ??
    '— (ingen rekommendation från normberäkningen ännu)';

  const resetForm = (): void => {
    setDate(recommendation?.decisionDate ?? todayDate());
    setBeslutCode(recommendation?.value ?? '');
    setFromDate(period.fromDate);
    setToDate(period.toDate);
    setSaveError(undefined);
    setSaved(false);
  };

  // The decision message is the composed beslutsmeddelande, with the fullföljdshänvisning (fetched from
  // Templating) appended at the end when the handläggare ticked the box.
  const buildDecisionMessage = async (): Promise<string | undefined> => {
    let message = messageValue.markup?.trim() ?? '';
    if (addFullfoljd) {
      const res = await getDocumentTemplateContent(FULLFOLJD_TEMPLATE_IDENTIFIER);
      if (!res.error && res.data) {
        message = message ? `${message}<p><br></p>${res.data}` : res.data;
      }
    }
    return message.length > 0 ? message : undefined;
  };

  const save = async (): Promise<void> => {
    setSaving(true);
    setSaveError(undefined);
    setSaved(false);
    const decisionMessage = await buildDecisionMessage();
    const result = await createBeslut(errandId, {
      value: beslutCode,
      amount: amount ?? 0,
      decisionDate: date,
      periodFrom: fromDate,
      periodTo: toDate,
      decisionMessage,
    });
    setSaving(false);
    if (result.error) {
      setSaveError('Det gick inte att spara beslutet');
      return;
    }
    setSaved(true);
    refresh();
  };

  if (draftLoading || beslutLoading) {
    return (
      <div className="flex justify-center my-32">
        <Spinner size={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-24">
      <h2 className="text-h3-sm md:text-h3-md m-0">Nytt beslut</h2>

      {locked ? <LockedBanner /> : null}

      <Tabs size="sm">
        <Tabs.Item>
          <Tabs.Button>Beslut</Tabs.Button>
          <Tabs.Content>
            <LockFieldset locked={locked}>
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
                      <Select.Option key={option.code} value={option.code ?? ''}>
                        {option.displayName ?? option.code}
                      </Select.Option>
                    ))}
                  </Select>
                  <span className="text-small text-dark-secondary mt-4">
                    Rekommenderat beslut: {recommendationLabel}
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
                  {/* Avslag ⇒ 0; annars beloppet från normberäkningen (rekommendationen). */}
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

              {saveError && <p className="text-error-surface-primary m-0">{saveError}</p>}
              {saved && <p className="text-dark-secondary m-0">Beslutet sparades.</p>}

              <div className="flex gap-16">
                <Button variant="secondary" onClick={resetForm}>
                  Avbryt
                </Button>
                <Button
                  color="vattjom"
                  variant="primary"
                  disabled={!beslutCode || saving}
                  loading={saving}
                  loadingText="Sparar…"
                  onClick={() => void save()}
                >
                  Spara
                </Button>
              </div>
            </div>
            </LockFieldset>
          </Tabs.Content>
        </Tabs.Item>

        <Tabs.Item>
          <Tabs.Button>Beslutsmeddelande</Tabs.Button>
          <Tabs.Content>
            <LockFieldset locked={locked}>
              <BeslutMeddelande
                errandId={errandId}
                value={messageValue}
                onChange={setMessageValue}
                addFullfoljd={addFullfoljd}
                onAddFullfoljdChange={setAddFullfoljd}
              />
            </LockFieldset>
          </Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </div>
  );
};
