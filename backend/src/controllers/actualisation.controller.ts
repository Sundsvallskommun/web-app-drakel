import authMiddleware from '@middlewares/auth.middleware';
import CaremanagementActualisationService from '@services/caremanagement-actualisation.service';
import CaremanagementAttachmentService from '@services/caremanagement-attachment.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import { Controller, Get, HttpCode, Param, Post, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { AttachmentOriginEnum } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';
import { ActualisationsApiResponse } from '@/responses/actualisation.response';

/**
 * Lets the handläggare pick one of the applicant's Lifecare aktualiseringar and archive the errand's
 * generated application PDF onto it. Archiving stamps the chosen aktualisering onto the errand
 * (caremanagement records a Decision(ACTUALISATION)). Used by the supplementary-application flow.
 */
@Controller()
export class ActualisationController {
  private actualisationService = new CaremanagementActualisationService();
  private attachmentService = new CaremanagementAttachmentService();
  private stakeholderService = new CaremanagementStakeholderService();

  @Get('/errands/:errandId/actualisations')
  @OpenAPI({ summary: "List the applicant's Lifecare aktualiseringar" })
  @ResponseSchema(ActualisationsApiResponse)
  @UseBefore(authMiddleware)
  async list(@Param('errandId') errandId: string) {
    const stakeholders = await this.stakeholderService.readStakeholders(errandId);
    const applicantPartyId = (stakeholders.data ?? []).find((stakeholder) => stakeholder.role === 'APPLICANT')
      ?.externalId;
    if (!applicantPartyId) {
      return { data: [], message: 'No applicant partyId on errand' };
    }
    const res = await this.actualisationService.listActualisations(applicantPartyId);
    return { data: res.data ?? [], message: 'success' };
  }

  @Post('/errands/:errandId/actualisations/:actualisationId/archive')
  @HttpCode(204)
  @OpenAPI({ summary: "Archive the errand's CASE_DATA PDF to a chosen aktualisering (stamps the errand)" })
  @UseBefore(authMiddleware)
  async archive(@Param('errandId') errandId: string, @Param('actualisationId') actualisationId: string) {
    const attachments = await this.attachmentService.readAttachments(errandId);
    const caseData = (attachments.data ?? []).find(
      (attachment) => attachment.origin === AttachmentOriginEnum.CASE_DATA
    );
    if (!caseData?.id) {
      throw new HttpException(404, 'No application PDF (CASE_DATA) to archive');
    }
    const file = await this.attachmentService.streamAttachmentFile(errandId, caseData.id);
    await this.actualisationService.archive(actualisationId, file, { errandId });
    return { message: 'success' };
  }
}
