import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8192)
  body!: string;
}

/** The note's new body — the same field as when creating it. */
export class UpdateNoteDto extends CreateNoteDto {}
