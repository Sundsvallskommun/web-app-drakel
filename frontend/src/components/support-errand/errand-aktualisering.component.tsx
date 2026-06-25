'use client';

import { Actualisation, archiveToActualisation, getActualisations } from '@services/actualisation-service';
import { Button, Modal, Spinner } from '@sk-web-gui/react';
import { FC, useState } from 'react';

/**
 * Sidebar action for a supplementary application: opens a dialog listing the applicant's Lifecare
 * aktualiseringar, lets the handläggare pick one, and archives the errand's application PDF onto it —
 * which records the chosen aktualisering on the errand.
 */
export const ErrandAktualisering: FC<{ errandId: string; onArchived: () => void }> = ({ errandId, onArchived }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [actualisations, setActualisations] = useState<Actualisation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<number>();
  const [archiving, setArchiving] = useState<boolean>(false);
  const [archiveError, setArchiveError] = useState<string>();
  const [archived, setArchived] = useState<boolean>(false);

  const openModal = (): void => {
    setOpen(true);
    setSelectedId(undefined);
    setArchiveError(undefined);
    setArchived(false);
    setLoading(true);
    setLoadError(false);
    void getActualisations(errandId).then((res) => {
      if (res.error) {
        setLoadError(true);
        setActualisations([]);
      } else {
        setActualisations(res.data ?? []);
      }
      setLoading(false);
    });
  };

  const archive = async (): Promise<void> => {
    if (selectedId === undefined) {
      return;
    }
    setArchiving(true);
    setArchiveError(undefined);
    const res = await archiveToActualisation(errandId, selectedId);
    setArchiving(false);
    if (res.error) {
      setArchiveError('Det gick inte att arkivera till aktualiseringen');
      return;
    }
    setArchived(true);
    onArchived();
  };

  return (
    <div className="flex flex-col gap-8">
      <Button variant="secondary" className="w-full" onClick={openModal}>
        Arkivera till aktualisering
      </Button>

      <Modal
        show={open}
        onClose={() => {
          setOpen(false);
        }}
        label="Arkivera till aktualisering"
        className="w-[48rem]"
      >
        <Modal.Content className="flex flex-col gap-12">
          <p className="m-0 text-small text-dark-secondary">
            Välj en aktualisering att arkivera ansökningens sammanställnings-PDF till. Den valda
            aktualiseringen registreras på ärendet.
          </p>

          {loading ?
            <Spinner size={3} />
          : loadError ?
            <p className="m-0">Det gick inte att hämta aktualiseringar</p>
          : actualisations.length === 0 ?
            <p className="m-0 text-dark-secondary">Inga aktualiseringar hittades för sökanden.</p>
          : <ul className="flex flex-col gap-8 m-0 p-0 list-none">
              {actualisations.map((actualisation) => (
                <li key={actualisation.id}>
                  <button
                    type="button"
                    aria-pressed={selectedId === actualisation.id}
                    onClick={() => {
                      setSelectedId(actualisation.id);
                    }}
                    className={`w-full text-left rounded-12 p-12 border-1 ${
                      selectedId === actualisation.id ? 'border-vattjom-surface-primary bg-background-200' : (
                        'border-divider'
                      )
                    }`}
                  >
                    <span className="font-bold block break-words">
                      {actualisation.name ?? actualisation.type ?? `Aktualisering ${actualisation.id}`}
                    </span>
                    <span className="text-small text-dark-secondary block">
                      {[
                        actualisation.id ? `ID ${actualisation.id}` : null,
                        actualisation.date,
                        actualisation.type,
                        actualisation.status,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    {actualisation.regards ?
                      <span className="text-small block break-words">{actualisation.regards}</span>
                    : null}
                  </button>
                </li>
              ))}
            </ul>
          }

          {archived && <p className="text-dark-secondary m-0">Dokumentet arkiverades till aktualiseringen.</p>}
          {archiveError && <p className="text-error-surface-primary m-0">{archiveError}</p>}
        </Modal.Content>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setOpen(false);
            }}
          >
            Stäng
          </Button>
          <Button
            color="vattjom"
            variant="primary"
            disabled={selectedId === undefined || archiving || archived}
            loading={archiving}
            loadingText="Arkiverar…"
            onClick={() => void archive()}
          >
            Arkivera
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
