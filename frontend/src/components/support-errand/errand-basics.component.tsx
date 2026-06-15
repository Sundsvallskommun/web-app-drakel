'use client';

import { ErrandForm } from '@hooks/use-errand-form';
import { useLookups } from '@hooks/use-lookups';
import { Disclosure, FormControl, FormLabel, Select, Textarea } from '@sk-web-gui/react';
import { Info } from 'lucide-react';
import { FC } from 'react';

interface ErrandBasicsProps {
  form: ErrandForm;
  setField: (key: keyof ErrandForm, value: string) => void;
}

// The editable "Om ärendet" form. Field state is lifted (see useErrandForm); saving happens through
// the single central "Spara ärende" button in the Handläggning sidebar, as in draken.
export const ErrandBasics: FC<ErrandBasicsProps> = ({ form, setField }) => {
  const { lookups: categories } = useLookups('CATEGORY');
  const { lookups: types } = useLookups('TYPE');
  const { lookups: contactReasons } = useLookups('CONTACT_REASON');

  return (
    <Disclosure variant="alt" initalOpen>
      <Disclosure.Header>
        <Disclosure.Icon icon={<Info />} />
        <Disclosure.Title>Om ärendet</Disclosure.Title>
        <Disclosure.Button />
      </Disclosure.Header>
      <Disclosure.Content>
        <div className="flex flex-col gap-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <FormControl id="category" className="w-full">
              <FormLabel>Kategori</FormLabel>
              <Select
                value={form.category}
                onChange={(event) => {
                  setField('category', event.target.value);
                }}
              >
                <Select.Option value="">Välj kategori</Select.Option>
                {categories.map((lookup) => (
                  <Select.Option key={lookup.name} value={lookup.name ?? ''}>
                    {lookup.displayName ?? lookup.name}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>

            <FormControl id="type" className="w-full">
              <FormLabel>Ärendetyp</FormLabel>
              <Select
                value={form.type}
                onChange={(event) => {
                  setField('type', event.target.value);
                }}
              >
                <Select.Option value="">Välj typ</Select.Option>
                {types.map((lookup) => (
                  <Select.Option key={lookup.name} value={lookup.name ?? ''}>
                    {lookup.displayName ?? lookup.name}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
          </div>

          <FormControl id="description" className="w-full">
            <FormLabel>Ärendebeskrivning</FormLabel>
            <Textarea
              rows={5}
              value={form.description}
              onChange={(event) => {
                setField('description', event.target.value);
              }}
            />
          </FormControl>

          <FormControl id="contactReason" className="w-full">
            <FormLabel>Orsak till kontakt</FormLabel>
            <Select
              value={form.contactReason}
              onChange={(event) => {
                setField('contactReason', event.target.value);
              }}
            >
              <Select.Option value="">Välj orsak</Select.Option>
              {contactReasons.map((lookup) => (
                <Select.Option key={lookup.name} value={lookup.name ?? ''}>
                  {lookup.displayName ?? lookup.name}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
        </div>
      </Disclosure.Content>
    </Disclosure>
  );
};
