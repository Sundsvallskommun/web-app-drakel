import authMiddleware from '@middlewares/auth.middleware';
import ActiveDirectoryService from '@services/active-directory.service';
import { Controller, Get, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { AdministratorsApiResponse } from '@/responses/administrator.response';

/** Exposes the handläggare roster (from Active Directory) for the assignee picker and the overview filter. */
@Controller()
export class AdministratorController {
  private activeDirectoryService = new ActiveDirectoryService();

  @Get('/administrators')
  @OpenAPI({ summary: 'List handläggare from Active Directory (degrades to an empty list when AD is unavailable)' })
  @ResponseSchema(AdministratorsApiResponse)
  @UseBefore(authMiddleware)
  async listAdministrators() {
    try {
      const users = await this.activeDirectoryService.searchUsers();
      const administrators = users
        .filter((user) => user.name)
        .map((user) => ({ username: user.name, displayName: user.displayName ?? user.name, description: user.description }));
      return { data: administrators, message: 'success' };
    } catch {
      // AD is optional/mocked — never fail the request, just return no handläggare.
      return { data: [], message: 'success' };
    }
  }
}
