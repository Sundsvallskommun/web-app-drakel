import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

/** A handläggare's approval of one EB view section. */
export class SectionApproval {
  /** The section this approval concerns: CALCULATION / PAYMENT / DECISION. */
  @IsString()
  @IsOptional()
  section?: string;
  @IsBoolean()
  @IsOptional()
  approved?: boolean;
  @IsString()
  @IsOptional()
  approvedBy?: string;
  @IsString()
  @IsOptional()
  approvedAt?: string;
}

/** The approval state of the three EB view sections. */
export class SectionApprovals {
  @ValidateNested()
  @Type(() => SectionApproval)
  @IsOptional()
  calculation?: SectionApproval;
  @ValidateNested()
  @Type(() => SectionApproval)
  @IsOptional()
  payment?: SectionApproval;
  @ValidateNested()
  @Type(() => SectionApproval)
  @IsOptional()
  decision?: SectionApproval;
}

export class SectionApprovalsApiResponse implements ApiResponse<SectionApprovals> {
  @ValidateNested()
  @Type(() => SectionApprovals)
  data!: SectionApprovals;
  @IsString()
  message!: string;
}

export class SectionApprovalApiResponse implements ApiResponse<SectionApproval> {
  @ValidateNested()
  @Type(() => SectionApproval)
  data!: SectionApproval;
  @IsString()
  message!: string;
}
