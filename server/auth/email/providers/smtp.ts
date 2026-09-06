import nodemailer from 'nodemailer';
import { EmailProvider, SendEmailParams } from '../types.js';

export class SmtpEmailProvider implements EmailProvider {
  name = 'smtp';
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor() {
    const host = process.env.SMTP_HOST || 'localhost';
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });

    this.from = process.env.EMAIL_FROM || 'TaxShield Ledger <noreply@taxshield.local>';
  }

  async send(params: SendEmailParams): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: params.to,
      subject: params.subject,
      text: params.textBody,
      html: params.htmlBody || `<p>${params.textBody.replace(/\n/g, '<br/>')}</p>`,
    });
  }
}
