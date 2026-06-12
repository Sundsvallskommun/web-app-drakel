import { ExternalTag } from '@/responses/errand.response';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

/** Fields a handläggare may change on an existing errand. */
export class PatchErrandDto {
  @IsString()
  @IsOptional()
  title?: string;
  @IsString()
  @IsOptional()
  category?: string;
  @IsString()
  @IsOptional()
  type?: string;
  @IsString()
  @IsOptional()
  status?: string;
  @IsString()
  @IsOptional()
  description?: string;
  @IsString()
  @IsOptional()
  priority?: string;
  @IsString()
  @IsOptional()
  reporterUserId?: string;
  @IsString()
  @IsOptional()
  assignedUserId?: string;
  @IsString()
  @IsOptional()
  contactReason?: string;
  @IsString()
  @IsOptional()
  contactReasonDescription?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalTag)
  @IsOptional()
  externalTags?: ExternalTag[];
}

/**
 * Fields accepted when creating a new errand. `typeSlug` binds the errand to its type module and is
 * required by caremanagement on create (it identifies which strongly-typed module owns the errand).
 */
export class CreateErrandDto extends PatchErrandDto {
  @IsString()
  typeSlug!: string;
}

/** Query parameters for the paged errand search. */
export class FindErrandsQueryDto {
  /** RSQL-style filter expression forwarded to caremanagement. */
  @IsString()
  @IsOptional()
  filter?: string;
  /** Zero-based page index (0..N). */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  page?: number;
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  size?: number;
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sort?: string[];
}
