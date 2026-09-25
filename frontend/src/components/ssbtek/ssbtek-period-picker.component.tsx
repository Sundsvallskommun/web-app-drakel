'use client';

import { FormField } from '@components/common/form-field.component';
import { Button, Select } from '@sk-web-gui/react';
import { formatApplicationMonth } from '@utils/application-month';
import { recentMonths, SsbtekMonths } from '@utils/ssbtek-period';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** How far back the handläggare can look: two years of months. */
const MONTHS_TO_PICK_FROM = 24;

/**
 * The months the SSBTEK lookup covers — från månad and till månad — picked as the utbetalning form picks its month.
 * The lookup is made again only when the handläggare asks for it (Hämta), since each is a live SSBTEK read.
 */
export const SsbtekPeriodPicker: FC<{ months: SsbtekMonths; onSearch: (months: SsbtekMonths) => void }> = ({
  months,
  onSearch,
}) => {
  const { t, i18n } = useTranslation('ssbtek');
  const [picked, setPicked] = useState<SsbtekMonths>(months);
  const choices = recentMonths(MONTHS_TO_PICK_FROM);

  const monthOptions = choices.map((month) => (
    <Select.Option key={month} value={month}>
      {formatApplicationMonth(`${month}-01`, i18n.language)}
    </Select.Option>
  ));

  return (
    <form
      className="flex flex-wrap items-end gap-16"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(picked);
      }}
    >
      <FormField label={t('periodPicker.from')} className="w-auto">
        <Select
          size="sm"
          value={picked.fromMonth}
          onChange={(event) => {
            setPicked({ ...picked, fromMonth: event.target.value });
          }}
        >
          {monthOptions}
        </Select>
      </FormField>
      <FormField label={t('periodPicker.to')} className="w-auto">
        <Select
          size="sm"
          value={picked.toMonth}
          onChange={(event) => {
            setPicked({ ...picked, toMonth: event.target.value });
          }}
        >
          {monthOptions}
        </Select>
      </FormField>
      <Button type="submit" size="sm" variant="secondary">
        {t('periodPicker.search')}
      </Button>
    </form>
  );
};
