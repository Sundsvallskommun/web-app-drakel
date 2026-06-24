import authMiddleware from '@middlewares/auth.middleware';
import CaremanagementFormSnapshotService from '@services/caremanagement-form-snapshot.service';
import { Controller, Get, Param, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { HttpException } from '@/exceptions/HttpException';
import { FormSnapshotApiResponse } from '@/responses/form-snapshot.response';

/**
 * Serves the immutable form snapshot of a financial-assistance errand — the application form captured
 * exactly as the applicant saw and answered it, re-rendered as the Ansökan sammanställning. The snapshot
 * is write-once; caremanagement 404s when none was captured, which we surface as a clean empty result
 * (data: null) so the UI can show an "ingen sammanställning" state rather than an error.
 */
@Controller()
export class FormSnapshotController {
  private formSnapshotService = new CaremanagementFormSnapshotService();

  @Get('/errands/:errandId/form-snapshot')
  @OpenAPI({ summary: 'Read the captured application form snapshot for an errand (null when none captured)' })
  @ResponseSchema(FormSnapshotApiResponse)
  @UseBefore(authMiddleware)
  async getFormSnapshot(@Param('errandId') errandId: string) {
    try {
      const res = await this.formSnapshotService.readFormSnapshot(errandId);
      return { data: res.data, message: 'success' };
    } catch (error) {
      if (error instanceof HttpException && error.status === 404) {
        return { data: null, message: 'No form snapshot captured' };
      }
      throw error;
    }
  }
}
