import { Resend } from 'resend';
import { EmailProvider, SendEmailParams } from '../types.js';

export class ResendEmailProvider implements EmailProvider {
  name = 'resend';
  private client: Resend;
  private from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required for Resend email provider.');
    }
    this.client = new Resend(apiKey);
    this.from = process.env.EMAIL_FROM || 'TaxShield Ledger <noreply@taxshield.local>';
  }

  async send(params: SendEmailParams): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: params.to,
      subject: params.subject,
      text: params.textBody,
      html: params.htmlBody || `<p>${params.textBody.replace(/\n/g, '<br/>')}</p>`,
    });

    if (error) {
      throw new Error(`Resend email delivery failed: ${error.message}`);
    }
  }
}
