import { httpStatusOf } from '@utils/http-error-status';
import { describe, expect, it } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';

describe('httpStatusOf', () => {
  it("reads an HttpException's status, which instanceof HttpException cannot see", () => {
    expect(httpStatusOf(new HttpException(404, 'Not found'))).toBe(404);
  });

  it('has no status for any other error', () => {
    expect(httpStatusOf(new Error('boom'))).toBeUndefined();
    expect(httpStatusOf('boom')).toBeUndefined();
  });
});
