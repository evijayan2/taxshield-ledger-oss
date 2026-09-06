import sgMail from '@sendgrid/mail';
import { EmailProvider, SendEmailParams } from '../types.js';

export class SendGridEmailProvider implements EmailProvider {
  name = 'sendgrid';
  private from: string;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY environment variable is required for SendGrid email provider.');
    }
    sgMail.setApiKey(apiKey);
    this.from = process.env.EMAIL_FROM || 'TaxShield Ledger <noreply@taxshield.local>';
  }

  async send(params: SendEmailParams): Promise<void> {
    await sgMail.send({
      to: params.to,
      from: this.from,
      subject: params.subject,
      text: params.textBody,
      html: params.htmlBody || `<p>${params.textBody.replace(/\n/g, '<br/>')}</p>`,
    });
  }
}
