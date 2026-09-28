import { UploadedFileLike } from '@interfaces/file.interface';

import { FinalizeErrandDto } from '@/dtos/finalize.dto';
import { HttpException } from '@/exceptions/HttpException';
import { validateInput } from '@/utils/validate-input';

const BAD_REQUEST = 400;

/** Every PDF starts with this header; a file that does not is not a PDF, whatever MIME type the browser sent. */
const PDF_SIGNATURE = '%PDF-';

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
  return validateInput(FinalizeErrandDto, parsed);
};

/** Whether the file both says it is a PDF and starts like one — the MIME type alone is only the browser's claim. */
const isPdf = (file: UploadedFileLike): boolean =>
  file.mimetype === 'application/pdf' && file.buffer.subarray(0, PDF_SIGNATURE.length).toString('latin1') === PDF_SIGNATURE;

/**
 * Refuses any file that is not a PDF: a meddelande and a brev with the beslut take nothing else. Checked before the
 * errand is finalized, so a wrong file stops the whole send rather than leaving a beslut sent without it.
 */
export const assertOnlyPdfs = (files: UploadedFileLike[]): void => {
  const notPdf = files.find(file => !isPdf(file));
  if (notPdf) {
    throw new HttpException(BAD_REQUEST, `${notPdf.originalname} är inte en PDF. Bara PDF-filer kan skickas med beslutet.`);
  }
};
