import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

/** A journalanteckning (case-journal entry) on an errand. */
export class JournalEntry {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  @IsOptional()
  errandId?: string;
  /** Journal entry type (Lifecare 'Typ'). */
  @IsString()
  @IsOptional()
  type?: string;
  @IsString()
  @IsOptional()
  heading?: string;
  @IsString()
  @IsOptional()
  text?: string;
  /** Documented date and time (Lifecare 'Datum'/'Tid') as an ISO offset date-time. */
  @IsString()
  @IsOptional()
  entryDateTime?: string;
  /** WORKING = editable arbetsanteckning, LOCKED = upprättad handling. */
  @IsString()
  @IsOptional()
  status?: string;
  @IsString()
  @IsOptional()
  createdBy?: string;
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  updated?: string;
}

/** A selectable journal entry type (Lifecare 'Typ' catalogue). */
export class JournalEntryType {
  @IsString()
  @IsOptional()
  code?: string;
  @IsString()
  @IsOptional()
  displayName?: string;
}

export class JournalEntriesApiResponse implements ApiResponse<JournalEntry[]> {
  @ValidateNested({ each: true })
  @Type(() => JournalEntry)
  data!: JournalEntry[];
  @IsString()
  message!: string;
}

export class JournalEntryApiResponse implements ApiResponse<JournalEntry> {
  @ValidateNested()
  @Type(() => JournalEntry)
  data!: JournalEntry;
  @IsString()
  message!: string;
}

export class JournalEntryTypesApiResponse implements ApiResponse<JournalEntryType[]> {
  @ValidateNested({ each: true })
  @Type(() => JournalEntryType)
  data!: JournalEntryType[];
  @IsString()
  message!: string;
}
