import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@config', () => ({
  AUTHORIZED_GROUPS: 'sg_appl_draken',
  ADMIN_GROUP: 'sg_draken_handlaggare',
  TEMPLATE_ADMIN_GROUP: 'sg_draken_mallar',
  LOG_ADMIN_GROUP: 'sg_draken_loggar',
}));

// The logger is stubbed out: importing the real one creates a log directory from config, which this
// test's config mock deliberately does not carry.
vi.mock('@utils/logger', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));

const loadService = async () => import('@services/authorization.service');

describe('getPermissions', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('grants nothing to a user in none of the configured groups', async () => {
    const { getPermissions } = await loadService();

    expect(getPermissions(['SG_Appl_Draken'])).toEqual({
      canEditErrands: false,
      canManageTemplates: false,
      canViewEventLog: false,
    });
  });

  it('keeps the two halves of the admin section apart', async () => {
    // The groups are configured separately because maintaining the shared mallar and following up who
    // read which errand are different jobs — one must never carry the other with it.
    const { getPermissions } = await loadService();

    expect(getPermissions(['SG_Draken_Mallar'])).toMatchObject({
      canManageTemplates: true,
      canViewEventLog: false,
    });
    expect(getPermissions(['SG_Draken_Loggar'])).toMatchObject({
      canManageTemplates: false,
      canViewEventLog: true,
    });
  });

  it('does not let an admin-section group imply handläggning', async () => {
    const { getPermissions } = await loadService();

    expect(getPermissions(['SG_Draken_Mallar']).canEditErrands).toBe(false);
    expect(getPermissions(['SG_Draken_Loggar']).canEditErrands).toBe(false);
  });

  it('gives a user in several groups everything those groups grant', async () => {
    const { getPermissions } = await loadService();

    expect(getPermissions(['SG_Draken_Handlaggare', 'SG_Draken_Loggar'])).toEqual({
      canEditErrands: true,
      canManageTemplates: false,
      canViewEventLog: true,
    });
  });

  it('matches group names regardless of casing', async () => {
    const { getPermissions } = await loadService();

    expect(getPermissions(['sg_DRAKEN_mallar']).canManageTemplates).toBe(true);
  });
});

describe('getRole', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('summarises either half of the admin section as superadmin', async () => {
    const { getRole } = await loadService();

    expect(getRole(['SG_Draken_Loggar'])).toBe('app_superadmin');
    expect(getRole(['SG_Draken_Mallar'])).toBe('app_superadmin');
  });

  it('reports the handläggare group as admin and anything else as read', async () => {
    const { getRole } = await loadService();

    expect(getRole(['SG_Draken_Handlaggare'])).toBe('app_admin');
    expect(getRole(['SG_Appl_Draken'])).toBe('app_read');
  });
});
