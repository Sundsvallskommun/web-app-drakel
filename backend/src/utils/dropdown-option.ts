import { TypeOption } from '@/data-contracts/caremanagement/data-contracts';

/** A labelled option for a frontend dropdown. */
export interface DropdownOption {
  code?: string;
  displayName?: string;
}

/**
 * Maps a caremanagement type option to the frontend dropdown shape, preferring the Lifecare
 * handläggare label over the citizen-facing one.
 */
export const toDropdownOption = (type: TypeOption): DropdownOption => ({
  code: type.code,
  displayName: type.internalDisplayName ?? type.externalDisplayName ?? type.code,
});
