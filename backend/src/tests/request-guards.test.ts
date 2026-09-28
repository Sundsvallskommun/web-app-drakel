import { isAllowedCorsOrigin, isRefusedWildcard } from '@utils/cors-origin';
import { assertAllowedMessageAttachments } from '@utils/message-attachment-types';
import { pathWithoutQuery } from '@utils/request-log';
import { environmentWarnings } from '@utils/validateEnv';
import { describe, expect, it } from 'vitest';

describe('pathWithoutQuery', () => {
  it('leaves the query — e.g. a search on the sökande’s name — out of the request log', () => {
    expect(pathWithoutQuery("/api/errands?filter=applicantName~~'*Andersson*'&page=0")).toBe('/api/errands');
    expect(pathWithoutQuery('/api/errands/EB-26090036')).toBe('/api/errands/EB-26090036');
  });
});

describe('isAllowedCorsOrigin', () => {
  const allowed = ['http://localhost:3000'];

  it('lets a listed origin, and a request without an Origin, through', () => {
    expect(isAllowedCorsOrigin('http://localhost:3000', allowed, true)).toBe(true);
    expect(isAllowedCorsOrigin(undefined, allowed, true)).toBe(true);
    expect(isAllowedCorsOrigin('https://evil.example', allowed, true)).toBe(false);
  });

  it("does not honour ORIGIN '*' while credentials are on", () => {
    expect(isAllowedCorsOrigin('https://evil.example', ['*'], true)).toBe(false);
    expect(isRefusedWildcard(['*'], true)).toBe(true);
    expect(isAllowedCorsOrigin('https://any.example', ['*'], false)).toBe(true);
    expect(isRefusedWildcard(['*'], false)).toBe(false);
  });
});

describe('assertAllowedMessageAttachments', () => {
  const file = (originalname: string, mimetype: string) => ({ buffer: Buffer.from('x'), originalname, mimetype });

  it('lets the types the message form offers through', () => {
    expect(() => {
      assertAllowedMessageAttachments([
        file('intyg.pdf', 'application/pdf'),
        file('kvitto.JPG', 'image/jpeg'),
        file('hyresavtal.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        file('mejl.msg', 'application/octet-stream'),
      ]);
    }).not.toThrow();
  });

  it('refuses a type that is not on the list, or a file whose MIME type contradicts its extension', () => {
    expect(() => {
      assertAllowedMessageAttachments([file('sida.html', 'text/html')]);
    }).toThrow(expect.objectContaining({ status: 400 }) as Error);
    expect(() => {
      assertAllowedMessageAttachments([file('program.exe', 'application/octet-stream')]);
    }).toThrow(expect.objectContaining({ status: 400 }) as Error);
    expect(() => {
      assertAllowedMessageAttachments([file('intyg.pdf', 'text/html')]);
    }).toThrow(expect.objectContaining({ status: 400 }) as Error);
  });
});

describe('environmentWarnings', () => {
  const sound = {
    NODE_ENV: 'production',
    SECRET_KEY: 'a'.repeat(48),
    ORIGIN: 'https://drakel.sundsvall.se',
    SAML_SUCCESS_REDIRECT: 'https://drakel.sundsvall.se',
  };

  it('has nothing to say about a sound production environment', () => {
    expect(environmentWarnings(sound)).toEqual([]);
  });

  it('warns about a placeholder or short SECRET_KEY in production only', () => {
    expect(environmentWarnings({ ...sound, SECRET_KEY: 'changeme' })).toHaveLength(1);
    expect(environmentWarnings({ ...sound, SECRET_KEY: 'short' })).toHaveLength(1);
    expect(environmentWarnings({ ...sound, NODE_ENV: 'development', SECRET_KEY: 'changeme' })).toEqual([]);
  });

  it('warns about an ORIGIN entry or a SAML_SUCCESS_REDIRECT that is not a URL', () => {
    expect(environmentWarnings({ ...sound, ORIGIN: 'https://drakel.sundsvall.se, drakel.sundsvall.se' })).toHaveLength(1);
    expect(environmentWarnings({ ...sound, SAML_SUCCESS_REDIRECT: '/oversikt' })).toHaveLength(1);
  });
});
