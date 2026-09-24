import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

/** A beslutsformulering: its kategori and rubrik, and the Templating identifier its text is read by. */
export class DecisionPhrase {
  @IsString() identifier!: string;
  /** Beslutsformulering – kategori. */
  @IsString() category!: string;
  /** Beslutsformulering – rubrik. */
  @IsString() name!: string;
}

export class DecisionPhrasesApiResponse implements ApiResponse<DecisionPhrase[]> {
  @IsArray() @ValidateNested({ each: true }) @Type(() => DecisionPhrase) data!: DecisionPhrase[];
  @IsString() message!: string;
}
