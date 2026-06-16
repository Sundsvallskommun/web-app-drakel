import axios from 'axios';

import { HttpException } from '@/exceptions/HttpException';

/**
 * Maps a failed caremanagement call onto the HttpException drakel returns to the frontend.
 *
 * Shared by every caremanagement service so the same upstream status always surfaces the same way
 * (e.g. a 413 on the attachment path and a 413 on the message path both reach the client as 413,
 * instead of one collapsing to a generic 500). Anything unrecognised becomes a 500.
 */
export const caremanagementError = (error: unknown): HttpException => {
  if (axios.isAxiosError(error)) {
    switch (error.response?.status) {
      case 400:
        return new HttpException(400, 'Bad request from caremanagement');
      case 404:
        return new HttpException(404, 'Not found');
      case 413:
        return new HttpException(413, 'Uploaded file is too large');
      default:
        break;
    }
  }
  return new HttpException(500, 'Internal server error from caremanagement');
};
