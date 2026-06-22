import { IsBoolean } from 'class-validator';

/** Sets the approval state of an EB view section (the handläggare is taken from the auth context). */
export class SetSectionApprovalDto {
  /** True to approve the section, false to withdraw the approval. */
  @IsBoolean()
  approved!: boolean;
}
