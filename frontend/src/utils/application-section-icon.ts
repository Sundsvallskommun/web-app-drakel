import {
  Banknote,
  BriefcaseBusiness,
  CalendarCheck,
  FileCheck,
  FileText,
  House,
  type LucideIcon,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react';

// Keyword → icon, checked in order against the (lower-cased) section title; the first match wins.
const SECTION_ICONS: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ['person', 'sökande', 'intressent', 'familj', 'barn'], icon: Users },
  { keywords: ['boende', 'bostad', 'hushåll'], icon: House },
  { keywords: ['kostnad', 'utgift'], icon: Receipt },
  { keywords: ['inkomst', 'tillgång', 'ersättning'], icon: Wallet },
  { keywords: ['jobbstimulans', 'arbete', 'syssels'], icon: BriefcaseBusiness },
  { keywords: ['planering', 'aktivitet'], icon: CalendarCheck },
  { keywords: ['utbetalning', 'konto'], icon: Banknote },
  { keywords: ['försäkran', 'vistelse', 'intyg'], icon: FileCheck },
];

/** A fitting lucide icon for an application (form) section, picked from its title; a document icon otherwise. */
export const applicationSectionIcon = (title?: string): LucideIcon => {
  const normalizedTitle = (title ?? '').toLowerCase();
  return (
    SECTION_ICONS.find(({ keywords }) => keywords.some((keyword) => normalizedTitle.includes(keyword)))?.icon ??
    FileText
  );
};
