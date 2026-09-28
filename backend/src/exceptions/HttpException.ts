import { ValidationError } from 'class-validator';
import { HttpError } from 'routing-controllers';

export class HttpException extends HttpError {
  public status: number;
  public override message: string;
  public errors: ValidationError[] = [];
  /**
   * Facts for the client beside the message, e.g. which document failed. Sent in the error response but never written
   * to the log, so they may name what the log must not.
   */
  public details?: Record<string, string>;

  constructor(status: number, message: string, details?: Record<string, string>) {
    super(status, message);
    this.status = status;
    this.message = message;
    this.details = details;
  }
}
