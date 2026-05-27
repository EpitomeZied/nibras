import { render } from '@react-email/components';
import { Resend } from 'resend';
import { MagicLinkEmail } from '../emails/magic-link';
import { WelcomeEmail } from '../emails/welcome';

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function emailFrom(): string {
  return process.env.NIBRAS_EMAIL_FROM ?? 'Nibras <noreply@nibras.dev>';
}

function webBaseUrl(): string {
  return (
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_NIBRAS_WEB_BASE_URL ??
    process.env.NIBRAS_WEB_BASE_URL ??
    'http://127.0.0.1:3000'
  );
}

export async function sendMagicLinkEmail(args: { email: string; url: string }): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const html = await render(MagicLinkEmail({ url: args.url }));

  await resend.emails.send({
    from: emailFrom(),
    to: args.email,
    subject: 'Your Nibras sign-in link',
    html,
    text: `Sign in to Nibras: ${args.url}\n\nThis link expires in a few minutes.`,
  });
}

export async function sendWelcomeEmail(args: {
  email: string;
  name: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const base = webBaseUrl().replace(/\/$/, '');
  const html = await render(
    WelcomeEmail({
      name: args.name,
      dashboardUrl: `${base}/dashboard`,
      docsUrl: `${base}/docs`,
    })
  );

  await resend.emails.send({
    from: emailFrom(),
    to: args.email,
    subject: 'Welcome to Nibras',
    html,
    text: `Welcome to Nibras, ${args.name}. Open your dashboard: ${base}/dashboard`,
  });
}
