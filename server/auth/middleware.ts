import { Request, Response, NextFunction } from 'express';
import { validateSession, AuthenticatedUserSession } from './session.js';

export const SESSION_COOKIE_NAME = 'taxshield_session';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserSession['user'];
  sessionInfo?: AuthenticatedUserSession['session'];
  membership?: AuthenticatedUserSession['membership'];
}

/**
 * Extracts the session token from HttpOnly cookie or Authorization Bearer header.
 */
export function extractSessionToken(req: Request): string | null {
  if (req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
    return req.cookies[SESSION_COOKIE_NAME];
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Middleware that requires a valid, active user session.
 * Rejects with 401 if unauthenticated.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractSessionToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to access this resource.',
      code: 'UNAUTHENTICATED',
    });
    return;
  }

  try {
    const authSession = await validateSession(token);

    if (!authSession) {
      res.status(401).json({
        success: false,
        error: 'Session expired or invalid. Please sign in again.',
        code: 'SESSION_INVALID',
      });
      return;
    }

    req.user = authSession.user;
    req.sessionInfo = authSession.session;
    req.membership = authSession.membership;

    next();
  } catch (err: any) {
    console.error('Session authentication error:', err);
    res.status(500).json({
      success: false,
      error: 'Authentication service error.',
    });
  }
}

/**
 * Middleware that requires a specific company role (e.g., OWNER).
 * Rejects with 403 if authenticated but unauthorized.
 */
export function requireRole(allowedRole: 'OWNER' | 'EMPLOYEE') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.membership) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'UNAUTHENTICATED',
      });
      return;
    }

    if (req.membership.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: 'Your company membership is not active.',
        code: 'MEMBERSHIP_INACTIVE',
      });
      return;
    }

    if (allowedRole === 'OWNER' && req.membership.role !== 'OWNER') {
      res.status(403).json({
        success: false,
        error: 'Forbidden. This action requires Owner privileges.',
        code: 'INSUFFICIENT_PERMISSIONS',
      });
      return;
    }

    next();
  };
}

/**
 * Shorthand middleware requiring OWNER role.
 */
export const requireOwner = requireRole('OWNER');
