import { IsIn, IsOptional, IsString } from 'class-validator';

/**
 * What happened when a beslut was to be registered in Lifecare.
 * - REGISTERED: it is in Lifecare; `lifecareId` is Lifecare's decisionId.
 * - FAILED: Lifecare refused it; `detail` is Lifecare's reason, and careM has it too.
 * - NOT_SENT: it was never sent — `detail` says why — and is then registered directly in Lifecare.
 */
export class DecisionRegistration {
  @IsString() decisionId!: string;
  @IsIn(['REGISTERED', 'FAILED', 'NOT_SENT']) outcome!: 'REGISTERED' | 'FAILED' | 'NOT_SENT';
  @IsString() @IsOptional() lifecareId?: string;
  @IsString() @IsOptional() detail?: string;
}
