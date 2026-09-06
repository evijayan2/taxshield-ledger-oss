import { EmailProvider } from './types.js';
import { ConsoleEmailProvider } from './providers/console.js';
import { ResendEmailProvider } from './providers/resend.js';
import { SendGridEmailProvider } from './providers/sendgrid.js';
import { SmtpEmailProvider } from './providers/smtp.js';

let activeProvider: EmailProvider | null = null;

/**
 * Returns the configured EmailProvider based on EMAIL_PROVIDER environment variable.
 */
export function getEmailProvider(): EmailProvider {
  if (activeProvider) {
    return activeProvider;
  }

  const providerType = (process.env.EMAIL_PROVIDER || 'console').toLowerCase();

  try {
    switch (providerType) {
      case 'resend':
        activeProvider = new ResendEmailProvider();
        break;
      case 'sendgrid':
        activeProvider = new SendGridEmailProvider();
        break;
      case 'smtp':
        activeProvider = new SmtpEmailProvider();
        break;
      case 'console':
      default:
        activeProvider = new ConsoleEmailProvider();
        break;
    }
  } catch (err: any) {
    console.warn(`[TaxShield Email] Failed to initialize provider "${providerType}": ${err.message}. Falling back to console provider.`);
    activeProvider = new ConsoleEmailProvider();
  }

  return activeProvider;
}

export * from './types.js';
