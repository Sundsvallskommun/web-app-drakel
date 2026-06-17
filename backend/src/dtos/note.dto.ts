import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8192)
  body!: string;
}

export class UpdateNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8192)
  body!: string;
}
