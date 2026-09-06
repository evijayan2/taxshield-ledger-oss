import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

/**
 * Normalizes an email address (trims and converts to lower case).
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Hashes a plaintext password using bcrypt with cost factor 12.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Verifies a plaintext password against a bcrypt hash.
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
