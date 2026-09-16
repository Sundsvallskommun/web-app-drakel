'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { createNote, deleteNote, Note, updateNote } from '@services/note-service';
import { Avatar, Button, Divider, FormControl, Modal, Textarea } from '@sk-web-gui/react';
import { prettyTime } from '@utils/pretty-time';
import { Pencil, Trash } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

const initials = (author?: string): string => (author ? author.trim().charAt(0).toUpperCase() : '?');

interface ErrandNotesProps {
  errandId: string;
  notes: Note[];
  isLoading: boolean;
  loadError: boolean;
  refresh: () => void;
}

export const ErrandNotes: FC<ErrandNotesProps> = ({ errandId, notes, isLoading, loadError, refresh }) => {
  const { t } = useTranslation('sidebar');
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
      setError(t('notes.saveError'));
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
      setError(t('notes.updateError'));
      return;
    }
    setEditNote(undefined);
    refresh();
  };

  const remove = async (note: Note) => {
    if (!note.id) return;
    const res = await deleteNote(errandId, note.id);
    if (res.error) {
      setError(t('notes.deleteError'));
      return;
    }
    refresh();
  };

  return (
    <div className="flex flex-col gap-16 h-full">
      {error && <p className="text-error-surface-primary m-0">{error}</p>}

      <AsyncContent
        isLoading={isLoading}
        error={loadError}
        errorText={t('notes.loadError')}
        isEmpty={notes.length === 0}
        emptyText={t('notes.empty')}
      >
        <div className="flex flex-col" data-cy="notes-wrapper">
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
                      {prettyTime(note.modified ?? note.created, t)}
                      {note.modified ? ` ${t('notes.edited')}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 shrink-0">
                  <Button
                    size="sm"
                    variant="tertiary"
                    iconButton
                    aria-label={t('notes.edit')}
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
                    aria-label={t('notes.delete')}
                    onClick={() => void remove(note)}
                    leftIcon={<Trash />}
                  />
                </div>
              </div>
              <Divider />
            </div>
          ))}
        </div>
      </AsyncContent>

      <div className="w-full mt-auto flex flex-col items-start gap-12">
        <FormControl id="new-note" className="w-full">
          <Textarea
            className="w-full"
            rows={4}
            placeholder={t('notes.newNote')}
            aria-label={t('notes.newNote')}
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
          loadingText={t('notes.saving')}
          disabled={!errandId || text.trim() === ''}
          onClick={() => void add()}
          data-cy="save-note-button"
        >
          {t('common:save')}
        </Button>
      </div>

      <Modal
        show={!!editNote}
        className="w-[43rem]"
        onClose={() => {
          setEditNote(undefined);
        }}
        label={t('notes.editModalLabel')}
      >
        <Modal.Content>
          <Textarea
            rows={5}
            className="w-full"
            value={editText}
            onChange={(event) => {
              setEditText(event.target.value);
            }}
            aria-label={t('notes.noteText')}
          />
        </Modal.Content>
        <Modal.Footer>
          <Button
            className="w-full"
            variant="primary"
            disabled={editText.trim() === ''}
            onClick={() => void saveEdit()}
          >
            {t('common:save')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
