'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { ErrandForm } from '@hooks/use-errand-form';
import { Disclosure } from '@sk-web-gui/react';
import { Users } from 'lucide-react';
import { FC } from 'react';

import { ErrandBasics } from './errand-basics.component';
import { ErrandStakeholders } from './errand-stakeholders.component';

interface ErrandBasicsTabProps {
  errand: Errand;
  form: ErrandForm;
  setField: (key: keyof ErrandForm, value: string) => void;
}

// The "Grundinformation" tab: heading, the editable "Om ärendet" form, and the errand's
// stakeholders — all in one tab, mirroring draken (stakeholders are not a separate tab).
export const ErrandBasicsTab: FC<ErrandBasicsTabProps> = ({ errand, form, setField }) => (
  <div className="pt-24 pb-40 px-24 md:px-40 flex flex-col gap-24">
    <div className="flex flex-col gap-8">
      <h2 className="text-h2-sm md:text-h2-md m-0">Grundinformation</h2>
      <span>Fyll i följande uppgifter för att säkerställa att vi har all nödvändig information om ärendet.</span>
    </div>

    <ErrandBasics form={form} setField={setField} />

    <Disclosure variant="alt" initalOpen>
      <Disclosure.Header>
        <Disclosure.Icon icon={<Users />} />
        <Disclosure.Title>Ärendeägare</Disclosure.Title>
        <Disclosure.Button />
      </Disclosure.Header>
      <Disclosure.Content>
        <ErrandStakeholders errandId={errand.id ?? ''} />
      </Disclosure.Content>
    </Disclosure>
  </div>
);
