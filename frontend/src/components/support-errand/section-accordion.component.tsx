'use client';

import { Button } from '@sk-web-gui/react';
import { type LucideIcon, Minus, Plus } from 'lucide-react';
import { FC, ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SectionAccordionProps {
  title: string;
  icon?: LucideIcon;
  initialOpen?: boolean;
  children: ReactNode;
}

/**
 * A collapsible section in an errand tab: icon and title followed by a rule and a +/− toggle, with the
 * content indented below.
 */
export const SectionAccordion: FC<SectionAccordionProps> = ({ title, icon: Icon, initialOpen = true, children }) => {
  const { t } = useTranslation('errand');
  const [open, setOpen] = useState<boolean>(initialOpen);
  const contentId = useId();
  const toggle = () => {
    setOpen((current) => !current);
  };

  return (
    <section className="flex flex-col gap-24">
      <div className="flex items-center gap-12">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={toggle}
          className="flex items-center gap-12 min-w-0 text-left"
        >
          {Icon ?
            <Icon size={24} className="shrink-0" aria-hidden />
          : null}
          <h3 className="text-h4-md m-0">{title}</h3>
        </button>
        <span className="flex-1 h-px bg-divider" aria-hidden />
        <Button
          variant="tertiary"
          size="sm"
          iconButton
          aria-label={t(open ? 'sectionAccordion.collapse' : 'sectionAccordion.expand', {
            title,
            interpolation: { escapeValue: false },
          })}
          aria-expanded={open}
          aria-controls={contentId}
          leftIcon={open ? <Minus /> : <Plus />}
          onClick={toggle}
        />
      </div>
      {open ?
        <div id={contentId} className="md:px-36 pb-24">
          {children}
        </div>
      : null}
    </section>
  );
};
