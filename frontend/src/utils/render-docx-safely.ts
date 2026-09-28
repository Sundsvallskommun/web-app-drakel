import { renderAsync } from 'docx-preview';

/** Elements that can run script or load active content; a rendered .docx never needs them to be read. */
const ACTIVE_CONTENT_SELECTOR = 'script, iframe, frame, frameset, object, embed, applet, base, meta';

/** Link schemes a handläggare may follow from a document; anything else (javascript:, data:, file:, …) is dropped. */
const SAFE_LINK_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

const LINK_ATTRIBUTES = ['href', 'xlink:href'];

const isSafeLinkTarget = (href: string): boolean => {
  try {
    // A relative target is resolved against the page itself, so it can never switch to another scheme.
    return SAFE_LINK_SCHEMES.has(new URL(href, window.location.href).protocol);
  } catch {
    return false;
  }
};

const removeEventHandlerAttributes = (element: Element): void => {
  Array.from(element.attributes)
    .filter((attribute) => attribute.name.toLowerCase().startsWith('on'))
    .forEach((attribute) => {
      element.removeAttribute(attribute.name);
    });
};

const makeLinkSafe = (anchor: Element): void => {
  LINK_ATTRIBUTES.forEach((attributeName) => {
    const target = anchor.getAttribute(attributeName);
    if (target !== null && !isSafeLinkTarget(target)) {
      anchor.removeAttribute(attributeName);
    }
  });
  anchor.setAttribute('rel', 'noopener noreferrer');
};

/** Removes whatever could run in our origin from the rendered document and makes its links safe to follow. */
const neutraliseRenderedDocument = (container: HTMLElement): void => {
  container.querySelectorAll(ACTIVE_CONTENT_SELECTOR).forEach((element) => {
    element.remove();
  });
  container.querySelectorAll('*').forEach(removeEventHandlerAttributes);
  container.querySelectorAll('a').forEach(makeLinkSafe);
};

/**
 * Renders a .docx into `container` without letting the document run anything in our origin. The file comes
 * from a citizen and docx-preview renders it straight into the page: by default it turns altChunks (embedded
 * HTML) into un-sandboxed srcdoc iframes and copies hyperlink targets as they are, whatever their scheme. So
 * altChunks are not rendered at all, and any active content or unsafe link left afterwards is removed.
 */
export const renderDocxSafely = async (blob: Blob, container: HTMLElement): Promise<void> => {
  await renderAsync(blob, container, undefined, { renderAltChunks: false });
  neutraliseRenderedDocument(container);
};
