import { LifecareCalculationController } from '@controllers/lifecare-calculation.controller';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('LifecareCalculationController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('answers data: null while careM has no beräkning saved in Lifecare (its 204)', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: '', message: 'success', status: 204 });

    expect(await new LifecareCalculationController().read('errand-1')).toEqual({ data: null, message: 'success' });
  });

  it("answers careM's raw PDF as base64 in drakel's envelope", async () => {
    const pdf = new TextEncoder().encode('%PDF-1.7');
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: pdf.buffer, message: 'success', status: 200 });

    expect(await new LifecareCalculationController().pdf('errand-1')).toEqual({
      data: Buffer.from('%PDF-1.7').toString('base64'),
      message: 'success',
    });
  });
});
