import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

/** A Lifecare aktualisering (case intake) the applicant has, as the handläggare picks one to archive to. */
export class Actualisation {
  @IsInt() @IsOptional() id?: number;
  @IsString() @IsOptional() type?: string;
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() date?: string;
  @IsString() @IsOptional() reason?: string;
  @IsString() @IsOptional() regards?: string;
  @IsString() @IsOptional() fromWho?: string;
  @IsString() @IsOptional() caseworker?: string;
  @IsString() @IsOptional() organization?: string;
  @IsString() @IsOptional() status?: string;
  @IsInt() @IsOptional() investigationId?: number;
  @IsInt() @IsOptional() serviceId?: number;
  @IsInt() @IsOptional() decisionId?: number;
}

export class ActualisationsApiResponse implements ApiResponse<Actualisation[]> {
  @ValidateNested({ each: true })
  @Type(() => Actualisation)
  data!: Actualisation[];
  @IsString()
  message!: string;
}
