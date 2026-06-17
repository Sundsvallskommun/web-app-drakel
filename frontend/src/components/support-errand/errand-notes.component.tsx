'use client';

import { createNote, deleteNote, Note, updateNote } from '@services/note-service';
import { Avatar, Button, Divider, FormControl, Modal, Spinner, Textarea } from '@sk-web-gui/react';
import { prettyTime } from '@utils/pretty-time';
import { Pencil, Trash } from 'lucide-react';
import { FC, useState } from 'react';

const initials = (author?: string): string => (author ? author.trim().charAt(0).toUpperCase() : '?');

interface ErrandNotesProps {
  errandId: string;
  notes: Note[];
  isLoading: boolean;
  loadError: boolean;
  refresh: () => void;
}

export const ErrandNotes: FC<ErrandNotesProps> = ({ errandId, notes, isLoading, loadError, refresh }) => {
  const [error, setError] = useState<string>();
  const [text, setText] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [editNote, setEditNote] = useState<Note>();
  const [editText, setEditText] = useState<string>('');

  const add = async () => {
    const body = text.trim();
    if (!body) return;
    setSaving(true);
    setError(undefined);
    const res = await createNote(errandId, body);
    setSaving(false);
    if (res.error) {
      setError('Det gick inte att spara anteckningen');
      return;
    }
    setText('');
    refresh();
  };

  const saveEdit = async () => {
    if (!editNote?.id) return;
    const body = editText.trim();
    if (!body) return;
    const res = await updateNote(errandId, editNote.id, body);
    if (res.error) {
      setError('Det gick inte att uppdatera anteckningen');
      return;
    }
    setEditNote(undefined);
    refresh();
  };

  const remove = async (note: Note) => {
    if (!note.id) return;
    const res = await deleteNote(errandId, note.id);
    if (res.error) {
      setError('Det gick inte att ta bort anteckningen');
      return;
    }
    refresh();
  };

  return (
    <div className="flex flex-col gap-16 h-full">
      <span className="text-large font-semibold">Anteckningar</span>

      {(error ?? loadError) && (
        <p className="text-error-surface-primary m-0">{error ?? 'Det gick inte att hämta anteckningarna'}</p>
      )}

      {isLoading ?
        <Spinner size={3} />
      : notes.length === 0 ?
        <p className="m-0 text-dark-secondary">Det finns inga anteckningar.</p>
      : <div className="flex flex-col" data-cy="notes-wrapper">
          {notes.map((note, index) => (
            <div key={note.id ?? index}>
              <div className="py-12 flex justify-between gap-12" data-cy={`note-${index}`}>
                <div className="flex gap-12 min-w-0">
                  <Avatar rounded color="juniskar" size="sm" title={note.author} initials={initials(note.author)} />
                  <div className="min-w-0">
                    <p className="my-0 break-words whitespace-pre-wrap" data-cy="note-text">
                      {note.body}
                    </p>
                    <p className="my-0 text-small text-dark-secondary">
                      {note.author ? `${note.author} · ` : ''}
                      {prettyTime(note.modified ?? note.created)}
                      {note.modified ? ' (redigerad)' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 shrink-0">
                  <Button
                    size="sm"
                    variant="tertiary"
                    iconButton
                    aria-label="Ändra anteckning"
                    onClick={() => {
                      setEditNote(note);
                      setEditText(note.body ?? '');
                    }}
                    leftIcon={<Pencil />}
                  />
                  <Button
                    size="sm"
                    variant="tertiary"
                    iconButton
                    aria-label="Ta bort anteckning"
                    onClick={() => void remove(note)}
                    leftIcon={<Trash />}
                  />
                </div>
              </div>
              <Divider />
            </div>
          ))}
        </div>
      }

      <div className="w-full mt-auto flex flex-col items-start gap-12">
        <FormControl id="new-note" className="w-full">
          <Textarea
            className="w-full"
            rows={4}
            placeholder="Ny anteckning"
            aria-label="Ny anteckning"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
            }}
            data-cy="note-input"
          />
        </FormControl>
        <Button
          color="primary"
          size="sm"
          loading={saving}
          loadingText="Sparar"
          disabled={!errandId || text.trim() === ''}
          onClick={() => void add()}
          data-cy="save-note-button"
        >
          Spara
        </Button>
      </div>

      <Modal
        show={!!editNote}
        className="w-[43rem]"
        onClose={() => {
          setEditNote(undefined);
        }}
        label="Ändra anteckning"
      >
        <Modal.Content>
          <Textarea
            rows={5}
            className="w-full"
            value={editText}
            onChange={(event) => {
              setEditText(event.target.value);
            }}
            aria-label="Anteckningstext"
          />
        </Modal.Content>
        <Modal.Footer>
          <Button
            className="w-full"
            variant="primary"
            disabled={editText.trim() === ''}
            onClick={() => void saveEdit()}
          >
            Spara
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
