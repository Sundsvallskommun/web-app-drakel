import { describe, expect, it } from 'vitest';

import { ALLOWED_ATTACHMENT_FILE_EXTENSIONS, MESSAGE_ATTACHMENT_ACCEPT } from './attachment-upload-limits';

describe('message attachment types', () => {
  it('offers no HTML, which the backend refuses', () => {
    expect(MESSAGE_ATTACHMENT_ACCEPT).not.toContain('text/html');
    expect(MESSAGE_ATTACHMENT_ACCEPT).not.toContain('.html');
    expect(MESSAGE_ATTACHMENT_ACCEPT).not.toContain('.htm');
    expect(ALLOWED_ATTACHMENT_FILE_EXTENSIONS).not.toContain('.html');
  });

  it('accepts the documents and images a message carries', () => {
    [
      'application/pdf',
      'image/jpeg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].forEach((mimeType) => {
      expect(MESSAGE_ATTACHMENT_ACCEPT).toContain(mimeType);
    });
  });
});
