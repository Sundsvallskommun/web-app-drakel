import { RequestWithUser } from '@interfaces/auth.interface';
import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementDocumentService from '@services/caremanagement-document.service';
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { CreateDocument, UpdateDocument } from '@/data-contracts/caremanagement/data-contracts';
import { CreateDocumentDto, UpdateDocumentDto } from '@/dtos/document.dto';
import { DocumentApiResponse, DocumentsApiResponse, DocumentTypesApiResponse } from '@/responses/document.response';

/** Owns the Dokument (formal case document) sub-resource of an errand. */
@Controller()
export class DocumentController {
  private documentService = new CaremanagementDocumentService();

  @Get('/documents/types')
  @OpenAPI({ summary: 'The selectable document types (Lifecare Typ/Dokumenttyp catalogue)' })
  @ResponseSchema(DocumentTypesApiResponse)
  @UseBefore(authMiddleware)
  async getTypes() {
    const res = await this.documentService.readTypes();
    return { data: res.data?.types ?? [], message: 'success' };
  }

  @Get('/errands/:errandId/documents')
  @OpenAPI({ summary: 'List the dokument on an errand' })
  @ResponseSchema(DocumentsApiResponse)
  @UseBefore(authMiddleware)
  async listDocuments(@Param('errandId') errandId: string) {
    const res = await this.documentService.readDocuments(errandId);
    return { data: res.data, message: 'success' };
  }

  @Post('/errands/:errandId/documents')
  @OpenAPI({ summary: 'Create a dokument on an errand' })
  @ResponseSchema(DocumentApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(CreateDocumentDto, 'body'))
  async createDocument(@Req() req: RequestWithUser, @Param('errandId') errandId: string, @Body() input: CreateDocumentDto) {
    const body: CreateDocument = {
      type: input.type,
      heading: input.heading,
      text: input.text,
      documentDate: input.documentDate,
      documentTime: input.documentTime,
      createdBy: req.user.username,
    };
    const res = await this.documentService.createDocument(errandId, body);
    return { data: res.data, message: 'success' };
  }

  @Patch('/errands/:errandId/documents/:documentId')
  @OpenAPI({ summary: 'Edit a WORKING dokument' })
  @ResponseSchema(DocumentApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(UpdateDocumentDto, 'body'))
  async updateDocument(
    @Req() req: RequestWithUser,
    @Param('errandId') errandId: string,
    @Param('documentId') documentId: string,
    @Body() input: UpdateDocumentDto,
  ) {
    const body: UpdateDocument = {
      type: input.type,
      heading: input.heading,
      text: input.text,
      documentDate: input.documentDate,
      documentTime: input.documentTime,
      modifiedBy: req.user.username,
    };
    const res = await this.documentService.updateDocument(errandId, documentId, body);
    return { data: res.data, message: 'success' };
  }

  @Post('/errands/:errandId/documents/:documentId/lock')
  @OpenAPI({ summary: 'Lock a dokument into an upprättad handling' })
  @ResponseSchema(DocumentApiResponse)
  @UseBefore(authMiddleware)
  async lockDocument(@Req() req: RequestWithUser, @Param('errandId') errandId: string, @Param('documentId') documentId: string) {
    const res = await this.documentService.lockDocument(errandId, documentId, { lockedBy: req.user.username });
    return { data: res.data, message: 'success' };
  }

  @Delete('/errands/:errandId/documents/:documentId')
  @OpenAPI({ summary: 'Delete a dokument' })
  @UseBefore(authMiddleware)
  async deleteDocument(@Param('errandId') errandId: string, @Param('documentId') documentId: string) {
    await this.documentService.deleteDocument(errandId, documentId);
    return { data: null, message: 'success' };
  }
}
