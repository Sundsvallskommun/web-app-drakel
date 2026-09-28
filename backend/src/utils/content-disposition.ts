/** RFC 6266 `filename*=charset'language'value` — the extended, percent-encoded form that can carry any character. */
const EXTENDED_FILENAME = /filename\*\s*=\s*([^;]+)/i;

/** `filename="…"` — a quoted string, in which `\` escapes the next character (e.g. a `"` in the name). */
const QUOTED_FILENAME = /filename\s*=\s*"((?:[^"\\]|\\.)*)"/i;

/** `filename=…` — a bare token. */
const TOKEN_FILENAME = /filename\s*=\s*([^;\s"]+)/i;

/** The `charset'language'value` parts of an extended value; the language is ignored. */
const EXTENDED_VALUE = /^([^']*)'[^']*'(.*)$/;

/** Decodes the %XX escapes of an ISO-8859-1 extended value, one byte per character. */
const decodeLatin1 = (encoded: string): string =>
  encoded.replace(/%([0-9a-f]{2})/gi, (_escape, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));

/** The file name an extended value carries, or undefined when it cannot be decoded (a malformed escape, say). */
const decodeExtendedValue = (value: string): string | undefined => {
  const parts = EXTENDED_VALUE.exec(value.trim());
  const charset = parts?.[1]?.toLowerCase();
  const encoded = parts?.[2];
  if (encoded === undefined) {
    return undefined;
  }
  try {
    return charset === 'iso-8859-1' ? decodeLatin1(encoded) : decodeURIComponent(encoded);
  } catch {
    return undefined;
  }
};

/** The combining marks a letter such as å leaves behind when decomposed (NFD) into a and a ring. */
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/** Anything outside printable ASCII. */
const NON_ASCII = /[^\x20-\x7e]/g;

/** Characters encodeURIComponent leaves as they are but an extended value may not carry (RFC 8187 attr-char). */
const NOT_ATTR_CHARS = /['()*]/g;

/** The name as plain ASCII for the `filename=` fallback: å → a, anything else outside ASCII → _, `"` and `\` escaped. */
const asciiFallback = (fileName: string): string =>
  fileName.normalize('NFD').replace(COMBINING_MARKS, '').replace(NON_ASCII, '_').replace(/["\\]/g, '\\$&');

/** The name as an extended `filename*=` value: UTF-8, percent-encoded. */
const extendedValue = (fileName: string): string =>
  `UTF-8''${encodeURIComponent(fileName).replace(NOT_ATTR_CHARS, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)}`;

/**
 * A Content-Disposition that downloads the file under its name, whatever characters the name has. The header itself is
 * plain ASCII — Node refuses anything beyond Latin-1 (ERR_INVALID_CHAR), and browsers read raw Latin-1 inconsistently —
 * so the real name goes in the encoded `filename*=`, which every current browser prefers, with an ASCII `filename=`
 * beside it for any client that does not.
 *
 * @param fileName The file's name, as upstream gave it
 */
export const attachmentDisposition = (fileName: string): string =>
  `attachment; filename="${asciiFallback(fileName)}"; filename*=${extendedValue(fileName)}`;

/**
 * The file name a Content-Disposition header gives. The extended `filename*=` is preferred when there is one — it is
 * the form that can carry any character, and the plain `filename=` beside it is then only an ASCII fallback. Only the
 * extended form is percent-decoded: a plain `filename="100%.pdf"` is taken as it stands, not read as an escape.
 *
 * @param disposition The header's value, if the response had one
 */
export const fileNameFromDisposition = (disposition?: string): string | undefined => {
  if (!disposition) {
    return undefined;
  }
  const extended = EXTENDED_FILENAME.exec(disposition)?.[1];
  const decoded = extended === undefined ? undefined : decodeExtendedValue(extended);
  if (decoded) {
    return decoded;
  }
  const quoted = QUOTED_FILENAME.exec(disposition)?.[1];
  if (quoted !== undefined) {
    return quoted.replace(/\\(.)/g, '$1');
  }
  return TOKEN_FILENAME.exec(disposition)?.[1];
};
