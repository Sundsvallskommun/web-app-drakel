import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError, ValidatorOptions } from 'class-validator';

import { HttpException } from '@/exceptions/HttpException';

const BAD_REQUEST = 400;

/** Every constraint an error and its nested errors (e.g. one item of an array of DTOs) break. */
const constraintsOf = (error: ValidationError): string[] =>
  error.constraints ? Object.values(error.constraints) : (error.children ?? []).flatMap(constraintsOf);

/**
 * Unknown properties are refused rather than passed on: nothing a DTO does not name reaches a handler, or upstream.
 * The default here, and what routing-controllers validates every @Body and @QueryParams DTO with (see app.ts).
 */
export const STRICT_VALIDATION: ValidatorOptions = { whitelist: true, forbidNonWhitelisted: true };

/**
 * Turns plain input — a request body, a query, or JSON that came in a multipart field — into the DTO and validates it
 * with its class-validator decorators. Input that does not validate is a 400 naming every broken constraint.
 *
 * @param type The DTO class
 * @param plain The input as it arrived
 * @param options class-validator's options; unknown properties are refused by default
 */
export const validateInput = async <T extends object>(
  type: ClassConstructor<T>,
  plain: unknown,
  options: ValidatorOptions = STRICT_VALIDATION,
): Promise<T> => {
  const input = plainToInstance(type, plain);
  const errors = await validate(input, options);
  if (errors.length > 0) {
    throw new HttpException(BAD_REQUEST, errors.flatMap(constraintsOf).join(', '));
  }
  return input;
};
