import { randomBytes } from 'node:crypto';

/** Every template this app owns is prefixed so it can be told apart in the municipality-wide catalogue. */
const IDENTIFIER_PREFIX = 'drakel.fa';

/**
 * Turns a Swedish name into an identifier segment. The Templating service only accepts letters, digits,
 * dashes and dots in an identifier, so the Swedish vowels are transliterated rather than dropped — "Övrigt"
 * and "Ovrigt" would otherwise collapse to the same segment.
 */
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[éè]/g, 'e')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/**
 * Builds the identifier for a newly created template: `drakel.fa.<code>.<kind>.<name>.<suffix>`. The suffix
 * keeps two templates with the same name under the same type from colliding — storing an existing
 * identifier adds a version to that template rather than creating a second one, so a collision would
 * quietly turn a new mall into a new version of an unrelated one.
 *
 * It is random rather than a timestamp: two templates created in the same millisecond would otherwise
 * share it. The timestamp is kept in front of the random part so identifiers still sort by age.
 *
 * @param code The CM type code the template belongs to (journal entry type or document type)
 * @param kind DOCUMENT (mall) or PHRASE (frastext)
 * @param name The handläggare-facing template name
 */
export const buildTemplateIdentifier = (code: string, kind: string, name: string): string => {
  const suffix = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
  const segments = [IDENTIFIER_PREFIX, slugify(code), slugify(kind), slugify(name) || 'mall', suffix];
  return segments.join('.');
};
