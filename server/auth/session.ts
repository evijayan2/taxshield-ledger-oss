import crypto from 'crypto';
import { prisma } from '../prisma.js';

export const DEFAULT_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function hashToken(opaqueToken: string): string {
  return crypto.createHash('sha256').update(opaqueToken).digest('hex');
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface AuthenticatedUserSession {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    isActive: boolean;
  };
  session: {
    id: string;
    expiresAt: Date;
    createdAt: Date;
  };
  membership: {
    id: string;
    companyId: string;
    role: 'OWNER' | 'EMPLOYEE';
    status: 'ACTIVE' | 'INVITED' | 'DEACTIVATED';
  } | null;
}

/**
 * Creates a new session in PostgreSQL with a SHA-256 hashed token.
 */
export async function createSession(
  userId: string,
  expiresInMs: number = DEFAULT_SESSION_DURATION_MS
): Promise<{ opaqueToken: string; sessionId: string; expiresAt: Date }> {
  const opaqueToken = generateOpaqueToken();
  const tokenHash = hashToken(opaqueToken);
  const expiresAt = new Date(Date.now() + expiresInMs);

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return {
    opaqueToken,
    sessionId: session.id,
    expiresAt,
  };
}

/**
 * Validates an opaque session token, checks expiry, revocation, and active user status.
 */
export async function validateSession(opaqueToken: string): Promise<AuthenticatedUserSession | null> {
  if (!opaqueToken || typeof opaqueToken !== 'string') {
    return null;
  }

  const tokenHash = hashToken(opaqueToken);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          memberships: {
            where: { status: { in: ['ACTIVE', 'DEACTIVATED'] } },
          },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  // Check if session is revoked
  if (session.revokedAt) {
    return null;
  }

  // Check if session is expired
  if (session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  // Check if user is active
  if (!session.user || !session.user.isActive) {
    return null;
  }

  // Update last seen timestamp asynchronously
  prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  }).catch((err) => {
    console.error('Failed to update session lastSeenAt:', err);
  });

  const activeMembership = session.user.memberships[0] || null;

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      isActive: session.user.isActive,
    },
    session: {
      id: session.id,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    },
    membership: activeMembership
      ? {
          id: activeMembership.id,
          companyId: activeMembership.companyId,
          role: activeMembership.role,
          status: activeMembership.status,
        }
      : null,
  };
}

/**
 * Revokes a session by its opaque token.
 */
export async function revokeSession(opaqueToken: string): Promise<void> {
  if (!opaqueToken) return;
  const tokenHash = hashToken(opaqueToken);

  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Revokes all active sessions for a given user.
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
