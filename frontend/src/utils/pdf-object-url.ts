/** Converts a base64 PDF to an object URL, to show in an <iframe> or open in a tab of its own. */
export const base64PdfToObjectUrl = (base64: string): string => {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return window.URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
};
