import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementSectionApprovalService from '@services/caremanagement-section-approval.service';
import { Body, Controller, Get, Param, Patch, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { SectionApprovalRequest } from '@/data-contracts/caremanagement/data-contracts';
import { SetSectionApprovalDto } from '@/dtos/section-approval.dto';
import { SectionApprovalApiResponse, SectionApprovalsApiResponse } from '@/responses/section-approval.response';

/** Owns the handläggare approval state of the three EB view sections (calculation / payment / decision). */
@Controller()
export class SectionApprovalController {
  private approvalService = new CaremanagementSectionApprovalService();

  @Get('/errands/:errandId/sections/approvals')
  @OpenAPI({ summary: 'The approval state of the three EB view sections' })
  @ResponseSchema(SectionApprovalsApiResponse)
  @UseBefore(authMiddleware)
  async getApprovals(@Param('errandId') errandId: string) {
    const res = await this.approvalService.readApprovals(errandId);
    return { data: res.data, message: 'success' };
  }

  @Patch('/errands/:errandId/sections/:section/approval')
  @OpenAPI({ summary: 'Approve a section or withdraw its approval' })
  @ResponseSchema(SectionApprovalApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(SetSectionApprovalDto, 'body'))
  async setApproval(@Param('errandId') errandId: string, @Param('section') section: string, @Body() body: SetSectionApprovalDto) {
    // caremanagement derives the approving handläggare from the X-Sent-By header the transport stamps.
    const request: SectionApprovalRequest = { approved: body.approved };
    const res = await this.approvalService.setApproval(errandId, section, request);
    return { data: res.data, message: 'success' };
  }
}
