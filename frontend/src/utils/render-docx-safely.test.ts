import { renderAsync } from 'docx-preview';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderDocxSafely } from './render-docx-safely';

vi.mock('docx-preview', () => ({ renderAsync: vi.fn() }));

/** Stands in for docx-preview rendering a hostile document: the markup is what it would put in the container. */
const renderingMarkup = (markup: string): void => {
  vi.mocked(renderAsync).mockImplementation((_data: unknown, container: HTMLElement) => {
    container.innerHTML = markup;
    return Promise.resolve();
  });
};

describe('renderDocxSafely', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.mocked(renderAsync).mockReset();
    container = document.createElement('div');
  });

  it('renders without altChunks, which docx-preview would put in un-sandboxed iframes', async () => {
    renderingMarkup('<p>Hej</p>');
    const blob = new Blob(['docx']);

    await renderDocxSafely(blob, container);

    expect(renderAsync).toHaveBeenCalledWith(blob, container, undefined, { renderAltChunks: false });
    expect(container.innerHTML).toBe('<p>Hej</p>');
  });

  it('removes script, iframe, object and embed elements', async () => {
    renderingMarkup(
      '<p>Text</p><script>alert(1)</script><iframe srcdoc="<script>alert(2)</script>"></iframe>' +
        '<object data="x.swf"></object><embed src="x.swf">'
    );

    await renderDocxSafely(new Blob(['docx']), container);

    expect(container.querySelector('script, iframe, object, embed')).toBeNull();
    expect(container.textContent).toBe('Text');
  });

  it('removes inline event handlers', async () => {
    renderingMarkup('<img src="x" onerror="alert(1)" alt="bild">');

    await renderDocxSafely(new Blob(['docx']), container);

    expect(container.querySelector('img')?.hasAttribute('onerror')).toBe(false);
  });

  it('keeps http, https and mailto links, with rel="noopener noreferrer"', async () => {
    renderingMarkup(
      '<a href="https://sundsvall.se">Webb</a><a href="http://example.com">Http</a><a href="mailto:a@b.se">Mejl</a>'
    );

    await renderDocxSafely(new Blob(['docx']), container);

    const anchors = Array.from(container.querySelectorAll('a'));
    expect(anchors.map((anchor) => anchor.getAttribute('href'))).toEqual([
      'https://sundsvall.se',
      'http://example.com',
      'mailto:a@b.se',
    ]);
    anchors.forEach((anchor) => {
      expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('strips the target of links with any other scheme', async () => {
    renderingMarkup(
      '<a href="javascript:alert(1)">Js</a><a href=" JaVaScRiPt:alert(1)">Blandat</a><a href="data:text/html,x">Data</a>'
    );

    await renderDocxSafely(new Blob(['docx']), container);

    container.querySelectorAll('a').forEach((anchor) => {
      expect(anchor.hasAttribute('href')).toBe(false);
    });
  });
});
