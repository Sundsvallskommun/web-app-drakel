import { describe, expect, it } from 'vitest';

import { isPreviewableMimeType, isRasterImageMimeType } from './preview-mime-type';

describe('isRasterImageMimeType', () => {
  it('accepts the raster formats shown inline', () => {
    ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'IMAGE/PNG'].forEach((mimeType) => {
      expect(isRasterImageMimeType(mimeType)).toBe(true);
    });
  });

  it('refuses SVG, which can carry script', () => {
    expect(isRasterImageMimeType('image/svg+xml')).toBe(false);
  });
});

describe('isPreviewableMimeType', () => {
  it('previews PDFs, raster images and .docx', () => {
    expect(isPreviewableMimeType('application/pdf')).toBe(true);
    expect(isPreviewableMimeType('image/jpeg')).toBe(true);
    expect(isPreviewableMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
  });

  it('does not preview SVG, HTML or legacy .doc', () => {
    expect(isPreviewableMimeType('image/svg+xml')).toBe(false);
    expect(isPreviewableMimeType('text/html')).toBe(false);
    expect(isPreviewableMimeType('application/msword')).toBe(false);
  });
});
