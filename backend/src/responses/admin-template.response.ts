import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

/** A managed template as the admin list shows it — content excluded. */
export class AdminTemplate {
  @IsString() identifier!: string;
  /** The latest stored version, e.g. "1.2". */
  @IsString() @IsOptional() version?: string;
  @IsString() name!: string;
  @IsString() @IsOptional() description?: string;
  /** The CM type code the template belongs to (journal entry type or document type). */
  @IsString() code!: string;
  /** DOCUMENT = mall, PHRASE = frastext. */
  @IsString() kind!: string;
}

/** A managed template including its decoded HTML content, ready for the rich-text editor. */
export class AdminTemplateDetail extends AdminTemplate {
  @IsString() content!: string;
}

export class AdminTemplatesApiResponse implements ApiResponse<AdminTemplate[]> {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminTemplate)
  data!: AdminTemplate[];
  @IsString()
  message!: string;
}

export class AdminTemplateApiResponse implements ApiResponse<AdminTemplateDetail> {
  @ValidateNested()
  @Type(() => AdminTemplateDetail)
  data!: AdminTemplateDetail;
  @IsString()
  message!: string;
}
