'use client';

import { DatePicker, FormControl, FormLabel, Input, Textarea } from '@sk-web-gui/react';
import { FC } from 'react';

/** The editable fields shared by the create and edit dokument modals. */
export interface DocumentFieldValues {
  heading: string;
  documentDate: string;
  documentTime: string;
  text: string;
}

/** Rubrik / Datum / Tid / Text inputs for a dokument, controlled by the parent modal. */
export const DocumentFields: FC<{
  value: DocumentFieldValues;
  idPrefix: string;
  onChange: (patch: Partial<DocumentFieldValues>) => void;
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
          value={value.documentDate}
          onChange={(event) => {
            onChange({ documentDate: event.target.value });
          }}
        />
      </FormControl>
      <FormControl id={`${idPrefix}-time`} className="w-full">
        <FormLabel>Tid</FormLabel>
        <DatePicker
          type="time"
          value={value.documentTime}
          onChange={(event) => {
            onChange({ documentTime: event.target.value });
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
