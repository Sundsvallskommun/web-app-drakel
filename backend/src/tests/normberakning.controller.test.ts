import { NormberakningController } from '@controllers/normberakning.controller';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('NormberakningController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('answers data: null when careM has no previous beräkning (its 204)', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: '', message: 'success', status: 204 });

    expect(await new NormberakningController().getPrevious('errand-1')).toEqual({ data: null, message: 'success' });
  });

  it('answers data: null once careM has changed a row (its 204)', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'patch').mockResolvedValue({ data: '', message: 'success', status: 204 });

    expect(await new NormberakningController().updateRow('errand-1', 'incomes', '1', { applicantCaseworkerAmount: 100 })).toEqual({
      data: null,
      message: 'success',
    });
  });

  it('never forwards an unknown section to careM', async () => {
    const post = vi.spyOn(CaremanagementApiService.prototype, 'post');

    await expect(new NormberakningController().addRow('errand-1', 'households', {})).rejects.toMatchObject({ status: 400 });
    expect(post).not.toHaveBeenCalled();
  });
});
