import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

import { ExternalTag } from '@/responses/errand.response';

/** Fields a handläggare may change on an existing errand. */
export class PatchErrandDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  title?: string;
  @IsString()
  @IsOptional()
  category?: string;
  @IsString()
  @IsOptional()
  type?: string;
  @IsString()
  @MaxLength(64)
  @IsOptional()
  status?: string;
  @IsString()
  @IsOptional()
  description?: string;
  @IsString()
  @MaxLength(16)
  @IsOptional()
  priority?: string;
  @IsString()
  @MaxLength(64)
  @IsOptional()
  reporterUserId?: string;
  @IsString()
  @MaxLength(64)
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
  @MaxLength(64)
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
  /** When true, only errands that have at least one unacknowledged notification (all owners). */
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  hasUnacknowledgedNotifications?: boolean;

  /**
   * When true, only errands that have at least one notification nobody has acted on. Separate from
   * `hasUnacknowledgedNotifications`: a notification that has been read but not dealt with is no longer
   * unacknowledged, and would fall out of that filter while still needing someone's attention.
   */
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  hasUnhandledNotifications?: boolean;

  /** Narrows the notification filters to one recipient's notifications. */
  @IsString()
  @IsOptional()
  notificationOwnerId?: string;
}
