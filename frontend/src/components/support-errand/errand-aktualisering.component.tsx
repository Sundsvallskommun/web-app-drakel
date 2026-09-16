'use client';

import { Actualisation, archiveToActualisation, getActualisations } from '@services/actualisation-service';
import { Button, Modal, Spinner } from '@sk-web-gui/react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Administration-bar action for a supplementary application: opens a dialog listing the applicant's Lifecare
 * aktualiseringar, lets the handläggare pick one, and archives the errand's application PDF onto it —
 * which records the chosen aktualisering on the errand.
 */
export const ErrandAktualisering: FC<{ errandId: string; onArchived: () => void }> = ({ errandId, onArchived }) => {
  const { t } = useTranslation('errand');
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
      setArchiveError(t('actualisation.archiveError'));
      return;
    }
    setArchived(true);
    onArchived();
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={openModal}>
        {t('actualisation.button')}
      </Button>

      <Modal
        show={open}
        onClose={() => {
          setOpen(false);
        }}
        label={t('actualisation.modalLabel')}
        className="w-[48rem]"
      >
        <Modal.Content className="flex flex-col gap-12">
          <p className="m-0 text-small text-dark-secondary">{t('actualisation.description')}</p>

          {loading ?
            <Spinner size={3} />
          : loadError ?
            <p className="m-0">{t('actualisation.loadError')}</p>
          : actualisations.length === 0 ?
            <p className="m-0 text-dark-secondary">{t('actualisation.empty')}</p>
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
                      selectedId === actualisation.id ?
                        'border-vattjom-surface-primary bg-background-200'
                      : 'border-divider'
                    }`}
                  >
                    <span className="font-bold block break-words">
                      {actualisation.name ??
                        actualisation.type ??
                        t('actualisation.fallbackName', { id: actualisation.id })}
                    </span>
                    <span className="text-small text-dark-secondary block">
                      {[
                        actualisation.id ? t('actualisation.id', { id: actualisation.id }) : null,
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

          {archived && <p className="text-dark-secondary m-0">{t('actualisation.archived')}</p>}
          {archiveError && <p className="text-error-surface-primary m-0">{archiveError}</p>}
        </Modal.Content>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setOpen(false);
            }}
          >
            {t('common:close')}
          </Button>
          <Button
            color="vattjom"
            variant="primary"
            disabled={selectedId === undefined || archiving || archived}
            loading={archiving}
            loadingText={t('actualisation.archiving')}
            onClick={() => void archive()}
          >
            {t('actualisation.archive')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
