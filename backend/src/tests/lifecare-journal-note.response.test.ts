import { describe, expect, it } from 'vitest';

import { toNoteTypeView } from '@/responses/lifecare-journal-note.response';

describe('toNoteTypeView', () => {
  it('passes a note type from careM through as it is', () => {
    expect(toNoteTypeView({ code: 3, name: 'Beslut', protectedByDefault: true })).toEqual({ code: 3, name: 'Beslut', protectedByDefault: true });
  });

  it('does not make a note skrivskyddad by default when careM does not say so', () => {
    expect(toNoteTypeView({ code: 1, name: 'Journalanteckning' })).toEqual({ code: 1, name: 'Journalanteckning', protectedByDefault: false });
  });
});
