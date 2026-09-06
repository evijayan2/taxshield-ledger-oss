import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../server/prisma.js';
import { hashPassword, verifyPassword } from '../../server/auth/password.js';

describe('Owner & Employee Security Credentials and Password Management', () => {
  const companyId = `comp_cred_${Date.now()}`;
  let ownerUserId: string;
  let employeeUserId: string;
  const initialOwnerEmail = `owner_cred_${Date.now()}@credtest.tax`;
  const initialEmployeeEmail = `emp_cred_${Date.now()}@credtest.tax`;
  const initialPassword = 'InitialSecurePassword2026!';

  beforeAll(async () => {
    // Create company
    await prisma.company.create({
      data: {
        id: companyId,
        name: 'Credential Test LLC',
        ein: '88-1234567',
        stateTaxId: '76543210',
        address: '500 Market St',
        city: 'Philadelphia',
        state: 'PA',
        zip: '19106',
        ownerName: 'Owner User',
        ownerEmail: initialOwnerEmail,
      },
    });

    const initialHash = await hashPassword(initialPassword);

    // Create Owner user and credential
    const owner = await prisma.user.create({
      data: {
        email: initialOwnerEmail,
        displayName: 'Owner User',
        isActive: true,
        credential: {
          create: {
            passwordHash: initialHash,
          },
        },
        memberships: {
          create: {
            companyId,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        },
      },
    });
    ownerUserId = owner.id;

    // Create Employee user and credential
    const employee = await prisma.user.create({
      data: {
        email: initialEmployeeEmail,
        displayName: 'Employee User',
        isActive: true,
        credential: {
          create: {
            passwordHash: initialHash,
          },
        },
        memberships: {
          create: {
            companyId,
            role: 'EMPLOYEE',
            status: 'ACTIVE',
          },
        },
      },
    });
    employeeUserId = employee.id;
  });

  afterAll(async () => {
    await prisma.company.deleteMany({
      where: { id: companyId },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [ownerUserId, employeeUserId] } },
    });
    await prisma.$disconnect();
  });

  it('should verify current password correctly', async () => {
    const cred = await prisma.passwordCredential.findUnique({
      where: { userId: ownerUserId },
    });
    expect(cred).not.toBeNull();
    const matches = await verifyPassword(initialPassword, cred!.passwordHash);
    expect(matches).toBe(true);

    const wrongMatches = await verifyPassword('WrongPassword123!', cred!.passwordHash);
    expect(wrongMatches).toBe(false);
  });

  it('should update owner email and password with valid current password', async () => {
    const cred = await prisma.passwordCredential.findUnique({
      where: { userId: ownerUserId },
    });
    const isValid = await verifyPassword(initialPassword, cred!.passwordHash);
    expect(isValid).toBe(true);

    const updatedOwnerEmail = `new_owner_${Date.now()}@example.com`;
    const newOwnerPassword = 'NewOwnerPassword2026!';
    const newHash = await hashPassword(newOwnerPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: ownerUserId },
        data: { email: updatedOwnerEmail },
      }),
      prisma.company.update({
        where: { id: companyId },
        data: { ownerEmail: updatedOwnerEmail },
      }),
      prisma.passwordCredential.update({
        where: { userId: ownerUserId },
        data: { passwordHash: newHash },
      }),
    ]);

    const updatedUser = await prisma.user.findUnique({ where: { id: ownerUserId } });
    expect(updatedUser?.email).toBe(updatedOwnerEmail);

    const updatedCompany = await prisma.company.findUnique({ where: { id: companyId } });
    expect(updatedCompany?.ownerEmail).toBe(updatedOwnerEmail);

    const updatedCred = await prisma.passwordCredential.findUnique({ where: { userId: ownerUserId } });
    const verifiedNew = await verifyPassword(newOwnerPassword, updatedCred!.passwordHash);
    expect(verifiedNew).toBe(true);
  });

  it('should allow employee to update password without modifying email/username', async () => {
    const empCred = await prisma.passwordCredential.findUnique({
      where: { userId: employeeUserId },
    });
    const isValid = await verifyPassword(initialPassword, empCred!.passwordHash);
    expect(isValid).toBe(true);

    const newEmpPassword = 'NewEmployeePassword2026!';
    const newEmpHash = await hashPassword(newEmpPassword);

    await prisma.passwordCredential.update({
      where: { userId: employeeUserId },
      data: { passwordHash: newEmpHash },
    });

    const updatedEmpCred = await prisma.passwordCredential.findUnique({ where: { userId: employeeUserId } });
    const verifiedNew = await verifyPassword(newEmpPassword, updatedEmpCred!.passwordHash);
    expect(verifiedNew).toBe(true);

    // Email remains unchanged
    const empUser = await prisma.user.findUnique({ where: { id: employeeUserId } });
    expect(empUser?.email).toBe(initialEmployeeEmail);
  });

  it('should allow owner to trigger password reset token and audit log for employee', async () => {
    // Generate a reset token for the employee as triggered by the owner
    const tokenHash = `sample_hash_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const resetRecord = await prisma.passwordResetToken.create({
      data: {
        userId: employeeUserId,
        tokenHash,
        expiresAt,
      },
    });

    expect(resetRecord.id).toBeTruthy();
    expect(resetRecord.userId).toBe(employeeUserId);
    expect(resetRecord.expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Record audit trail entry
    const audit = await prisma.auditLogEntry.create({
      data: {
        companyId,
        action: 'UPDATE',
        entityType: 'STAFF_PASSWORD_RESET',
        entityId: employeeUserId,
        actorId: ownerUserId,
        previousState: { email: initialEmployeeEmail },
        newState: { resetTokenIssued: true, recipient: initialEmployeeEmail },
        reason: `Owner triggered employee password reset email for ${initialEmployeeEmail}`,
      },
    });

    expect(audit.actorId).toBe(ownerUserId);
    expect(audit.entityType).toBe('STAFF_PASSWORD_RESET');
  });
});
