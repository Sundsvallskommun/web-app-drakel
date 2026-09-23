import { IsInt, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

/**
 * A bevakning as the handläggare fills it in — new, or changed — written straight to the errand's insats
 * in Lifecare. The priority and status are Lifecare's own codes, from the options it lists for the
 * insats; who it is "bevakad av" is not chosen — it is always the insats's handläggare.
 */
export class CreateLifecareReminderDto {
  /** Bevakningsdatum, `YYYY-MM-DD` — not before today. */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'reminderDate must be YYYY-MM-DD' })
  reminderDate!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  text!: string;

  @IsInt()
  priority!: number;

  @IsInt()
  status!: number;
}
