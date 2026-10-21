import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { normalizeEmail, hashPassword, verifyPassword } from './password.js';
import { createSession, revokeSession, revokeAllUserSessions, hashToken, generateOpaqueToken, DEFAULT_SESSION_DURATION_MS } from './session.js';
import { requireAuth, requireOwner, extractSessionToken, SESSION_COOKIE_NAME, AuthenticatedRequest } from './middleware.js';
import { loginLimiter, resetLimiter, inviteLimiter } from './rateLimiter.js';
import { getEmailProvider } from './email/index.js';
import { getActiveCompanyForUser } from './companyContext.js';
import { SUPPORTED_STATES } from '../../src/utils/supportedStates.js';
import { isValidEin, isValidEmail, formatEin } from '../../src/utils/validators.js';

export const authRouter = Router();

// Cookie helper
function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    path: '/',
  });
}

/**
 * GET /api/auth/supported-states
 * Returns the list of states with verified tax rule details in the ledger engine.
 */
authRouter.get('/supported-states', (_req: Request, res: Response) => {
  res.json({
    success: true,
    states: SUPPORTED_STATES,
  });
});

/**
 * GET /api/auth/bootstrap-status
 * Determines if initial company & owner setup is required.
 */
authRouter.get('/bootstrap-status', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    const existingCompany = await prisma.company.findFirst({
      select: {
        id: true,
        name: true,
        ein: true,
        stateTaxId: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        ownerEmail: true,
        ownerName: true,
        stateFilingFrequency: true,
        payFrequency: true,
      },
    });

    if (userCount === 0) {
      res.json({
        bootstrapRequired: true,
        hasCompany: Boolean(existingCompany),
        company: existingCompany || null,
      });
      return;
    }

    res.json({
      bootstrapRequired: false,
      hasCompany: true,
    });
  } catch (err: any) {
    console.error('Error checking bootstrap status:', err);
    res.status(500).json({ success: false, error: err.message || 'Database check failed' });
  }
});

/**
 * POST /api/auth/bootstrap
 * Unified bootstrap endpoint: creates Company + Primary Owner User + Credential + Session atomically.
 */
