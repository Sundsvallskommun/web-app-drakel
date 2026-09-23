import { LifecareRecord } from '@services/lifecare-documents-service';
import { describe, expect, it } from 'vitest';

import { filterLifecareRecords } from './lifecare-record-search';

const record = (id: string, title: string, type = 'Journalanteckning'): LifecareRecord => ({
  id,
  category: 'JOURNAL_NOTE',
  title,
  dateTime: '2026-09-23T10:00',
  type,
  ownerTypeText: 'EK Ekonomiskt bistånd',
  modifiedBy: 'RPA_031DEV 2026-09-23',
  locked: false,
  protected: false,
});

const records = [record('1', 'Telefonsamtal'), record('2', 'Hembesök', 'Beslut'), record('3', 'Journalanteckning')];
const bodies = new Map([
  ['1', { id: '1', content: '<p>Sökande ringde om hyran f&ouml;r maj.</p>' }],
  ['3', { id: '3', content: '<p>Inget nytt.</p>' }],
]);

describe('filterLifecareRecords', () => {
  it('keeps every record for an empty search', () => {
    expect(filterLifecareRecords(records, bodies, '  ')).toEqual(records);
  });

  it('finds a record by its heading, whatever the case', () => {
    expect(filterLifecareRecords(records, bodies, 'hembes').map((match) => match.id)).toEqual(['2']);
  });

  it('finds a record by its type', () => {
    expect(filterLifecareRecords(records, bodies, 'beslut').map((match) => match.id)).toEqual(['2']);
  });

  it('finds a record by the words in its text, markup and entities aside', () => {
    expect(filterLifecareRecords(records, bodies, 'för maj').map((match) => match.id)).toEqual(['1']);
  });

  it('needs every word to match', () => {
    expect(filterLifecareRecords(records, bodies, 'hyran juni')).toEqual([]);
  });
});
