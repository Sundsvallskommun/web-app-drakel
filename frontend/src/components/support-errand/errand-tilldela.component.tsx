'use client';

import { Button, FormControl, FormLabel, Modal, Select } from '@sk-web-gui/react';
import { FC, useState } from 'react';

interface AssigneeOption {
  value: string;
  label: string;
}

/**
 * "Tilldela" action for the administration bar: picks a handläggare in a dialog. The choice only updates
 * the errand form — it's persisted by the central "Spara" button like the other handläggning fields.
 */
export const ErrandTilldela: FC<{
  assignedUserId: string;
  options: AssigneeOption[];
  onAssign: (username: string) => void;
}> = ({ assignedUserId, options, onAssign }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<string>(assignedUserId);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          setSelected(assignedUserId);
          setOpen(true);
        }}
      >
        Tilldela
      </Button>

      <Modal
        show={open}
        onClose={() => {
          setOpen(false);
        }}
        label="Tilldela ärende"
      >
        <Modal.Content>
          <FormControl id="assignee" className="w-full">
            <FormLabel>Handläggare</FormLabel>
            <Select
              className="w-full"
              value={selected}
              onChange={(event) => {
                setSelected(event.target.value);
              }}
            >
              {!selected && (
                <Select.Option value="" disabled>
                  Välj handläggare
                </Select.Option>
              )}
              {options.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
        </Modal.Content>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setOpen(false);
            }}
          >
            Avbryt
          </Button>
          <Button
            color="vattjom"
            variant="primary"
            disabled={!selected}
            onClick={() => {
              onAssign(selected);
              setOpen(false);
            }}
          >
            Tilldela
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
