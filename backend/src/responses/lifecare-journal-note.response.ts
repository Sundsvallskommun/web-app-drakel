import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString, ValidateNested } from 'class-validator';

import { LifecareNoteType } from '@/data-contracts/caremanagement/data-contracts';

/** A note type a handläggare can pick for a new journalanteckning. */
export class LifecareNoteTypeView {
  /** Lifecare's noteTypeCode. */
  @IsNumber() code!: number;
  @IsString() name!: string;
  /** Whether a new note of this type is saved skrivskyddad unless the handläggare says otherwise. */
  @IsBoolean() protectedByDefault!: boolean;
}

export class LifecareNoteTypesApiResponse implements ApiResponse<LifecareNoteTypeView[]> {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareNoteTypeView) data!: LifecareNoteTypeView[];
  @IsString() message!: string;
}

/**
 * A note type as careM lists it (the active ones, in Lifecare's order), in the form's shape. careM's contract
 * leaves every field optional; a type careM does not say is skrivskyddad by default is not.
 */
export const toNoteTypeView = (noteType: LifecareNoteType): LifecareNoteTypeView => ({
  code: noteType.code ?? 0,
  name: noteType.name ?? '',
  protectedByDefault: noteType.protectedByDefault ?? false,
});
