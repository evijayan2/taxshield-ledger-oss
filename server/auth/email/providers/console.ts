import { EmailProvider, SendEmailParams } from '../types.js';

export class ConsoleEmailProvider implements EmailProvider {
  name = 'console';

  async send(params: SendEmailParams): Promise<void> {
    console.log('\n================== [TAXSHIELD EMAIL - NOT SENT / CONSOLE DEV] ==================');
    console.log(`To:      ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    console.log('--------------------------------------------------------------------------------');
    console.log(params.textBody);
    console.log('================================================================================\n');
  }
}
