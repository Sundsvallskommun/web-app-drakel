import { AdminTemplateController } from '@controllers/admin-template.controller';
import TemplatingService from '@services/templating.service';
import { appTemplateMetadata } from '@utils/template-metadata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';

const ownTemplate = {
  identifier: 'drakel.fa.letter.document.beslut.x1',
  name: 'Beslut',
  metadata: appTemplateMetadata('LETTER', 'DOCUMENT'),
  content: '<p>Hej</p>',
};
const foreignTemplate = {
  identifier: 'bygglov.beslut',
  name: 'Bygglovsbeslut',
  metadata: [{ key: 'app', value: 'bygglov' }],
  content: '<p>Bygglov</p>',
};

const saveInput = { name: 'Beslut', code: 'LETTER', kind: 'DOCUMENT' as const, content: '<p>Ny version</p>' };

describe('AdminTemplateController', () => {
  let store: ReturnType<typeof vi.spyOn<TemplatingService, 'storeTemplate'>>;
  let remove: ReturnType<typeof vi.spyOn<TemplatingService, 'deleteTemplate'>>;

  beforeEach(() => {
    vi.spyOn(TemplatingService.prototype, 'listTemplates').mockResolvedValue([ownTemplate, foreignTemplate]);
    vi.spyOn(TemplatingService.prototype, 'getTemplate').mockImplementation(identifier => {
      const template = [ownTemplate, foreignTemplate].find(candidate => candidate.identifier === identifier);
      return template ? Promise.resolve(template) : Promise.reject(new HttpException(404, 'Not found'));
    });
    store = vi.spyOn(TemplatingService.prototype, 'storeTemplate').mockResolvedValue();
    remove = vi.spyOn(TemplatingService.prototype, 'deleteTemplate').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves a new version of one of this app's templates", async () => {
    const saved = await new AdminTemplateController().saveTemplate({ ...saveInput, identifier: ownTemplate.identifier });

    expect(store).toHaveBeenCalledWith(expect.objectContaining({ identifier: ownTemplate.identifier, content: '<p>Ny version</p>' }));
    expect(saved.data.map(template => template.identifier)).toEqual([ownTemplate.identifier]);
  });

  it("refuses to store over another app's template in the shared catalogue", async () => {
    await expect(new AdminTemplateController().saveTemplate({ ...saveInput, identifier: foreignTemplate.identifier })).rejects.toMatchObject({
      status: 403,
    });
    expect(store).not.toHaveBeenCalled();
  });

  it('refuses to store under an identifier no template has — a new template gets one built here', async () => {
    await expect(new AdminTemplateController().saveTemplate({ ...saveInput, identifier: 'drakel.fa.made.up' })).rejects.toMatchObject({
      status: 404,
    });
    expect(store).not.toHaveBeenCalled();
  });

  it("deletes one of this app's templates, never another app's", async () => {
    await new AdminTemplateController().deleteTemplate(ownTemplate.identifier);
    expect(remove).toHaveBeenCalledWith(ownTemplate.identifier);

    remove.mockClear();
    await expect(new AdminTemplateController().deleteTemplate(foreignTemplate.identifier)).rejects.toMatchObject({ status: 403 });
    expect(remove).not.toHaveBeenCalled();
  });
});
