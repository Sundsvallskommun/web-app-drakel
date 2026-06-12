import { ContactChannel } from '@/responses/errand.response';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

/** Fields accepted when adding a stakeholder to an errand. */
export class CreateStakeholderDto {
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
  externalId?: string;
  @IsString()
  @IsOptional()
  externalIdType?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactChannel)
  @IsOptional()
  contactChannels?: ContactChannel[];
}
