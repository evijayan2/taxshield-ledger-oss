import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../server/prisma.js';
import { hashPassword } from '../../server/auth/password.js';
import { createSession, validateSession, revokeSession } from '../../server/auth/session.js';
import { extractSessionToken, SESSION_COOKIE_NAME } from '../../server/auth/middleware.js';

describe('Auth & Company Membership Lifecycle (Database)', () => {
  const testEmail = `test_owner_${Date.now()}@authmemb.tax`;
  const employeeEmail = `test_emp_${Date.now()}@authmemb.tax`;
  let companyId: string;
  let ownerUserId: string;
  let employeeUserId: string;
  let activeOpaqueToken: string;

  beforeAll(async () => {
    // Clean any residual test users with authmemb.tax
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@authmemb.tax' } },
    });

    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Test Acme LLC',
        ein: '99-9999999',
        stateTaxId: '88888888',
        address: '100 Main St',
        city: 'Philadelphia',
        state: 'PA',
        zip: '19104',
        ownerName: 'Alice Owner',
        ownerEmail: testEmail,
      },
    });
    companyId = company.id;

    // Ensure database-level partial unique index for single active owner exists
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "company_memberships_single_active_owner_idx" 
      ON "company_memberships"("company_id") 
      WHERE "role" = 'OWNER' AND "status" = 'ACTIVE';
    `);
  });

  afterAll(async () => {
    // Cleanup created test records
    await prisma.company.deleteMany({
      where: { id: companyId },
    });
    await prisma.user.deleteMany({
      where: { email: { endsWith: '@authmemb.tax' } },
    });
    await prisma.$disconnect();
  });

  it('should create an owner user with password credential and active company membership', async () => {
    const passwordHash = await hashPassword('OwnerPass2026!');
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        displayName: 'Alice Owner',
        isActive: true,
        credential: {
          create: {
            passwordHash,
          },
        },
        memberships: {
          create: {
            companyId,
            role: 'OWNER',
            status: 'ACTIVE',
            acceptedAt: new Date(),
          },
        },
      },
      include: {
        credential: true,
        memberships: true,
      },
    });

    ownerUserId = user.id;
    expect(user.email).toBe(testEmail);
    expect(user.credential?.passwordHash).toBeTruthy();
    expect(user.memberships).toHaveLength(1);
    expect(user.memberships[0].role).toBe('OWNER');
    expect(user.memberships[0].status).toBe('ACTIVE');
  });

  it('should enforce single active owner constraint per company at database level', async () => {
    const secondOwnerEmail = `second_owner_${Date.now()}@authmemb.tax`;
    const secondUser = await prisma.user.create({
      data: {
        email: secondOwnerEmail,
        displayName: 'Second Owner',
        isActive: true,
      },
    });

    // Attempting to create a second ACTIVE OWNER for the same company must fail
    await expect(
      prisma.companyMembership.create({
        data: {
          userId: secondUser.id,
          companyId,
          role: 'OWNER',
          status: 'ACTIVE',
        },
      })
    ).rejects.toThrow();

    await prisma.user.delete({ where: { id: secondUser.id } });
  });

  it('should create a session, validate it, and return authenticated user and active membership', async () => {
    const { opaqueToken, expiresAt } = await createSession(ownerUserId);
    activeOpaqueToken = opaqueToken;

    expect(opaqueToken).toBeTruthy();
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const authSession = await validateSession(opaqueToken);
    expect(authSession).not.toBeNull();
    expect(authSession?.user.id).toBe(ownerUserId);
    expect(authSession?.user.email).toBe(testEmail);
    expect(authSession?.membership?.role).toBe('OWNER');
    expect(authSession?.membership?.companyId).toBe(companyId);
  });

  it('should extract session token from cookie or Authorization header', () => {
    const mockCookieReq: any = { cookies: { [SESSION_COOKIE_NAME]: 'cookie_token_123' }, headers: {} };
    expect(extractSessionToken(mockCookieReq)).toBe('cookie_token_123');

    const mockHeaderReq: any = { cookies: {}, headers: { authorization: 'Bearer bearer_token_456' } };
    expect(extractSessionToken(mockHeaderReq)).toBe('bearer_token_456');

    const mockEmptyReq: any = { cookies: {}, headers: {} };
    expect(extractSessionToken(mockEmptyReq)).toBeNull();
  });

  it('should allow creating an invited employee and activating on invite acceptance', async () => {
    const empUser = await prisma.user.create({
      data: {
        email: employeeEmail,
        displayName: 'Bob Employee',
        isActive: true,
        memberships: {
          create: {
            companyId,
            role: 'EMPLOYEE',
            status: 'INVITED',
            invitedBy: ownerUserId,
          },
        },
      },
      include: {
        memberships: true,
      },
    });
    employeeUserId = empUser.id;

    expect(empUser.memberships[0].role).toBe('EMPLOYEE');
    expect(empUser.memberships[0].status).toBe('INVITED');

    // Simulate accept invitation
    await prisma.companyMembership.updateMany({
      where: { userId: employeeUserId, status: 'INVITED' },
      data: { status: 'ACTIVE', acceptedAt: new Date() },
    });

    const activeEmp = await prisma.companyMembership.findFirst({
      where: { userId: employeeUserId, status: 'ACTIVE' },
    });
    expect(activeEmp?.status).toBe('ACTIVE');
    expect(activeEmp?.role).toBe('EMPLOYEE');
  });

  it('should revoke a session on logout', async () => {
    await revokeSession(activeOpaqueToken);
    const authSessionAfterRevoke = await validateSession(activeOpaqueToken);
    expect(authSessionAfterRevoke).toBeNull();
  });

  it('should reject validation for deactivated users', async () => {
    const { opaqueToken } = await createSession(employeeUserId);
    // Deactivate user
    await prisma.user.update({
      where: { id: employeeUserId },
      data: { isActive: false },
    });

    const session = await validateSession(opaqueToken);
    expect(session).toBeNull();
  });

  it('should store and retrieve company address, zip code, payroll schedule, and tax filing schedule', async () => {
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        address: '1500 Market St, Suite 2500',
        city: 'Philadelphia',
        state: 'PA',
        zip: '19102',
        payFrequency: 'BI_WEEKLY',
        stateFilingFrequency: 'MONTHLY',
      },
    });

    expect(updatedCompany.address).toBe('1500 Market St, Suite 2500');
    expect(updatedCompany.city).toBe('Philadelphia');
    expect(updatedCompany.state).toBe('PA');
    expect(updatedCompany.zip).toBe('19102');
    expect(updatedCompany.payFrequency).toBe('BI_WEEKLY');
    expect(updatedCompany.stateFilingFrequency).toBe('MONTHLY');
  });
});
