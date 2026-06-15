export const QUEUE_NAMES = {
  EMAIL: 'email',
} as const;

export const QUEUE_JOB_NAMES = {
  EMAIL: {
    SEND_OTP: 'send-otp',
    ACCOUNT_LOCKED: 'account-locked',
    NEW_IP_LOGIN: 'new-ip-login',
    SEND_PASSWORD_CHANGED: 'send-password-changed',
  },
} as const;
