import nodemailer from 'nodemailer';

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createMailer() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ...(port === 587 && { requireTLS: true }),
  });
}

/**
 * Sends a welcome email after signup. Uses Gmail (or any SMTP) via env:
 * - SMTP_USER, SMTP_PASS (Gmail: use an App Password, not your normal password)
 * - Optional: SMTP_HOST, SMTP_PORT, EMAIL_FROM
 *
 * If SMTP is not configured, this no-ops and logs a warning (signup still succeeds).
 */
export async function sendWelcomeEmail(
  to: string,
  displayName: string
): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
  const transporter = createMailer();

  if (!transporter) {
    console.warn('[email] SMTP not configured (SMTP_USER / SMTP_PASS). Welcome email skipped.');
    return { sent: false, skipped: true };
  }

  const from =
    process.env.EMAIL_FROM || `"DriveHub" <${process.env.SMTP_USER}>`;
  const safeName = escapeHtml(displayName);

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
    <h1 style="color: #0891b2;">Welcome to DriveHub</h1>
    <p>Hi ${safeName},</p>
    <p>Thanks for creating your account. You can now browse vehicles, book rentals, and manage your trips from your dashboard.</p>
    <p>If you have questions, just reply to this email.</p>
    <p style="margin-top: 32px; color: #64748b; font-size: 14px;">— The DriveHub team</p>
  </div>
</body>
</html>
`.trim();

  const text = `Hi ${displayName},

Thanks for creating your DriveHub account. You can now browse vehicles, book rentals, and manage your trips from your dashboard.

— The DriveHub team`;

  try {
    await transporter.sendMail({
      from,
      to,
      subject: 'Welcome to DriveHub',
      text,
      html,
    });
    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[email] Failed to send welcome email:', message);
    return { sent: false, error: message };
  }
}
