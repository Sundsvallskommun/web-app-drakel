import { IsOptional, IsString, MaxLength } from 'class-validator';

/** The fields a handläggare sends when creating a journalanteckning (createdBy comes from auth). */
export class CreateJournalEntryDto {
  /** Journal entry type (Lifecare 'Typ'); the Swedish label from the type catalogue. */
  @IsString()
  @MaxLength(255)
  type!: string;

  /** Heading (Lifecare 'Rubrik'). */
  @IsString()
  @MaxLength(255)
  heading!: string;

  /** Free-text body of the entry. */
  @IsString()
  @MaxLength(1048576)
  @IsOptional()
  text?: string;

  /** Documented date and time (Lifecare 'Datum'/'Tid') as an ISO offset date-time, e.g. 2025-05-30T14:30:00+02:00. */
  @IsString()
  entryDateTime!: string;
}

/** The fields a handläggare sends when editing a (still WORKING) journalanteckning. */
export class UpdateJournalEntryDto {
  @IsString()
  @MaxLength(255)
  type!: string;

  @IsString()
  @MaxLength(255)
  heading!: string;

  @IsString()
  @MaxLength(1048576)
  @IsOptional()
  text?: string;

  @IsString()
  entryDateTime!: string;
}
