import { MailerOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export const getMailConfig = async (
  configService: ConfigService,
): Promise<MailerOptions> => {
  const mailFromName = configService.get<string>('MAIL_FROM_NAME');
  const email = configService.get('SERVER_MAILER_EMAIL');
  const password = configService.get('SERVER_MAILER_PASSWORD');

  return {
    transport: {
      port: 5038,
      service: 'Gmail',
      auth: {
        user: email,
        pass: password,
      },
    },
    defaults: {
      from: `"${mailFromName}" <${email}>`,
    },
  };
};
