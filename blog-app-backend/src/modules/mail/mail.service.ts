import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordResetOtp(to: string, otp: string): Promise<void> {
    this.logger.debug(`sendPasswordResetOtp called for ${to} otp=${otp}`);
  }
}
