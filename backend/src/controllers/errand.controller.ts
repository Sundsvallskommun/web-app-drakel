import { RequestWithUser } from '@interfaces/auth.interface';
import authMiddleware from '@middlewares/auth.middleware';
import { requireErrandWrite } from '@middlewares/permission.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ApplicantNameService from '@services/applicant-name.service';
import CaremanagementAttachmentService from '@services/caremanagement-attachment.service';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import { FINANCIAL_ASSISTANCE_TYPE_SLUG } from '@utils/caremanagement-url';
import { sendAttachment } from '@utils/send-attachment';
import { Response } from 'express';
import { Body, Controller, Get, HttpCode, Param, Patch, Post, QueryParams, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { CreateErrandDto, FindErrandsQueryDto, PatchErrandDto } from '@/dtos/errand.dto';
import { AttachmentsApiResponse } from '@/responses/attachment.response';
import { ErrandApiResponse, ErrandsApiResponse } from '@/responses/errand.response';
import { StakeholdersApiResponse } from '@/responses/stakeholder.response';

@Controller()
export class ErrandController {
  private errandService = new CaremanagementErrandService();
  private attachmentService = new CaremanagementAttachmentService();
  private stakeholderService = new CaremanagementStakeholderService();
  private applicantNameService = new ApplicantNameService();

  @Get('/errands')
  @OpenAPI({ summary: 'Search errands (paged)' })
  @ResponseSchema(ErrandsApiResponse)
  @UseBefore(authMiddleware)
  async findErrands(@QueryParams() query: FindErrandsQueryDto) {
    const res = await this.errandService.findErrands(query);
    const errands = await this.applicantNameService.addApplicantNames(res.data?.errands ?? []);
    return { data: { ...res.data, errands }, message: 'success' };
  }

  @Get('/errands/:identifier')
  @OpenAPI({ summary: 'Fetch a single errand by id or errand number' })
  @ResponseSchema(ErrandApiResponse)
  @UseBefore(authMiddleware)
  async getErrand(@Param('identifier') identifier: string) {
    const res = await this.errandService.getErrandByIdentifier(identifier);
    return { data: res.data, message: 'success' };
  }

  @Get('/errands/:errandId/application')
  @OpenAPI({ summary: 'Fetch the submitted financial-assistance application data for an errand' })
  @UseBefore(authMiddleware)
  async getApplicationData(@Param('errandId') errandId: string) {
    // The generic GET /errands/{id} omits the data payload; the financial-assistance view carries it.
    const res = await this.errandService.getFinancialAssistanceView(errandId);
    return { data: res.data?.data ?? null, message: 'success' };
  }

  @Post('/errands/initiate')
  @HttpCode(201)
  @OpenAPI({ summary: 'Create a new empty (draft) errand and return it' })
  @ResponseSchema(ErrandApiResponse)
  @UseBefore(authMiddleware, requireErrandWrite)
  async initiateErrand(@Req() req: RequestWithUser) {
    // The draft is owned by the handläggare initiating it. The frontend is tenant-agnostic and does
    // not know the user id, so we inject it here (mirrors draken's "newerrand" flow). caremanagement
    // requires a typeSlug on every errand; drakel handles ekonomiskt bistånd only.
    const draft: CreateErrandDto = {
      typeSlug: FINANCIAL_ASSISTANCE_TYPE_SLUG,
      title: 'Empty errand',
      reporterUserId: req.user.username,
      assignedUserId: req.user.username,
    };
    const res = await this.errandService.createErrand(draft);
    return { data: res.data, message: 'success' };
  }

  @Patch('/errands/:errandId')
  @OpenAPI({ summary: 'Update an errand' })
  @ResponseSchema(ErrandApiResponse)
  @UseBefore(authMiddleware, requireErrandWrite, validationMiddleware(PatchErrandDto, 'body'))
  async updateErrand(@Param('errandId') errandId: string, @Body() patch: PatchErrandDto) {
    const res = await this.errandService.updateErrand(errandId, patch);
    return { data: res.data, message: 'success' };
  }

  @Get('/errands/:errandId/attachments')
  @OpenAPI({ summary: 'List attachments for an errand' })
  @ResponseSchema(AttachmentsApiResponse)
  @UseBefore(authMiddleware)
  async getAttachments(@Param('errandId') errandId: string) {
    const res = await this.attachmentService.readAttachments(errandId);
    return { data: res.data, message: 'success' };
  }

  @Get('/errands/:errandId/attachments/:attachmentId/file')
  @OpenAPI({ summary: 'Download an attachment file' })
  @UseBefore(authMiddleware)
  async streamAttachmentFile(@Param('errandId') errandId: string, @Param('attachmentId') attachmentId: string, @Res() response: Response) {
    const file = await this.attachmentService.streamAttachmentFile(errandId, attachmentId);
    return sendAttachment(response, file, attachmentId);
  }

  @Get('/errands/:errandId/stakeholders')
  @OpenAPI({ summary: 'List stakeholders for an errand' })
  @ResponseSchema(StakeholdersApiResponse)
  @UseBefore(authMiddleware)
  async getStakeholders(@Param('errandId') errandId: string) {
    const res = await this.stakeholderService.readStakeholders(errandId);
    return { data: res.data, message: 'success' };
  }
}
