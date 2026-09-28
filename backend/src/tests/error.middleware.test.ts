import errorMiddleware from '@middlewares/error.middleware';
import { UNEXPECTED_ERROR_MESSAGE } from '@utils/error-response';
import { logger } from '@utils/logger';
import { maskPersonalNumbers } from '@utils/mask-personal-numbers';
import { Request, Response } from 'express';
import { BadRequestError, NotFoundError } from 'routing-controllers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';

/** Runs the middleware on an error and answers what it sent back. */
const answer = (error: unknown): { status: number; body: unknown } => {
  const sent = { status: 0, body: undefined as unknown };
  const response = {
    status(status: number) {
      sent.status = status;
      return this;
    },
    json(body: unknown) {
      sent.body = body;
      return this;
    },
  } as unknown as Response;
  errorMiddleware(error, { method: 'GET', path: '/errands/errand-1' } as Request, response, vi.fn());
  return sent;
};

describe('errorMiddleware', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the status of routing-controllers' own errors, which carry it as httpCode", () => {
    vi.spyOn(logger, 'warn').mockReturnValue(logger);

    expect(answer(new BadRequestError('Invalid queries, check the errors property')).status).toBe(400);
    expect(answer(new NotFoundError('No route')).status).toBe(404);
  });

  it("passes careM's sentence on a refusal through to the handläggare", () => {
    vi.spyOn(logger, 'warn').mockReturnValue(logger);

    expect(answer(new HttpException(409, 'Ärendet är redan beslutat.'))).toEqual({ status: 409, body: { message: 'Ärendet är redan beslutat.' } });
  });

  it('sends an error’s details to the client but keeps them out of the log', () => {
    const error = vi.spyOn(logger, 'error').mockReturnValue(logger);

    const sent = answer(new HttpException(502, 'Ett dokument från Lifecare kunde inte hämtas.', { lifecareDocumentId: 'document-12' }));

    expect(sent).toEqual({
      status: 502,
      body: { message: 'Ett dokument från Lifecare kunde inte hämtas.', details: { lifecareDocumentId: 'document-12' } },
    });
    expect(error).toHaveBeenCalledWith(expect.not.stringContaining('document-12'));
  });

  it('answers an unexpected error with a generic 500, and logs its details only on the server', () => {
    const error = vi.spyOn(logger, 'error').mockReturnValue(logger);

    const sent = answer(new TypeError("Cannot read properties of undefined (reading 'id')"));

    expect(sent).toEqual({ status: 500, body: { message: UNEXPECTED_ERROR_MESSAGE } });
    expect(error).toHaveBeenCalledWith(expect.stringContaining("TypeError: Cannot read properties of undefined (reading 'id')"));
  });

  it('logs every failure once, with any personnummer masked', () => {
    const warn = vi.spyOn(logger, 'warn').mockReturnValue(logger);
    const error = vi.spyOn(logger, 'error').mockReturnValue(logger);

    answer(new HttpException(422, 'Ingen inkomst för 19800101-1234 i Lifecare'));

    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Ingen inkomst för [personnummer] i Lifecare'));
  });

  it("maps multer's refusals: a file too large to 413, any other limit to 400", () => {
    vi.spyOn(logger, 'warn').mockReturnValue(logger);

    expect(answer(Object.assign(new Error('File too large'), { name: 'MulterError', code: 'LIMIT_FILE_SIZE' })).status).toBe(413);
    expect(answer(Object.assign(new Error('Too many parts'), { name: 'MulterError', code: 'LIMIT_PART_COUNT' })).status).toBe(400);
  });
});

describe('maskPersonalNumbers', () => {
  it('masks personnummer and samordningsnummer in every common form', () => {
    expect(maskPersonalNumbers('19800101-1234, 198001011234, 800101-1234, 8001011234, 800101+1234')).toBe(
      '[personnummer], [personnummer], [personnummer], [personnummer], [personnummer]',
    );
  });

  it('leaves shorter and longer runs of digits alone', () => {
    expect(maskPersonalNumbers('errand 4711, amount 12500, id 1234567890123')).toBe('errand 4711, amount 12500, id 1234567890123');
  });
});
