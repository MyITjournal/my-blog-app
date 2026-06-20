import { Injectable, Logger } from '@nestjs/common';
import { env } from '../../config/env';
import { renderVerificationOtpEmail } from './templates/verification-otp.template';
import { renderPasswordResetOtpEmail } from './templates/reset-password-otp.template';
import { renderPasswordChangedEmail } from './templates/password-changed.template';
import { renderAccountLockedEmail } from './templates/account-locked.template';
import { renderNewIpLoginEmail } from './templates/new-ip-login.template';
import { Resend } from 'resend';

export const OTP_EMAIL_SUBJECT = 'Verify your InsightPulse account';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const timestamp = new Date().toISOString();

    if (env.NODE_ENV === 'development') {
      this.logger.warn(
        `[DEV] Skipping Resend — email NOT sent.\n` +
          `  To:      ${to}\n` +
          `  Subject: ${subject}`,
      );
      return;
    }

    try {
      const resendResponse: unknown = await this.resend.emails.send({
        from: env.MAIL_FROM,
        to,
        subject,
        html,
      });
      const resendInfo = resendResponse as {
        data?: { id?: string } | null;
        error?: { name?: string; message?: string; statusCode?: number } | null;
      };

      if (resendInfo.error) {
        throw new Error(
          `Resend rejected the email: ${resendInfo.error.message ?? resendInfo.error.name ?? 'unknown error'} (status ${resendInfo.error.statusCode ?? 'N/A'})`,
        );
      }

      this.logger.log(
        `[${timestamp}] Email sent via Resend to ${to} | Subject: "${subject}" | Message ID: ${resendInfo.data?.id ?? 'N/A'}`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[${timestamp}] Failed to send email to ${to} (${subject}): ${errorMsg}`,
      );
      throw new Error(
        `Failed to send email to ${to}. Check logs for details.`,
        { cause: error },
      );
    }
  }

  async sendPasswordResetOtp(toEmail: string, otp: string): Promise<void> {
    this.logger.log(`Sending password reset OTP to ${toEmail}`);

    if (env.NODE_ENV === 'development') {
      this.logger.warn(`[DEV] Password reset OTP for ${toEmail}: ${otp}`);
    }

    const subject = 'Reset your InsightPulse password';
    const html = renderPasswordResetOtpEmail(otp);

    await this.sendEmail(toEmail, subject, html);
  }

  async sendVerificationOtp(
    toEmail: string,
    fullName: string,
    otp: string,
  ): Promise<void> {
    this.logger.log(`Sending OTP email to ${toEmail}`);

    if (env.NODE_ENV === 'development') {
      this.logger.warn(`[DEV] Verification OTP for ${toEmail}: ${otp}`);
    }

    const html = renderVerificationOtpEmail(fullName, otp);
    await this.sendEmail(toEmail, OTP_EMAIL_SUBJECT, html);
  }

  async sendPasswordChangedEmail(toEmail: string): Promise<void> {
    this.logger.log(`Sending password changed notification to ${toEmail}`);
    const html = renderPasswordChangedEmail();
    await this.sendEmail(
      toEmail,
      'Your InsightPulse password has been changed',
      html,
    );
  }

  async sendAccountLockedEmail(
    toEmail: string,
    lockedUntil: string,
  ): Promise<void> {
    this.logger.log(`Sending account locked notification to ${toEmail}`);
    const html = renderAccountLockedEmail(lockedUntil);
    await this.sendEmail(
      toEmail,
      'Unusual sign-in activity on your InsightPulse account',
      html,
    );
  }

  async sendNewIpLoginEmail(
    toEmail: string,
    ip: string,
    timestamp: string,
  ): Promise<void> {
    this.logger.log(`Sending new IP login notification to ${toEmail}`);
    const html = renderNewIpLoginEmail(ip, timestamp);
    await this.sendEmail(
      toEmail,
      'New sign-in to your InsightPulse account',
      html,
    );
  }
}