authRouter.post('/bootstrap', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      res.status(409).json({
        success: false,
        error: 'System is already initialized. Bootstrap is locked.',
      });
      return;
    }

    // Verify that tax rules have been ingested from TaxPack server before allowing company creation
    const activeRuleCount = await prisma.taxRuleVersion.count({
      where: { status: 'ACTIVE' },
    });

    if (activeRuleCount === 0) {
      res.status(400).json({
        success: false,
        error: 'Company creation blocked: No active regulatory tax rules ingested. Please ensure TaxPack server package sync completes first.',
      });
      return;
    }

    const {
      companyName,
      ein,
      stateTaxId,
      address,
      city,
      state,
      zip,
      companyEmail,
      stateFilingFrequency,
      payFrequency,
      ownerEmail,
      email,
      password,
      confirmPassword,
      displayName,
    } = req.body;

    const finalCompanyName = (companyName || '').trim();
    const finalEin = (ein || '').trim();
    const targetEmail = normalizeEmail(email || ownerEmail || companyEmail || '');
    const userDisplayName = (displayName || '').trim();

    if (!finalCompanyName) {
      res.status(400).json({ success: false, error: 'Company Legal Name is required.' });
      return;
    }

    if (!isValidEin(finalEin)) {
      res.status(400).json({ success: false, error: 'A valid 9-digit Federal EIN (XX-XXXXXXX) is required.' });
      return;
    }

    if (!targetEmail || !isValidEmail(targetEmail)) {
      res.status(400).json({ success: false, error: 'A valid owner email address is required.' });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({ success: false, error: 'Passwords do not match.' });
      return;
    }

    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      // Upsert company
      const existingCompany = await tx.company.findFirst();
      let company;
      if (existingCompany) {
        company = await tx.company.update({
          where: { id: existingCompany.id },
          data: {
            name: finalCompanyName,
            ein: finalEin,
            stateTaxId: (stateTaxId || '').trim(),
            address: (address || '').trim(),
            city: (city || '').trim(),
            state: (state || 'PA').trim(),
            zip: (zip || '').trim(),
            ownerName: userDisplayName || 'Managing Owner',
            ownerEmail: targetEmail,
            stateFilingFrequency: stateFilingFrequency || 'MONTHLY',
            payFrequency: payFrequency || 'BI_WEEKLY',
          },
        });
      } else {
        company = await tx.company.create({
          data: {
            name: finalCompanyName,
            ein: finalEin,
            stateTaxId: (stateTaxId || '').trim(),
            address: (address || '').trim(),
            city: (city || '').trim(),
            state: (state || 'PA').trim(),
            zip: (zip || '').trim(),
            ownerName: userDisplayName || 'Managing Owner',
            ownerEmail: targetEmail,
            stateFilingFrequency: stateFilingFrequency || 'MONTHLY',
            payFrequency: payFrequency || 'BI_WEEKLY',
          },
        });
      }

      // Create owner user
      const newUser = await tx.user.create({
        data: {
          email: targetEmail,
          displayName: userDisplayName || 'Managing Owner',
          isActive: true,
        },
      });

      // Create password credential
      await tx.passwordCredential.create({
        data: {
          userId: newUser.id,
          passwordHash,
        },
      });

      // Create owner membership
      const membership = await tx.companyMembership.create({
        data: {
          userId: newUser.id,
          companyId: company.id,
          role: 'OWNER',
          status: 'ACTIVE',
          acceptedAt: new Date(),
        },
      });

      // Ensure default TaxYear 2026 exists
      const existingTaxYear = await tx.taxYear.findFirst({
        where: { companyId: company.id, year: 2026 },
      });
      if (!existingTaxYear) {
        await tx.taxYear.create({
          data: {
            companyId: company.id,
            year: 2026,
            status: 'OPEN',
          },
        });
      }

      return { user: newUser, membership, company };
    });

    // Create session & set cookie
    const { opaqueToken, expiresAt } = await createSession(result.user.id);
    setSessionCookie(res, opaqueToken, expiresAt);

    res.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
      },
      membership: {
        id: result.membership.id,
        companyId: result.membership.companyId,
        role: result.membership.role,
        status: result.membership.status,
      },
    });
  } catch (err: any) {
    console.error('Unified bootstrap error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/bootstrap/company
 * Step 1 of bootstrap: register or configure the company details.
 */
authRouter.post('/bootstrap/company', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      res.status(409).json({
        success: false,
        error: 'System is already initialized. Bootstrap is locked.',
      });
      return;
    }

    const {
      name,
      ein,
      stateTaxId,
      address,
      city,
      state,
      zip,
      ownerName,
      ownerEmail,
      ownerTaxBracket,
      stateFilingFrequency,
      payFrequency,
    } = req.body;

    if (!name || !ein) {
      res.status(400).json({
        success: false,
        error: 'Company legal name and EIN are required.',
      });
      return;
    }

    const cleanOwnerEmail = normalizeEmail(ownerEmail || '');

    // Upsert first company
    const existing = await prisma.company.findFirst();
    let company;
    if (existing) {
      company = await prisma.company.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          ein: ein.trim(),
          stateTaxId: (stateTaxId || '').trim(),
          address: (address || '').trim(),
          city: (city || '').trim(),
          state: (state || 'PA').trim(),
          zip: (zip || '').trim(),
          ownerName: (ownerName || '').trim(),
          ownerEmail: cleanOwnerEmail,
          ownerTaxBracket: typeof ownerTaxBracket === 'number' ? ownerTaxBracket : 24.0,
          stateFilingFrequency: stateFilingFrequency || 'MONTHLY',
          payFrequency: payFrequency || 'BI_WEEKLY',
        },
      });
    } else {
      company = await prisma.company.create({
        data: {
          name: name.trim(),
          ein: ein.trim(),
          stateTaxId: (stateTaxId || '').trim(),
          address: (address || '').trim(),
          city: (city || '').trim(),
          state: (state || 'PA').trim(),
          zip: (zip || '').trim(),
          ownerName: (ownerName || '').trim(),
          ownerEmail: cleanOwnerEmail,
          ownerTaxBracket: typeof ownerTaxBracket === 'number' ? ownerTaxBracket : 24.0,
          stateFilingFrequency: stateFilingFrequency || 'MONTHLY',
          payFrequency: payFrequency || 'BI_WEEKLY',
        },
      });
    }

    res.json({
      success: true,
      companyId: company.id,
      companyName: company.name,
      defaultOwnerEmail: company.ownerEmail,
    });
  } catch (err: any) {
    console.error('Error during company bootstrap:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/bootstrap/owner
 * Step 2 of bootstrap: create the primary owner account and membership.
 */
authRouter.post('/bootstrap/owner', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      res.status(409).json({
        success: false,
        error: 'System is already initialized. Bootstrap is locked.',
      });
      return;
    }

    const { companyId, email, password, confirmPassword, displayName } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      res.status(400).json({ success: false, error: 'Passwords do not match.' });
      return;
    }

    const cleanEmail = normalizeEmail(email);

    // Target company
    let targetCompany = null;
    if (companyId) {
      targetCompany = await prisma.company.findUnique({ where: { id: companyId } });
    }
    if (!targetCompany) {
      targetCompany = await prisma.company.findFirst();
    }

    if (!targetCompany) {
      res.status(400).json({
        success: false,
        error: 'Please register your company in Step 1 before creating the owner account.',
      });
      return;
    }

    const passwordHash = await hashPassword(password);

    // Create user, credential, and owner membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: cleanEmail,
          displayName: displayName?.trim() || targetCompany?.ownerName || 'Managing Owner',
          isActive: true,
        },
      });

      await tx.passwordCredential.create({
        data: {
          userId: newUser.id,
          passwordHash,
        },
      });

      const membership = await tx.companyMembership.create({
        data: {
          userId: newUser.id,
          companyId: targetCompany.id,
          role: 'OWNER',
          status: 'ACTIVE',
          acceptedAt: new Date(),
        },
      });

      return { user: newUser, membership };
    });

    // Create initial session
    const { opaqueToken, expiresAt } = await createSession(result.user.id);
    setSessionCookie(res, opaqueToken, expiresAt);

    res.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
      },
      membership: {
        id: result.membership.id,
        companyId: result.membership.companyId,
        role: result.membership.role,
        status: result.membership.status,
      },
    });
  } catch (err: any) {
    console.error('Error during owner bootstrap:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/login
 * Standard email & password authentication.
 */
authRouter.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        credential: true,
        memberships: {
          where: { status: { in: ['ACTIVE', 'DEACTIVATED'] } },
          take: 1,
        },
      },
    });

    if (!user || !user.credential || !user.isActive) {
      if (process.env.NODE_ENV !== 'production') {
        if (!user) console.warn(`[Auth Login] Failed: User "${cleanEmail}" not found in database.`);
        else if (!user.isActive) console.warn(`[Auth Login] Failed: User "${cleanEmail}" is deactivated.`);
        else if (!user.credential) console.warn(`[Auth Login] Failed: User "${cleanEmail}" has no password credential set up (invited employee).`);
      }
      res.status(401).json({
        success: false,
        error: !user || user.credential ? 'Invalid email or password.' : 'This account has not set a password yet. Please check your invitation link or contact the company owner.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const isMatch = await verifyPassword(password, user.credential.passwordHash);
    if (!isMatch) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[Auth Login] Failed: Password does not match for user "${cleanEmail}".`);
      }
      res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    const { opaqueToken, expiresAt } = await createSession(user.id);
    setSessionCookie(res, opaqueToken, expiresAt);

    const activeMembership = user.memberships[0] || null;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      membership: activeMembership
        ? {
            id: activeMembership.id,
            companyId: activeMembership.companyId,
            role: activeMembership.role,
            status: activeMembership.status,
          }
        : null,
      expiresAt,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Authentication service error' });
  }
});

/**
 * POST /api/auth/logout
 * Terminates the active session and clears the cookie.
 */
authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = extractSessionToken(req);
    if (token) {
      await revokeSession(token);
    }
    clearSessionCookie(res);
    res.json({ success: true, message: 'Signed out successfully.' });
  } catch (err: any) {
    console.error('Logout error:', err);
    clearSessionCookie(res);
    res.json({ success: true });
  }
});

/**
 * GET /api/auth/me
 * Hydrates the current user and active membership from the session cookie.
 */
authRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeRecord = req.user?.email
      ? await prisma.employee.findFirst({
          where: { email: { equals: req.user.email, mode: 'insensitive' } },
          select: { id: true, firstName: true, lastName: true, isActive: true, email: true },
        })
      : null;

    const isReadOnly = req.membership?.role === 'EMPLOYEE' && (req.membership?.status === 'DEACTIVATED' || employeeRecord?.isActive === false);

    res.json({
      success: true,
      user: req.user,
      session: req.sessionInfo,
      membership: req.membership,
      employeeProfile: employeeRecord,
      isReadOnly,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/reset-request
 * Generates a password reset token and sends an email.
 */
authRouter.post('/reset-request', resetLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const genericSuccess = {
      success: true,
      message: 'If an account exists with this email, instructions to reset your password have been sent.',
    };

    if (!email) {
      res.json(genericSuccess);
      return;
    }

    const cleanEmail = normalizeEmail(email);
    console.log(`\n================== [TAXSHIELD AUTH: PASSWORD RESET REQUEST] ==================`);
    console.log(`Requested Email: "${cleanEmail}"`);

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !user.isActive) {
      const allUsers = await prisma.user.findMany({ select: { email: true, isActive: true } });
      const accountsList = allUsers.map(u => `${u.email} (${u.isActive ? 'active' : 'inactive'})`).join(', ');
      console.warn(`[TaxShield Auth] WARNING: Account "${cleanEmail}" NOT FOUND or inactive in PostgreSQL database!`);
      console.warn(`[TaxShield Auth] Existing users in database: [${accountsList}]`);
      console.warn(`[TaxShield Auth] No reset token was generated because the email does not match any registered user.`);
      console.log(`================================================================================\n`);
      res.json(genericSuccess);
      return;
    }

    // Invalidate existing active reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const rawToken = generateOpaqueToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const origin = req.headers.origin || `http://localhost:${process.env.PORT || 3000}`;
    const resetUrl = `${origin}?token=${rawToken}&action=reset`;

    console.log(`[TaxShield Auth] SUCCESS: Reset token generated for "${user.email}".`);
    console.log(`[TaxShield Auth] Reset Link: ${resetUrl}`);
    console.log(`================================================================================\n`);

    const emailProvider = getEmailProvider();
    await emailProvider.send({
      to: user.email,
      subject: 'TaxShield Ledger — Password Reset Request',
      textBody: `Hello,\n\nA request was made to reset the password for your TaxShield Ledger account (${user.email}).\n\nClick the link below to set a new password:\n${resetUrl}\n\nThis link is valid for 1 hour.\nIf you did not request this, please disregard this email.`,
      htmlBody: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">TaxShield Ledger</h2>
          <p>Hello,</p>
          <p>A request was made to reset the password for your account (<strong>${user.email}</strong>).</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Reset Password
            </a>
          </p>
          <p style="font-size: 12px; color: #64748b;">This link expires in 1 hour.<br/>If you did not make this request, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.json(genericSuccess);
  } catch (err: any) {
    console.error('Password reset request error:', err);
    res.json({
      success: true,
      message: 'If an account exists with this email, instructions to reset your password have been sent.',
    });
  }
});

/**
 * POST /api/auth/reset-confirm
 * Sets a new password using a valid single-use reset token.
 */
authRouter.post('/reset-confirm', async (req: Request, res: Response) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ success: false, error: 'Token and new password are required.' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
      return;
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      res.status(400).json({ success: false, error: 'Passwords do not match.' });
      return;
    }

    const tokenHash = hashToken(token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt.getTime() <= Date.now()) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired password reset link. Please request a new one.',
        code: 'TOKEN_INVALID',
      });
      return;
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.passwordCredential.upsert({
        where: { userId: resetRecord.userId },
        update: { passwordHash },
        create: { userId: resetRecord.userId, passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Invalidate all active sessions for security
    await revokeAllUserSessions(resetRecord.userId);
    clearSessionCookie(res);

    res.json({
      success: true,
      email: resetRecord.user.email,
      message: 'Password successfully updated. Please sign in with your new credentials.',
    });
  } catch (err: any) {
    console.error('Password reset confirm error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/invite
 * Owner invites an employee into the company.
 */
authRouter.post('/invite', requireAuth, requireOwner, inviteLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, displayName } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Employee email address is required.' });
      return;
    }

    const cleanEmail = normalizeEmail(email);
    const companyId = req.membership?.companyId;

    if (!companyId) {
      res.status(400).json({ success: false, error: 'No active company context found.' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          displayName: displayName?.trim() || null,
          isActive: true,
        },
      });
    } else if (displayName?.trim() && (!user.displayName || user.displayName !== displayName.trim())) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { displayName: displayName.trim() },
      });
    }

    // Check if membership exists
    let membership = await prisma.companyMembership.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId,
        },
      },
    });

    if (membership && membership.status === 'ACTIVE') {
      res.status(400).json({
        success: false,
        error: 'This user is already an active member of your company.',
      });
      return;
    }

    if (!membership) {
      membership = await prisma.companyMembership.create({
        data: {
          userId: user.id,
          companyId,
          role: 'EMPLOYEE',
          status: 'INVITED',
          invitedBy: req.user?.id,
        },
      });
    }

    // Generate invite token with 7-day validity
    const rawToken = generateOpaqueToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const origin = req.headers.origin || `http://localhost:${process.env.PORT || 3000}`;
    const inviteUrl = `${origin}?token=${rawToken}&action=invite`;

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const emailProvider = getEmailProvider();

    await emailProvider.send({
      to: cleanEmail,
      subject: `Invitation to join ${company?.name || 'TaxShield Ledger'}`,
      textBody: `Hello,\n\nYou have been invited by ${req.user?.displayName || 'the Managing Owner'} to join ${company?.name || 'TaxShield Ledger'} as an Employee.\n\nClick the link below to set your account password and join:\n${inviteUrl}\n\nThis invitation is valid for 7 days.`,
      htmlBody: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">${company?.name || 'TaxShield Ledger'}</h2>
          <p>Hello,</p>
          <p>You have been invited to join <strong>${company?.name || 'TaxShield Ledger'}</strong> as an employee.</p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #059669; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Accept Invitation & Set Password
            </a>
          </p>
          <p style="font-size: 12px; color: #64748b;">This invitation link expires in 7 days.</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: `Invitation successfully sent to ${cleanEmail}.`,
    });
  } catch (err: any) {
    console.error('Error inviting employee:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/auth/invitation-details
 * Fetches invitation metadata (email, employee name, company name, existing account flag).
 * Returns zero user details if token is expired, invalid, or already used.
 */
authRouter.get('/invitation-details', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, error: 'Invitation token is required.' });
      return;
    }

    const tokenHash = hashToken(token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            credential: true,
            memberships: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt.getTime() <= Date.now()) {
      res.status(400).json({
        success: false,
        error: 'This invitation link has expired or has already been used. Please contact your company administrator.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    const invitedMembership = resetRecord.user.memberships?.find((m) => m.status === 'INVITED');

    const employeeRecord = await prisma.employee.findFirst({
      where: {
        email: { equals: resetRecord.user.email, mode: 'insensitive' },
        ...(invitedMembership?.companyId ? { companyId: invitedMembership.companyId } : {}),
      },
      select: { firstName: true, lastName: true },
    });

    const displayName = (
      employeeRecord
        ? `${employeeRecord.firstName || ''} ${employeeRecord.lastName || ''}`.trim()
        : (resetRecord.user.displayName || '')
    ).trim();

    const companyName = invitedMembership?.company?.name || resetRecord.user.memberships?.[0]?.company?.name || 'TaxShield Ledger';
    const hasExistingAccount = Boolean(resetRecord.user.credential?.passwordHash);

    res.json({
      success: true,
      email: resetRecord.user.email,
      displayName,
      companyName,
      hasExistingAccount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/accept-invite
 * Invited user sets password (or verifies existing password if already registered) and activates membership.
 */
authRouter.post('/accept-invite', async (req: Request, res: Response) => {
  try {
    const { token, password, confirmPassword, displayName } = req.body;

    if (!token || !password) {
      res.status(400).json({ success: false, error: 'Token and password are required.' });
      return;
    }

    const tokenHash = hashToken(token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            credential: true,
            memberships: true,
          },
        },
      },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt.getTime() <= Date.now()) {
      res.status(400).json({
        success: false,
        error: 'This invitation link has expired or has already been used. Please request a new invitation.',
        code: 'TOKEN_INVALID',
      });
      return;
    }

    const hasExistingAccount = Boolean(resetRecord.user.credential?.passwordHash);

    if (hasExistingAccount) {
      // Existing user: authenticate with their current account password
      const isMatch = await verifyPassword(password, resetRecord.user.credential!.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          error: 'Incorrect password. Please enter your existing account password to accept this invitation.',
        });
        return;
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetRecord.userId },
          data: {
            displayName: displayName?.trim() || resetRecord.user.displayName,
            isActive: true,
          },
        }),
        prisma.companyMembership.updateMany({
          where: {
            userId: resetRecord.userId,
            status: 'INVITED',
          },
          data: {
            status: 'ACTIVE',
            acceptedAt: new Date(),
          },
        }),
        prisma.passwordResetToken.update({
          where: { id: resetRecord.id },
          data: { usedAt: new Date() },
        }),
      ]);
    } else {
      // New user: set password with confirmation check
      if (password.length < 8) {
        res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
        return;
      }

      if (confirmPassword && password !== confirmPassword) {
        res.status(400).json({ success: false, error: 'Passwords do not match.' });
        return;
      }

      const passwordHash = await hashPassword(password);

      await prisma.$transaction([
        prisma.passwordCredential.upsert({
          where: { userId: resetRecord.userId },
          update: { passwordHash },
          create: { userId: resetRecord.userId, passwordHash },
        }),
        prisma.user.update({
          where: { id: resetRecord.userId },
          data: {
            displayName: displayName?.trim() || resetRecord.user.displayName,
            isActive: true,
          },
        }),
        prisma.companyMembership.updateMany({
          where: {
            userId: resetRecord.userId,
            status: 'INVITED',
          },
          data: {
            status: 'ACTIVE',
            acceptedAt: new Date(),
          },
        }),
        prisma.passwordResetToken.update({
          where: { id: resetRecord.id },
          data: { usedAt: new Date() },
        }),
      ]);
    }

    // Auto login
    const { opaqueToken, expiresAt } = await createSession(resetRecord.userId);
    setSessionCookie(res, opaqueToken, expiresAt);

    const activeMembership = await prisma.companyMembership.findFirst({
      where: { userId: resetRecord.userId, status: 'ACTIVE' },
      orderBy: { acceptedAt: 'desc' },
    });

    res.json({
      success: true,
      user: {
        id: resetRecord.user.id,
        email: resetRecord.user.email,
        displayName: displayName || resetRecord.user.displayName,
      },
      membership: activeMembership,
    });
  } catch (err: any) {
    console.error('Error accepting invitation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/update-credentials
 * Updates own account credentials (password and/or owner email).
 */
authRouter.post('/update-credentials', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newEmail, newPassword, confirmPassword, displayName } = req.body;
    const userId = req.user?.id;
    const companyId = req.membership?.companyId;

    if (!userId || !companyId) {
      res.status(401).json({ success: false, error: 'Unauthorized request.' });
      return;
    }

    if (!currentPassword) {
      res.status(400).json({ success: false, error: 'Current password is required to update credentials.' });
      return;
    }

    const cred = await prisma.passwordCredential.findUnique({
      where: { userId },
    });

    if (!cred) {
      res.status(400).json({ success: false, error: 'Account credentials not found.' });
      return;
    }

    const isMatch = await verifyPassword(currentPassword, cred.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Current password does not match.' });
      return;
    }

    let cleanNewEmail: string | null = null;
    const isOwner = req.membership?.role === 'OWNER';

    if (newEmail && newEmail.trim() !== '') {
      if (!isOwner) {
        res.status(403).json({ success: false, error: 'Employee email addresses are managed by company administration.' });
        return;
      }
      cleanNewEmail = normalizeEmail(newEmail);
      if (!cleanNewEmail.includes('@')) {
        res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
        return;
      }
      if (cleanNewEmail !== req.user?.email) {
        const existing = await prisma.user.findUnique({ where: { email: cleanNewEmail } });
        if (existing) {
          res.status(409).json({ success: false, error: 'An account with this email already exists.' });
          return;
        }
      }
    }

    let newPasswordHash: string | null = null;
    if (newPassword && newPassword.trim() !== '') {
      if (newPassword.length < 8) {
        res.status(400).json({ success: false, error: 'New password must be at least 8 characters long.' });
        return;
      }
      if (confirmPassword && newPassword !== confirmPassword) {
        res.status(400).json({ success: false, error: 'New passwords do not match.' });
        return;
      }
      newPasswordHash = await hashPassword(newPassword);
    }

    if (!cleanNewEmail && !newPasswordHash && !displayName) {
      res.status(400).json({ success: false, error: 'No new credential updates specified.' });
      return;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const userUpdateData: any = {};
      if (cleanNewEmail && cleanNewEmail !== req.user?.email) {
        userUpdateData.email = cleanNewEmail;
      }
      if (displayName !== undefined && displayName.trim() !== '') {
        userUpdateData.displayName = displayName.trim();
      }

      let u = req.user!;
      if (Object.keys(userUpdateData).length > 0) {
        u = await tx.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
      }

      if (cleanNewEmail && isOwner) {
        await tx.company.update({
          where: { id: companyId },
          data: { ownerEmail: cleanNewEmail },
        });

        await tx.auditLogEntry.create({
          data: {
            companyId,
            action: 'UPDATE',
            entityType: 'OWNER_CREDENTIALS_UPDATE',
            entityId: userId,
            actorId: userId,
            previousState: { email: req.user?.email },
            newState: { email: cleanNewEmail },
            reason: `Owner updated User ID email to ${cleanNewEmail}`,
          },
        });
      }

      if (newPasswordHash) {
        await tx.passwordCredential.update({
          where: { userId },
          data: { passwordHash: newPasswordHash },
        });

        await tx.auditLogEntry.create({
          data: {
            companyId,
            action: 'UPDATE',
            entityType: 'PASSWORD_CHANGE',
            entityId: userId,
            actorId: userId,
            previousState: { passwordUpdated: false },
            newState: { passwordUpdated: true },
            reason: `Account password rotated for ${cleanNewEmail || req.user?.email}`,
          },
        });
      }

      return u;
    });

    res.json({
      success: true,
      message: 'Account security credentials updated successfully.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
      },
    });
  } catch (err: any) {
    console.error('Error updating credentials:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/trigger-staff-reset
 * Allows Owner to trigger an instant password reset for an employee.
 */
authRouter.post('/trigger-staff-reset', requireAuth, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.body;
    const companyId = req.membership?.companyId;

    if (!email || !companyId) {
      res.status(400).json({ success: false, error: 'Employee email is required.' });
      return;
    }

    const cleanEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        memberships: {
          where: { companyId },
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      res.status(404).json({ success: false, error: 'Employee not found in this company.' });
      return;
    }

    // Invalidate prior reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const rawToken = generateOpaqueToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Write audit trail
    await prisma.auditLogEntry.create({
      data: {
        companyId,
        action: 'UPDATE',
        entityType: 'STAFF_PASSWORD_RESET',
        entityId: user.id,
        actorId: req.user!.id,
        previousState: { email: cleanEmail },
        newState: { resetTokenIssued: true, recipient: cleanEmail },
        reason: `Owner triggered employee password reset email for ${cleanEmail}`,
      },
    });

    const origin = req.headers.origin || `http://localhost:${process.env.PORT || 3000}`;
    const resetUrl = `${origin}?token=${rawToken}&action=reset`;

    const emailProvider = getEmailProvider();
    await emailProvider.send({
      to: cleanEmail,
      subject: 'TaxShield Ledger — Staff Password Reset',
      textBody: `Hello,\n\nA password reset was initiated for your employee account (${cleanEmail}) by your company administrator.\n\nClick the link below to set a new password:\n${resetUrl}\n\nThis link is valid for 1 hour.`,
      htmlBody: `
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">TaxShield Ledger</h2>
          <p>Hello,</p>
          <p>A password reset was initiated for your employee account (<strong>${cleanEmail}</strong>) by your company administrator.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #059669; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Reset Employee Password
            </a>
          </p>
          <p style="font-size: 12px; color: #64748b;">This link expires in 1 hour.</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: `Password reset link dispatched to ${cleanEmail}.`,
    });
  } catch (err: any) {
    console.error('Error triggering staff reset:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
