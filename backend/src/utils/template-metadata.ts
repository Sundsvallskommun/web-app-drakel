import { TemplateSummary } from '@services/templating.service';

/** This app's templates live under the `app=drakel` metadata tag in the shared Templating service. */
const APP_TAG = 'drakel';

/** Metadata key holding the CM type code a template belongs to (journal entry type or document type). */
export const CODE_KEY = 'code';

/** Metadata key holding the template kind: DOCUMENT = full mall, PHRASE = insertable frastext, DECISION_PHRASE = beslutsformulering. */
export const KIND_KEY = 'kind';

/** Metadata key holding a beslutsformulering's kategori — the first of the beslut editor's two pickers. */
export const CATEGORY_KEY = 'category';

/** Reads a single metadata tag off a template. */
export const metadataValue = (template: TemplateSummary, key: string): string | undefined => template.metadata?.find(meta => meta.key === key)?.value;

/** Whether a template from the municipality-wide catalogue is one of this app's. */
export const isAppTemplate = (template: TemplateSummary): boolean => metadataValue(template, 'app') === APP_TAG;

/** The metadata tags a template of this app carries; a beslutsformulering also carries its kategori. */
export const appTemplateMetadata = (code: string, kind: string, category?: string) => [
  { key: 'app', value: APP_TAG },
  { key: CODE_KEY, value: code },
  { key: KIND_KEY, value: kind },
  ...(category ? [{ key: CATEGORY_KEY, value: category }] : []),
];
