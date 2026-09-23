import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * A new betalningsmottagare, written straight to Lifecare. The betalsätt is Lifecare's own code, from the
 * payment options it lists for the insats; clearing and account number are filled in as the betalsätt
 * needs them.
 */
export class CreateLifecarePayeeDto {
  /** The account holder. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  /** The label in Lifecare's list; the account holder's name when left out. */
  @IsString()
  @MaxLength(255)
  @IsOptional()
  payeeName?: string;

  /** Lifecare's betalsätt code. */
  @IsInt()
  paymentMethod!: number;

  @IsString()
  @MaxLength(16)
  @IsOptional()
  clearing?: string;

  @IsString()
  @MaxLength(64)
  @IsOptional()
  accountNumber?: string;
}
