'use client';

import { AdminTemplate, getAdminTemplates } from '@services/admin-template-service';
import { DocumentType, getDocumentTypes } from '@services/document-service';
import { getJournalTypes, JournalEntryType } from '@services/journal-service';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseAdminTemplatesResult {
  templates: AdminTemplate[];
  /** The journalanteckning type catalogue — the codes a journal template can belong to. */
  journalTypes: JournalEntryType[];
  /** The dokument type catalogue — the codes a document template can belong to. */
  documentTypes: DocumentType[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_TEMPLATES: AdminTemplate[] = [];
const NO_JOURNAL_TYPES: JournalEntryType[] = [];
const NO_DOCUMENT_TYPES: DocumentType[] = [];

/**
 * Loads every mall and frastext this app owns, together with both type catalogues. The catalogues are what
 * place a template under journalanteckning or dokument — the template itself only carries the type code.
 */
export const useAdminTemplates = (): UseAdminTemplatesResult => {
  const { data: templates, ...query } = useServiceQuery(getAdminTemplates, { initialData: NO_TEMPLATES });
  // Both catalogues are best-effort: failing to load one leaves its categories empty rather than failing
  // the page, and the error above already covers not being able to read the templates at all.
  const { data: journalTypes } = useServiceQuery(getJournalTypes, { initialData: NO_JOURNAL_TYPES });
  const { data: documentTypes } = useServiceQuery(getDocumentTypes, { initialData: NO_DOCUMENT_TYPES });
  return { templates, journalTypes, documentTypes, ...query };
};
