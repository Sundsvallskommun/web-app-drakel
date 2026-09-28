import { PatchErrandDto } from '@data-contracts/backend/data-contracts';

/** The errand fields the handläggare edits in the administration bar. */
export interface ErrandForm {
  assignedUserId: string;
  status: string;
}

/**
 * The PATCH for a save: only the fields the handläggare changed from the loaded errand. Anything else is left out,
 * so a save never overwrites what someone else changed on the errand in the meantime. Empty when nothing changed.
 * A field emptied in the form is left out too — the bar has no way to clear a field on purpose.
 */
export const buildErrandPatch = (form: ErrandForm, loaded: ErrandForm): PatchErrandDto =>
  Object.fromEntries(
    (Object.keys(form) as (keyof ErrandForm)[])
      .filter((key) => form[key] !== loaded[key] && form[key] !== '')
      .map((key) => [key, form[key]])
  );
