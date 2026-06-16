import { RequestWithUser } from '@interfaces/auth.interface';
import authMiddleware from '@middlewares/auth.middleware';
import { UploadedFileLike } from '@services/caremanagement-attachment.service';
import CaremanagementMessageService from '@services/caremanagement-message.service';
import { Response } from 'express';
import { BodyParam, Controller, Get, HttpCode, Param, Post, Req, Res, UploadedFiles, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MAX_UPLOAD_FILE_SIZE_BYTES } from '@/constants/upload';
import { HttpException } from '@/exceptions/HttpException';
import { MessagesApiResponse } from '@/responses/message.response';

const MESSAGE_BODY_MAX_LENGTH = 8192;
const MAX_MESSAGE_ATTACHMENT_FILES = 10;

const messageAttachmentUploadOptions = {
  required: false,
  options: {
    limits: {
      files: MAX_MESSAGE_ATTACHMENT_FILES,
      fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
    },
  },
};

const normalizeMessageBody = (body: unknown): string => {
  if (typeof body !== 'string') {
    throw new HttpException(400, 'Message body is required');
  }
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    throw new HttpException(400, 'Message body is required');
  }
  if (trimmedBody.length > MESSAGE_BODY_MAX_LENGTH) {
    throw new HttpException(400, `Message body must be at most ${MESSAGE_BODY_MAX_LENGTH} characters`);
  }
  return trimmedBody;
};

/** Owns the conversation-message sub-resource of an errand (list, post, download attachment). */
@Controller()
export class MessageController {
  private messageService = new CaremanagementMessageService();

  @Get('/errands/:errandId/messages')
  @OpenAPI({ summary: 'List the conversation messages for an errand' })
  @ResponseSchema(MessagesApiResponse)
  @UseBefore(authMiddleware)
  async getMessages(@Param('errandId') errandId: string) {
    const res = await this.messageService.listMessages(errandId);
    return { data: res.data, message: 'success' };
  }

  @Post('/errands/:errandId/messages')
  @HttpCode(201)
  @OpenAPI({ summary: 'Post a message (with optional attachments) to the errand conversation' })
  @UseBefore(authMiddleware)
  async createMessage(
    @Req() req: RequestWithUser,
    @Param('errandId') errandId: string,
    @BodyParam('body') body: unknown,
    @UploadedFiles('files', messageAttachmentUploadOptions) files?: UploadedFileLike[],
  ) {
    // Every message a handläggare posts is OUTBOUND (caseworker → applicant), authored by the logged-in
    // user. Both are decided here, never trusted from the client (mirrors the initiateErrand flow).
    await this.messageService.createMessage(
      errandId,
      { direction: 'OUTBOUND', body: normalizeMessageBody(body), author: req.user.username },
      files ?? [],
    );
    return { data: null, message: 'success' };
  }

  @Get('/errands/:errandId/messages/:messageId/attachments/:attachmentId/file')
  @OpenAPI({ summary: 'Download a message attachment file' })
  @UseBefore(authMiddleware)
  async streamMessageAttachmentFile(
    @Param('errandId') errandId: string,
    @Param('messageId') messageId: string,
    @Param('attachmentId') attachmentId: string,
    @Res() response: Response,
  ) {
    const file = await this.messageService.streamMessageAttachmentFile(errandId, messageId, attachmentId);
    if (file.contentType) {
      response.setHeader('Content-Type', file.contentType);
    }
    response.setHeader('Content-Disposition', `attachment; filename="${file.fileName ?? attachmentId}"`);
    return response.send(file.data);
  }
}
