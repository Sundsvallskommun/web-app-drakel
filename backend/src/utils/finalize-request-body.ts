import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { FinalizeErrandDto } from '@/dtos/finalize.dto';
import { HttpException } from '@/exceptions/HttpException';

const BAD_REQUEST = 400;

/**
 * The finalize request as the multipart request's `request` field carries it — JSON beside the uploaded files —
 * checked like any other request body. A request that is missing, not JSON or not valid is a 400.
 */
export const parseFinalizeRequest = async (request: string | undefined): Promise<FinalizeErrandDto> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(request ?? '');
  } catch {
    throw new HttpException(BAD_REQUEST, 'The finalize request is missing or not JSON');
  }
  const input = plainToInstance(FinalizeErrandDto, parsed);
  const errors = await validate(input, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length > 0) {
    throw new HttpException(BAD_REQUEST, errors.map(error => Object.values(error.constraints ?? {}).join(', ')).join(', '));
  }
  return input;
};

/**
 * Refuses any file that is not a PDF: a letter and a digital mail take nothing else. Checked before the errand is
 * finalized, so a wrong file stops the whole send rather than leaving a beslut sent without it.
 */
export const assertOnlyPdfs = (files: { mimetype: string; originalname: string }[]): void => {
  const notPdf = files.find(file => file.mimetype !== 'application/pdf');
  if (notPdf) {
    throw new HttpException(BAD_REQUEST, `${notPdf.originalname} är inte en PDF. Bara PDF-filer kan skickas med beslutet.`);
  }
};
