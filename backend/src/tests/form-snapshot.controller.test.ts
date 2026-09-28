import { FormSnapshotController } from '@controllers/form-snapshot.controller';
import CaremanagementFormSnapshotService from '@services/caremanagement-form-snapshot.service';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';

describe('FormSnapshotController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Regression: `error instanceof HttpException` is always false (routing-controllers' HttpError resets the
  // prototype), so careM's 404 used to reach the handläggare as an error instead of "ingen sammanställning".
  it('answers data: null when careM has no snapshot for the errand (its 404)', async () => {
    vi.spyOn(CaremanagementFormSnapshotService.prototype, 'readFormSnapshot').mockRejectedValue(new HttpException(404, 'Not found'));

    await expect(new FormSnapshotController().getFormSnapshot('errand-1')).resolves.toEqual({ data: null, message: 'No form snapshot captured' });
  });

  it('passes any other failure on', async () => {
    vi.spyOn(CaremanagementFormSnapshotService.prototype, 'readFormSnapshot').mockRejectedValue(new HttpException(502, 'careM svarade inte'));

    await expect(new FormSnapshotController().getFormSnapshot('errand-1')).rejects.toMatchObject({ status: 502 });
  });
});
