import { lifecareError, lifecareMessage } from '@utils/lifecare-error';
import { AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';

const response = (status: number, data: unknown): AxiosResponse => ({ status, data }) as AxiosResponse;

describe('lifecareMessage', () => {
  it('finds the sentence under the keys ASP.NET uses', () => {
    expect(lifecareMessage({ Message: 'Kontonumret är ogiltigt' })).toBe('Kontonumret är ogiltigt');
    expect(lifecareMessage({ message: ' Saknar behörighet ' })).toBe('Saknar behörighet');
  });

  it('has nothing to say about an empty or textual body', () => {
    expect(lifecareMessage('')).toBeUndefined();
    expect(lifecareMessage({ Message: '  ' })).toBeUndefined();
    expect(lifecareMessage(null)).toBeUndefined();
  });
});

describe('lifecareError', () => {
  it('passes the reason Lifecare gave on', () => {
    const mapped = lifecareError(response(400, { Message: 'Datum saknas' }));

    expect(mapped.status).toBe(400);
    expect(mapped.message).toBe('Datum saknas');
  });

  it('turns a Lifecare refusal (461) into a 422 carrying its sentence', () => {
    // Captured from a CreateJournalNote with a time later than now.
    const mapped = lifecareError(response(461, { exceptionMessage: 'Klockslag kan inte sättas framåt i tiden' }));

    expect(mapped.status).toBe(422);
    expect(mapped.message).toBe('Klockslag kan inte sättas framåt i tiden');
  });

  it('falls back to the status when Lifecare says nothing', () => {
    expect(lifecareError(response(500, '')).message).toBe('Lifecare answered 500');
  });
});
