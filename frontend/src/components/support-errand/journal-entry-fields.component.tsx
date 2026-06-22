'use client';

import { DatePicker, FormControl, FormLabel, Input, Textarea } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { FC } from 'react';

export const todayDate = (): string => dayjs().format('YYYY-MM-DD');

/** The editable fields shared by the create and edit journalanteckning modals. */
export interface JournalEntryFieldValues {
  heading: string;
  entryDate: string;
  entryTime: string;
  text: string;
}

/** Rubrik / Datum / Tid / Text inputs for a journalanteckning, controlled by the parent modal. */
export const JournalEntryFields: FC<{
  value: JournalEntryFieldValues;
  idPrefix: string;
  onChange: (patch: Partial<JournalEntryFieldValues>) => void;
}> = ({ value, idPrefix, onChange }) => (
  <>
    <FormControl id={`${idPrefix}-heading`} className="w-full">
      <FormLabel>Rubrik *</FormLabel>
      <Input
        value={value.heading}
        onChange={(event) => {
          onChange({ heading: event.target.value });
        }}
      />
    </FormControl>
    <div className="grid grid-cols-2 gap-12">
      <FormControl id={`${idPrefix}-date`} className="w-full">
        <FormLabel>Datum *</FormLabel>
        <DatePicker
          type="date"
          value={value.entryDate}
          onChange={(event) => {
            onChange({ entryDate: event.target.value });
          }}
        />
      </FormControl>
      <FormControl id={`${idPrefix}-time`} className="w-full">
        <FormLabel>Tid</FormLabel>
        <DatePicker
          type="time"
          value={value.entryTime}
          onChange={(event) => {
            onChange({ entryTime: event.target.value });
          }}
        />
      </FormControl>
    </div>
    <FormControl id={`${idPrefix}-text`} className="w-full">
      <FormLabel>Text</FormLabel>
      <Textarea
        rows={4}
        value={value.text}
        onChange={(event) => {
          onChange({ text: event.target.value });
        }}
      />
    </FormControl>
  </>
);
