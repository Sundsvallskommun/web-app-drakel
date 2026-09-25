import { RequestWithUser } from '@interfaces/auth.interface';
import authMiddleware from '@middlewares/auth.middleware';
import { UploadedFileLike } from '@services/caremanagement-attachment.service';
import ErrandFinalizeService from '@services/errand-finalize.service';
import { assertOnlyPdfs, parseFinalizeRequest } from '@utils/finalize-request-body';
import { BodyParam, Controller, Param, Post, Req, UploadedFiles, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MAX_UPLOAD_FILE_SIZE_BYTES } from '@/constants/upload';
import { FinalizeApiResponse } from '@/responses/finalize.response';

const MAX_ATTACHED_FILES = 10;

const attachedFileOptions = {
  required: false,
  options: { limits: { files: MAX_ATTACHED_FILES, fileSize: MAX_UPLOAD_FILE_SIZE_BYTES } },
};

/**
 * "Skicka beräkning och beslut" — finalizes a financial-assistance errand and sends the handläggare's message, with
 * the beslut, the beräkning and any files they added, to the applicant.
 */
@Controller()
export class FinalizeController {
  private finalizeService = new ErrandFinalizeService();

  @Post('/errands/:errandId/finalize')
  @OpenAPI({
    summary:
      'Skicka beräkning och beslut: finalize the errand in caremanagement, which records the beslut saved in Lifecare, then send the message with the chosen attachments',
    requestBody: {
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['request'],
            properties: {
              request: { description: 'A FinalizeErrandDto as JSON', type: 'string' },
              files: { type: 'array', items: { type: 'string', format: 'binary' }, description: "PDFs from the handläggare's computer" },
            },
          },
        },
      },
    },
  })
  @ResponseSchema(FinalizeApiResponse)
  @UseBefore(authMiddleware)
  async finalize(
    @Req() req: RequestWithUser,
    @Param('errandId') errandId: string,
    // A multipart text field, so typed `string`: routing-controllers would try to JSON-parse any other type itself.
    @BodyParam('request') request: string,
    @UploadedFiles('files', attachedFileOptions) files?: UploadedFileLike[],
  ) {
    const input = await parseFinalizeRequest(request);
    assertOnlyPdfs(files ?? []);
    const result = await this.finalizeService.finalize(errandId, input, req.user.username, files ?? []);
    return { data: result, message: 'success' };
  }
}
