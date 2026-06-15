'use client';

import { ContactChannel } from '@data-contracts/backend/data-contracts';
import { useLookups } from '@hooks/use-lookups';
import { createStakeholder } from '@services/errand-service/errand-service';
import { Button, FormControl, FormLabel, Input, Modal, Select } from '@sk-web-gui/react';
import { FC, FormEvent, useState } from 'react';

interface ErrandStakeholderFormProps {
  errandId: string;
  show: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ErrandStakeholderForm: FC<ErrandStakeholderFormProps> = ({ errandId, show, onClose, onSaved }) => {
  const { lookups: roles } = useLookups('ROLE');
  const [role, setRole] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const reset = () => {
    setRole('');
    setFirstName('');
    setLastName('');
    setOrganizationName('');
    setEmail('');
    setPhone('');
    setError(undefined);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(undefined);

    const contactChannels: ContactChannel[] = [];
    if (email) {
      contactChannels.push({ key: 'EMAIL', value: email });
    }
    if (phone) {
      contactChannels.push({ key: 'PHONE', value: phone });
    }

    const result = await createStakeholder(errandId, {
      role: role || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      organizationName: organizationName || undefined,
      contactChannels: contactChannels.length ? contactChannels : undefined,
    });
    setSaving(false);
    if (result.error) {
      setError('Det gick inte att lägga till intressenten');
      return;
    }
    reset();
    onSaved();
    onClose();
  };

  return (
    <Modal show={show} onClose={close} label="Lägg till intressent" className="w-[42rem]">
      <Modal.Content>
        <form id="stakeholder-form" onSubmit={(event) => void submit(event)} className="flex flex-col gap-16">
          <FormControl id="stakeholder-role" className="w-full">
            <FormLabel>Roll</FormLabel>
            <Select
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
              }}
            >
              <Select.Option value="">Välj roll</Select.Option>
              {roles.map((lookup) => (
                <Select.Option key={lookup.name} value={lookup.name ?? ''}>
                  {lookup.displayName ?? lookup.name}
                </Select.Option>
              ))}
            </Select>
          </FormControl>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <FormControl id="stakeholder-firstname" className="w-full">
              <FormLabel>Förnamn</FormLabel>
              <Input
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                }}
              />
            </FormControl>
            <FormControl id="stakeholder-lastname" className="w-full">
              <FormLabel>Efternamn</FormLabel>
              <Input
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value);
                }}
              />
            </FormControl>
          </div>

          <FormControl id="stakeholder-org" className="w-full">
            <FormLabel>Organisation</FormLabel>
            <Input
              value={organizationName}
              onChange={(event) => {
                setOrganizationName(event.target.value);
              }}
            />
          </FormControl>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <FormControl id="stakeholder-email" className="w-full">
              <FormLabel>E-post</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
              />
            </FormControl>
            <FormControl id="stakeholder-phone" className="w-full">
              <FormLabel>Telefon</FormLabel>
              <Input
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                }}
              />
            </FormControl>
          </div>

          {error && <p className="text-error-surface-primary m-0">{error}</p>}
        </form>
      </Modal.Content>
      <Modal.Footer>
        <Button variant="secondary" onClick={close}>
          Avbryt
        </Button>
        <Button
          type="submit"
          form="stakeholder-form"
          color="vattjom"
          variant="primary"
          loading={saving}
          loadingText="Sparar…"
        >
          Lägg till
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
