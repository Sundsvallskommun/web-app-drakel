import { LifecareRecord } from '@services/lifecare-documents-service';
import { htmlToPlainText } from '@utils/sanitize-html';

/** Everything a handläggare may search a record by: what the card shows, its text included. */
const searchableText = (record: LifecareRecord, body?: string): string =>
  [
    record.title,
    record.type,
    record.ownerTypeText,
    record.responsibleCaseworker ?? '',
    record.modifiedBy,
    body ? htmlToPlainText(body) : '',
  ]
    .join(' ')
    .toLocaleLowerCase('sv');

/**
 * The records matching a search, in the order given. Every word must occur somewhere on the record, in
 * any order and case — "hyra maj" finds a note that mentions both. An empty search keeps every record.
 */
export const filterLifecareRecords = (
  records: LifecareRecord[],
  bodyById: ReadonlyMap<string, { content?: string }>,
  query: string
): LifecareRecord[] => {
  const words = query.toLocaleLowerCase('sv').split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return records;
  }
  return records.filter((record) => {
    const text = searchableText(record, bodyById.get(record.id)?.content);
    return words.every((word) => text.includes(word));
  });
};
