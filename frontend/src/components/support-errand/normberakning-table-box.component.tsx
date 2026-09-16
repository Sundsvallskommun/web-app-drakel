import { FC, ReactNode } from 'react';

import { ContentBox } from './content-box.component';

interface NormberakningTableBoxProps {
  title: string;
  /** Rendered to the right of the title (e.g. the sub-tab's "Summa …" total). */
  summary?: ReactNode;
  children: ReactNode;
}

/** The grey box around a normberäkning sub-tab's table: a small bold title (+ optional total) above the content. */
export const NormberakningTableBox: FC<NormberakningTableBoxProps> = ({ title, summary, children }) => (
  <ContentBox>
    <div className="flex flex-col gap-16">
      <div className="flex items-center justify-between gap-16 flex-wrap">
        <h3 className="text-base font-bold m-0">{title}</h3>
        {summary}
      </div>
      {children}
    </div>
  </ContentBox>
);
