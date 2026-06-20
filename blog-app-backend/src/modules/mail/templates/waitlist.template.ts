import { renderEmailLayout } from './layout.template';

export function renderWaitlistEmail(): string {
  return renderEmailLayout({
    title: 'You joined the waitlist',

    content: `
      <p>Hi there,</p>

      <p>
        Thank you for joining the InsightPulse waitlist.
      </p>

      <p>
        We're excited to have you onboard and we'll notify you
        once we launch.
      </p>

      <p>Stay tuned 🚀</p>

      <p>— The InsightPulse Team</p>
    `,
  });
}
