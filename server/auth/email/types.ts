export interface SendEmailParams {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
}

export interface EmailProvider {
  name: string;
  send(params: SendEmailParams): Promise<void>;
}
