import { ApiResponse } from '@interfaces/api-service.interface';
import { IsString } from 'class-validator';

export class TreservaJournalApiResponse implements ApiResponse<string> {
  /** The journal migrated from Treserva, a PDF in base64. */
  @IsString() data!: string;
  @IsString() message!: string;
}
