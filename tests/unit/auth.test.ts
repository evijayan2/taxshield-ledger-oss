import { describe, it, expect } from 'vitest';
import { normalizeEmail, hashPassword, verifyPassword } from '../../server/auth/password.js';
import { hashToken, generateOpaqueToken, DEFAULT_SESSION_DURATION_MS } from '../../server/auth/session.js';
import { ConsoleEmailProvider } from '../../server/auth/email/providers/console.js';

describe('Auth Password and Token Helpers', () => {
  it('should normalize email addresses by trimming and lowercasing', () => {
    expect(normalizeEmail('  Owner@Micro-LLC.Tax  ')).toBe('owner@micro-llc.tax');
    expect(normalizeEmail('JOHN.DOE@EXAMPLE.COM')).toBe('john.doe@example.com');
  });

  it('should securely hash passwords and verify correct match', async () => {
    const rawPass = 'SecretP@ssword2026';
    const hash = await hashPassword(rawPass);

    expect(hash).not.toBe(rawPass);
    expect(hash.startsWith('$2b$12$') || hash.startsWith('$2a$12$')).toBe(true);

    const isValid = await verifyPassword(rawPass, hash);
    expect(isValid).toBe(true);

    const isWrong = await verifyPassword('WrongPassword123', hash);
    expect(isWrong).toBe(false);
  });

  it('should generate 32-byte hex opaque tokens and deterministic SHA-256 hashes', () => {
    const token = generateOpaqueToken();
    expect(token).toHaveLength(64); // 32 bytes = 64 hex characters

    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 = 64 hex characters
  });

  it('should default session duration to 7 days', () => {
    expect(DEFAULT_SESSION_DURATION_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('should send email via ConsoleEmailProvider without error', async () => {
    const provider = new ConsoleEmailProvider();
    expect(provider.name).toBe('console');

    await expect(
      provider.send({
        to: 'test@example.com',
        subject: 'Test Subject',
        textBody: 'Hello world',
      })
    ).resolves.toBeUndefined();
  });
});
