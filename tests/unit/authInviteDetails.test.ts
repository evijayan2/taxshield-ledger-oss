import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import { AddressInfo } from 'net';
import { Server } from 'http';
import { prisma } from '../../server/prisma.js';
import { authRouter } from '../../server/auth/routes.js';
import { hashPassword, verifyPassword } from '../../server/auth/password.js';
import { generateOpaqueToken, hashToken } from '../../server/auth/session.js';

describe('Employee Invitation Details & Multi-Company Invitation Flow', () => {
  let server: Server;
  let baseUrl: string;

  const companyAId = `comp_a_${Date.now()}`;
  const companyBId = `comp_b_${Date.now()}`;

  const newEmployeeEmail = `new_emp_${Date.now()}@invitetest.tax`;
  const existingUserEmail = `multi_user_${Date.now()}@invitetest.tax`;
  const existingUserPassword = 'ExistingSecurePassword2026!';

  let newEmpUserId: string;
  let existingUserId: string;

  let validNewEmpRawToken: string;
  let expiredRawToken: string;
  let alreadyUsedRawToken: string;
  let companyBInviteRawToken: string;

  beforeAll(async () => {
    // Start temporary Express server to test real HTTP endpoints
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const port = (server.address() as AddressInfo).port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // Create Company A
    await prisma.company.create({
      data: {
        id: companyAId,
        name: 'Company Alpha LLC',
        ein: '11-1111111',
        stateTaxId: '11111111',
        address: '100 Alpha St',
        city: 'Philadelphia',
        state: 'PA',
        zip: '19104',
        ownerName: 'Alpha Owner',
        ownerEmail: `owner_a_${Date.now()}@invitetest.tax`,
      },
    });

    // Create Company B
    await prisma.company.create({
      data: {
        id: companyBId,
        name: 'Company Beta LLC',
        ein: '22-2222222',
        stateTaxId: '22222222',
        address: '200 Beta St',
        city: 'Pittsburgh',
        state: 'PA',
        zip: '15201',
        ownerName: 'Beta Owner',
        ownerEmail: `owner_b_${Date.now()}@invitetest.tax`,
      },
    });

    // 1. Create a brand new employee in Company A (no credentials yet)
    const newEmpUser = await prisma.user.create({
      data: {
        email: newEmployeeEmail,
        displayName: null, // intentionally null to verify employee roster fallback
        isActive: true,
        memberships: {
          create: {
            companyId: companyAId,
            role: 'EMPLOYEE',
            status: 'INVITED',
          },
        },
      },
    });
    newEmpUserId = newEmpUser.id;

    // Create employee roster record for new employee
    await prisma.employee.create({
      data: {
        id: `emp_rec_${Date.now()}`,
        companyId: companyAId,
        firstName: 'Jane',
        lastName: 'Smith',
        email: newEmployeeEmail,
        phone: '(555) 000-1111',
        ssnLastFour: '4444',
        payRate: 30.0,
        payFrequency: 'BI_WEEKLY',
        employmentType: 'W2_HOURLY',
        w4FilingStatus: 'SINGLE',
      },
    });

    // Valid invite token for new employee
    validNewEmpRawToken = generateOpaqueToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: newEmpUserId,
        tokenHash: hashToken(validNewEmpRawToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Expired invite token
    expiredRawToken = generateOpaqueToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: newEmpUserId,
        tokenHash: hashToken(expiredRawToken),
        expiresAt: new Date(Date.now() - 1000), // in the past
      },
    });

    // Already used invite token
    alreadyUsedRawToken = generateOpaqueToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: newEmpUserId,
        tokenHash: hashToken(alreadyUsedRawToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        usedAt: new Date(),
      },
    });

    // 2. Create an existing user with active membership in Company A and established credentials
    const existingPasswordHash = await hashPassword(existingUserPassword);
    const existingUser = await prisma.user.create({
      data: {
        email: existingUserEmail,
        displayName: 'John MultiUser',
        isActive: true,
        credential: {
          create: {
            passwordHash: existingPasswordHash,
          },
        },
        memberships: {
          create: {
            companyId: companyAId,
            role: 'EMPLOYEE',
            status: 'ACTIVE',
            acceptedAt: new Date(),
          },
        },
      },
    });
    existingUserId = existingUser.id;

    // Company B invites this existing user
    await prisma.companyMembership.create({
      data: {
        userId: existingUserId,
        companyId: companyBId,
        role: 'EMPLOYEE',
        status: 'INVITED',
      },
    });

    companyBInviteRawToken = generateOpaqueToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: existingUserId,
        tokenHash: hashToken(companyBInviteRawToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    await prisma.company.deleteMany({
      where: { id: { in: [companyAId, companyBId] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [newEmployeeEmail, existingUserEmail] } },
    });
    await prisma.$disconnect();
  });

  it('should reject invitation details when token parameter is missing', async () => {
    const res = await fetch(`${baseUrl}/api/auth/invitation-details`);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invitation token is required');
  });

  it('should return 400 and zero user details when token does not exist', async () => {
    const fakeToken = '0000000000000000000000000000000000000000000000000000000000000000';
    const res = await fetch(`${baseUrl}/api/auth/invitation-details?token=${fakeToken}`);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('TOKEN_EXPIRED');
    expect(data.email).toBeUndefined();
    expect(data.displayName).toBeUndefined();
  });

  it('should return 400 and zero user details when token is expired', async () => {
    const res = await fetch(`${baseUrl}/api/auth/invitation-details?token=${expiredRawToken}`);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('TOKEN_EXPIRED');
    expect(data.email).toBeUndefined();
    expect(data.displayName).toBeUndefined();
  });

  it('should return 400 and zero user details when token has already been used', async () => {
    const res = await fetch(`${baseUrl}/api/auth/invitation-details?token=${alreadyUsedRawToken}`);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('TOKEN_EXPIRED');
    expect(data.email).toBeUndefined();
    expect(data.displayName).toBeUndefined();
  });

  it('should return prepopulated employee name and email for a valid new user invitation', async () => {
    const res = await fetch(`${baseUrl}/api/auth/invitation-details?token=${validNewEmpRawToken}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.email).toBe(newEmployeeEmail);
    // Employee name resolved from Employee table 'Jane Smith'
    expect(data.displayName).toBe('Jane Smith');
    expect(data.companyName).toBe('Company Alpha LLC');
    expect(data.hasExistingAccount).toBe(false);
  });

  it('should successfully accept invitation for new user, hash password, and invalidate token', async () => {
    const newPassword = 'BrandNewPassword2026!';
    const res = await fetch(`${baseUrl}/api/auth/accept-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: validNewEmpRawToken,
        password: newPassword,
        confirmPassword: newPassword,
        displayName: 'Jane Smith',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe(newEmployeeEmail);
    expect(data.membership.status).toBe('ACTIVE');

    // Verify token was marked as used in DB
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(validNewEmpRawToken) },
    });
    expect(resetRecord?.usedAt).not.toBeNull();

    // Verifying zero data leakage: immediately trying to view invitation details with the used token
    const detailRes = await fetch(`${baseUrl}/api/auth/invitation-details?token=${validNewEmpRawToken}`);
    expect(detailRes.status).toBe(400);
    const detailData = await detailRes.json();
    expect(detailData.success).toBe(false);
    expect(detailData.code).toBe('TOKEN_EXPIRED');
    expect(detailData.email).toBeUndefined();
  });

  it('should recognize existing user from another company and indicate hasExistingAccount: true', async () => {
    const res = await fetch(`${baseUrl}/api/auth/invitation-details?token=${companyBInviteRawToken}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.email).toBe(existingUserEmail);
    expect(data.displayName).toBe('John MultiUser');
    expect(data.companyName).toBe('Company Beta LLC');
    expect(data.hasExistingAccount).toBe(true);
  });

  it('should reject acceptance of existing user invite if wrong password is provided', async () => {
    const res = await fetch(`${baseUrl}/api/auth/accept-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: companyBInviteRawToken,
        password: 'IncorrectPassword123!',
      }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Incorrect password');

    // Membership for Company B should remain INVITED
    const membership = await prisma.companyMembership.findFirst({
      where: { userId: existingUserId, companyId: companyBId },
    });
    expect(membership?.status).toBe('INVITED');
  });

  it('should authenticate existing user with their password and join Company B without overwriting credentials', async () => {
    // Fetch initial credential hash
    const initialCred = await prisma.passwordCredential.findUnique({
      where: { userId: existingUserId },
    });

    const res = await fetch(`${baseUrl}/api/auth/accept-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: companyBInviteRawToken,
        password: existingUserPassword,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe(existingUserEmail);

    // Membership for Company B must now be ACTIVE
    const membershipB = await prisma.companyMembership.findFirst({
      where: { userId: existingUserId, companyId: companyBId },
    });
    expect(membershipB?.status).toBe('ACTIVE');
    expect(membershipB?.acceptedAt).not.toBeNull();

    // User should have active memberships in BOTH Company A and Company B
    const allMemberships = await prisma.companyMembership.findMany({
      where: { userId: existingUserId, status: 'ACTIVE' },
    });
    expect(allMemberships).toHaveLength(2);

    // Password hash should NOT have been changed or corrupted
    const currentCred = await prisma.passwordCredential.findUnique({
      where: { userId: existingUserId },
    });
    expect(currentCred?.passwordHash).toBe(initialCred?.passwordHash);
  });
});

