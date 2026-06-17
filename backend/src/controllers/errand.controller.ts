import { CAREMANAGEMENT_TYPE_SLUG } from '@config';
import { RequestWithUser } from '@interfaces/auth.interface';
import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementAttachmentService from '@services/caremanagement-attachment.service';
import { UploadedFileLike } from '@services/caremanagement-attachment.service';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import { Response } from 'express';
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, QueryParams, Req, Res, UploadedFile, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MAX_UPLOAD_FILE_SIZE_BYTES } from '@/constants/upload';
import { CreateErrandDto, FindErrandsQueryDto, PatchErrandDto } from '@/dtos/errand.dto';
import { CreateStakeholderDto } from '@/dtos/stakeholder.dto';
import { AttachmentsApiResponse } from '@/responses/attachment.response';
import { ErrandApiResponse, ErrandsApiResponse } from '@/responses/errand.response';
import { StakeholdersApiResponse } from '@/responses/stakeholder.response';

// caremanagement requires a typeSlug on every errand. Until per-type modules are configured this is
// a single configured value (env override, with a sensible default).
const DEFAULT_TYPE_SLUG = 'financial-assistance';

// TODO: hardcoded for now — no ROLE metadata configured yet. Every added stakeholder gets PRIMARY.
const DEFAULT_STAKEHOLDER_ROLE = 'PRIMARY';

const singleAttachmentUploadOptions = {
  options: {
    limits: {
      files: 1,
      fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
    },
  },
};

@Controller()
export class ErrandController {
  private errandService = new CaremanagementErrandService();
  private attachmentService = new CaremanagementAttachmentService();
  private stakeholderService = new CaremanagementStakeholderService();

  @Get('/errands')
  @OpenAPI({ summary: 'Search errands (paged)' })
  @ResponseSchema(ErrandsApiResponse)
  @UseBefore(authMiddleware)
  async findErrands(@QueryParams() query: FindErrandsQueryDto) {
    const res = await this.errandService.findErrands(query);
    return { data: res.data, message: 'success' };
  }

  @Get('/errands/:identifier')
  @OpenAPI({ summary: 'Fetch a single errand by id or errand number' })
  @ResponseSchema(ErrandApiResponse)
  @UseBefore(authMiddleware)
  async getErrand(@Param('identifier') identifier: string) {
    const res = await this.errandService.getErrandByIdentifier(identifier);
    return { data: res.data, message: 'success' };
  }

  @Post('/errands')
  @HttpCode(201)
  @OpenAPI({ summary: 'Create an errand' })
  @ResponseSchema(ErrandApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(CreateErrandDto, 'body'))
  async createErrand(@Body() errand: CreateErrandDto) {
    const res = await this.errandService.createErrand(errand);
    return { data: res.data, message: 'success' };
  }

  @Post('/errands/initiate')
  @HttpCode(201)
  @OpenAPI({ summary: 'Create a new empty (draft) errand and return it' })
  @ResponseSchema(ErrandApiResponse)
  @UseBefore(authMiddleware)
  async initiateErrand(@Req() req: RequestWithUser) {
    // The draft is owned by the handläggare initiating it. The frontend is tenant-agnostic and does
    // not know the user id, so we inject it here (mirrors draken's "newerrand" flow).
    const draft: CreateErrandDto = {
      typeSlug: CAREMANAGEMENT_TYPE_SLUG ?? DEFAULT_TYPE_SLUG,
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
  @UseBefore(authMiddleware, validationMiddleware(PatchErrandDto, 'body'))
  async updateErrand(@Param('errandId') errandId: string, @Body() patch: PatchErrandDto) {
    const res = await this.errandService.updateErrand(errandId, patch);
    return { data: res.data, message: 'success' };
  }

  @Delete('/errands/:errandId')
  @OpenAPI({ summary: 'Delete an errand' })
  @UseBefore(authMiddleware)
  async deleteErrand(@Param('errandId') errandId: string) {
    await this.errandService.deleteErrand(errandId);
    return { data: null, message: 'success' };
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
    if (file.contentType) {
      response.setHeader('Content-Type', file.contentType);
    }
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName ?? attachmentId}"`);
    return response.send(file.data);
  }

  @Post('/errands/:errandId/attachments')
  @HttpCode(201)
  @OpenAPI({ summary: 'Upload a new attachment' })
  @UseBefore(authMiddleware)
  async createAttachment(@Param('errandId') errandId: string, @UploadedFile('file', singleAttachmentUploadOptions) file: UploadedFileLike) {
    const res = await this.attachmentService.createAttachment(errandId, file);
    return { data: res.data, message: 'success' };
  }

  @Get('/errands/:errandId/stakeholders')
  @OpenAPI({ summary: 'List stakeholders for an errand' })
  @ResponseSchema(StakeholdersApiResponse)
  @UseBefore(authMiddleware)
  async getStakeholders(@Param('errandId') errandId: string) {
    const res = await this.stakeholderService.readStakeholders(errandId);
    return { data: res.data, message: 'success' };
  }

  @Post('/errands/:errandId/stakeholders')
  @HttpCode(201)
  @OpenAPI({ summary: 'Add a stakeholder to an errand' })
  @UseBefore(authMiddleware, validationMiddleware(CreateStakeholderDto, 'body'))
  async createStakeholder(@Param('errandId') errandId: string, @Body() stakeholder: CreateStakeholderDto) {
    await this.stakeholderService.createStakeholder(errandId, Object.assign({}, stakeholder, { role: DEFAULT_STAKEHOLDER_ROLE }));
    return { data: null, message: 'success' };
  }
}
