import { ValidateInResponseTo } from '@node-saml/passport-saml';
import { toInResponseToCheck } from '@utils/saml-in-response-to';
import { describe, expect, it } from 'vitest';

describe('toInResponseToCheck', () => {
  it('ties every response to a login drakel started unless configured otherwise', () => {
    expect(toInResponseToCheck(undefined)).toBe(ValidateInResponseTo.always);
  });

  it.each([
    ['always', ValidateInResponseTo.always],
    ['ifPresent', ValidateInResponseTo.ifPresent],
    ['never', ValidateInResponseTo.never],
  ])('reads %s from configuration', (configured, expected) => {
    expect(toInResponseToCheck(configured)).toBe(expected);
  });

  it('falls back to the strictest check on a value it does not know', () => {
    expect(toInResponseToCheck('sometimes')).toBe(ValidateInResponseTo.always);
  });
});
