import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString, ValidateNested } from 'class-validator';

import { LifecareDocumentType } from '@/data-contracts/caremanagement/data-contracts';

/** A document type a handläggare can pick for a new document. */
export class LifecareDocumentTypeView {
  /** Lifecare's documentTypeCode. */
  @IsNumber() code!: number;
  @IsString() name!: string;
  /** Whether the documented date may differ from the one Lifecare proposes (today). */
  @IsBoolean() canChangeOccurenceDate!: boolean;
  /** Whether a new document of this type is saved skrivskyddad unless the handläggare says otherwise. */
  @IsBoolean() protectedByDefault!: boolean;
}

export class LifecareDocumentTypesApiResponse implements ApiResponse<LifecareDocumentTypeView[]> {
  @IsArray() @ValidateNested({ each: true }) @Type(() => LifecareDocumentTypeView) data!: LifecareDocumentTypeView[];
  @IsString() message!: string;
}

/**
 * A document type as careM lists it (the writable ones, in Lifecare's order), in the form's shape. careM's contract
 * leaves every field optional; a type careM does not say allows another date keeps the proposed one, and one it does
 * not say is skrivskyddad by default is not.
 */
export const toDocumentTypeView = (documentType: LifecareDocumentType): LifecareDocumentTypeView => ({
  code: documentType.code ?? 0,
  name: documentType.name ?? '',
  canChangeOccurenceDate: documentType.canChangeOccurenceDate ?? false,
  protectedByDefault: documentType.protectedByDefault ?? false,
});
