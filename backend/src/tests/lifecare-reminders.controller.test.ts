import { LifecareRemindersController } from '@controllers/lifecare-reminders.controller';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { afterEach, describe, expect, it, vi } from 'vitest';

const change = { reminderDate: '2026-09-30', text: 'Kontrollera hyran', priority: 2, status: 3 };

/** careM answers a create with 201 and a change or removal with 204, all without a body; drakel answers `data: null`. */
describe('LifecareRemindersController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("answers a create careM took (201) with drakel's own empty answer", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue({ data: '', message: 'success', status: 201 });

    await expect(new LifecareRemindersController().create('errand-1', change)).resolves.toEqual({ data: null, message: 'success' });
  });

  it("answers a change careM took (204) with drakel's own empty answer", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'put').mockResolvedValue({ data: '', message: 'success', status: 204 });

    await expect(new LifecareRemindersController().update('errand-1', '40', change)).resolves.toEqual({ data: null, message: 'success' });
  });

  it("answers a removal careM took (204) with drakel's own empty answer", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'delete').mockResolvedValue({ data: '', message: 'success', status: 204 });

    await expect(new LifecareRemindersController().remove('errand-1', '40')).resolves.toEqual({ data: null, message: 'success' });
  });
});
