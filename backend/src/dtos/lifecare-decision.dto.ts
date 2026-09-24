import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A beslut as the handläggare saves it on the Beslut tab. It is written straight to Lifecare — created
 * the first time, changed after that. Beslutstyp and orsak are Lifecare's own codes, picked from its lists.
 */
export class SaveLifecareDecisionDto {
  /** Lifecare's beslutstyp code, from the beslutstyper the insats offers. */
  @IsInt()
  decisionCode!: number;

  /** The beslutsdatum, `YYYY-MM-DD`; Lifecare's proposal (today) when left out. */
  @IsString()
  @Matches(DATE_PATTERN, { message: 'date must be YYYY-MM-DD' })
  @IsOptional()
  date?: string;

  @IsString()
  @Matches(DATE_PATTERN, { message: 'periodFrom must be YYYY-MM-DD' })
  @IsOptional()
  periodFrom?: string;

  @IsString()
  @Matches(DATE_PATTERN, { message: 'periodTo must be YYYY-MM-DD' })
  @IsOptional()
  periodTo?: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  /** Lifecare's code for the sökandes orsak, from the orsaker of the beslutstyp. */
  @IsInt()
  @IsOptional()
  reasonCode?: number;

  /** The beslutsmeddelande as HTML. */
  @IsString()
  @MaxLength(1048576)
  @IsOptional()
  decisionMessage?: string;

  /**
   * "Spara och skrivskydda beslut": saves the beslut write-protected in Lifecare (its meddelande locked), after
   * which it can no longer be changed from Drakel.
   */
  @IsBoolean()
  @IsOptional()
  writeProtect?: boolean;
}
