import { IsOptional, IsString } from 'class-validator';

/** The fields a handläggare sends when creating a journalanteckning (createdBy comes from auth). */
export class CreateJournalEntryDto {
  /** Journal entry type (Lifecare 'Typ'); the Swedish label from the type catalogue. */
  @IsString()
  type!: string;

  /** Heading (Lifecare 'Rubrik'). */
  @IsString()
  heading!: string;

  /** Free-text body of the entry. */
  @IsString()
  @IsOptional()
  text?: string;

  /** Documented date (yyyy-MM-dd). */
  @IsString()
  entryDate!: string;

  /** Documented time (HH:mm). */
  @IsString()
  @IsOptional()
  entryTime?: string;
}

/** The fields a handläggare sends when editing a (still WORKING) journalanteckning. */
export class UpdateJournalEntryDto {
  @IsString()
  type!: string;

  @IsString()
  heading!: string;

  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  entryDate!: string;

  @IsString()
  @IsOptional()
  entryTime?: string;
}
