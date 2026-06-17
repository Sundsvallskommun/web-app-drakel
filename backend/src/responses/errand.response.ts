import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ExternalTag {
  @IsString()
  @IsOptional()
  key?: string;
  @IsString()
  @IsOptional()
  value?: string;
}

export class ContactChannel {
  @IsString()
  @IsOptional()
  key?: string;
  @IsString()
  @IsOptional()
  value?: string;
}

export class StakeholderParameter {
  @IsInt()
  @IsOptional()
  id?: number;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  key?: string;
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  values?: string[];
}

export class Stakeholder {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  @IsOptional()
  externalId?: string;
  @IsString()
  @IsOptional()
  externalIdType?: string;
  @IsString()
  @IsOptional()
  role?: string;
  @IsString()
  @IsOptional()
  firstName?: string;
  @IsString()
  @IsOptional()
  lastName?: string;
  @IsString()
  @IsOptional()
  organizationName?: string;
  @IsString()
  @IsOptional()
  address?: string;
  @IsString()
  @IsOptional()
  careOf?: string;
  @IsString()
  @IsOptional()
  zipCode?: string;
  @IsString()
  @IsOptional()
  city?: string;
  @IsString()
  @IsOptional()
  country?: string;
  @ValidateNested({ each: true })
  @Type(() => ContactChannel)
  @IsOptional()
  contactChannels?: ContactChannel[];
  @ValidateNested({ each: true })
  @Type(() => StakeholderParameter)
  @IsOptional()
  parameters?: StakeholderParameter[];
}

export class Parameter {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  parameterGroup?: string;
  @IsString()
  @IsOptional()
  key?: string;
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  values?: string[];
}

export class Errand {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  @IsOptional()
  errandNumber?: string;
  @IsString()
  @IsOptional()
  municipalityId?: string;
  @IsString()
  @IsOptional()
  namespace?: string;
  @IsString()
  @IsOptional()
  title?: string;
  @IsString()
  @IsOptional()
  category?: string;
  @IsString()
  @IsOptional()
  type?: string;
  /** Binds the errand to its type module (e.g. "financial-assistance"). */
  @IsString()
  @IsOptional()
  typeSlug?: string;
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
  @ValidateNested({ each: true })
  @Type(() => ExternalTag)
  @IsOptional()
  externalTags?: ExternalTag[];
  @ValidateNested({ each: true })
  @Type(() => Stakeholder)
  @IsOptional()
  stakeholders?: Stakeholder[];
  @ValidateNested({ each: true })
  @Type(() => Parameter)
  @IsOptional()
  parameters?: Parameter[];
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  modified?: string;
  @IsString()
  @IsOptional()
  touched?: string;
}

export class PagingAndSortingMetaData {
  @IsInt()
  @IsOptional()
  page?: number;
  @IsInt()
  @IsOptional()
  limit?: number;
  @IsInt()
  @IsOptional()
  count?: number;
  @IsInt()
  @IsOptional()
  totalRecords?: number;
  @IsInt()
  @IsOptional()
  totalPages?: number;
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sortBy?: string[];
  @IsString()
  @IsOptional()
  sortDirection?: string;
}

export class FindErrandsResult {
  @ValidateNested({ each: true })
  @Type(() => Errand)
  @IsOptional()
  errands?: Errand[];
  @ValidateNested()
  @Type(() => PagingAndSortingMetaData)
  @IsOptional()
  _meta?: PagingAndSortingMetaData;
}

export class ErrandApiResponse implements ApiResponse<Errand> {
  @ValidateNested()
  @Type(() => Errand)
  data!: Errand;
  @IsString()
  message!: string;
}

export class ErrandsApiResponse implements ApiResponse<FindErrandsResult> {
  @ValidateNested()
  @Type(() => FindErrandsResult)
  data!: FindErrandsResult;
  @IsString()
  message!: string;
}
