import { ApiResponse } from '@interfaces/api-service.interface';
import { Stakeholder } from '@/responses/errand.response';
import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

export class StakeholdersApiResponse implements ApiResponse<Stakeholder[]> {
  @ValidateNested({ each: true })
  @Type(() => Stakeholder)
  data!: Stakeholder[];
  @IsString()
  message!: string;
}
