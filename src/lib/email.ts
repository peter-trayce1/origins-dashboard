const RESEND_API_KEY = process.env.RESEND_API_KEY;
// EMAIL_FROM is set via the EMAIL_FROM environment variable.
// Do not change the fallback here until the knownobjects.io sending domain
// is verified in Resend and the env var is updated in Vercel.
const EMAIL_FROM     = process.env.EMAIL_FROM ?? "noreply@origins-id.com";
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.knownobjects.io";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<SendResult> {
  if (!RESEND_API_KEY || RESEND_API_KEY === "re_...") {
    console.log(`[email] Would send to ${to}: "${subject}" (RESEND_API_KEY not configured)`);
    return { ok: false, error: "Email is not configured (RESEND_API_KEY missing)" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[email] Failed to send to ${to}: ${body}`);
      return { ok: false, error: body || `Resend returned ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[email] Error sending to ${to}: ${msg}`);
    return { ok: false, error: msg };
  }
}

export async function sendApplicationReceived(opts: {
  to: string;
  fullName: string;
  brandName: string;
}): Promise<SendResult> {
  return sendEmail({
    to: opts.to,
    subject: "We've received your Known Objects application",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#333;">
        <img src="${APP_URL}/logo-dark.png" alt="Known Objects" height="22" style="margin-bottom:32px;" />
        <h1 style="font-size:22px;font-weight:600;margin:0 0 12px;">We've received your application</h1>
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 16px;">
          Hi ${opts.fullName},
        </p>
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 16px;">
          Thank you for applying to Known Objects with <strong>${opts.brandName}</strong>.
          Our team reviews every workspace request to ensure the best onboarding experience.
        </p>
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 32px;">
          Most applications are reviewed within one business day. We'll be in touch shortly.
        </p>
        <p style="font-size:13px;color:#8c8c8c;">The Known Objects team</p>
      </div>
    `,
  });
}

export async function sendWorkspaceApproved(opts: {
  to: string;
  fullName: string;
  brandName: string;
  tempPassword: string;
  loginUrl: string;
}): Promise<SendResult> {
  const onboardingUrl = process.env.NEXT_PUBLIC_ONBOARDING_URL;
  return sendEmail({
    to: opts.to,
    subject: "Your Known Objects workspace is approved — here are your sign-in details",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#333;">
        <img src="${APP_URL}/logo-dark.png" alt="Known Objects" height="22" style="margin-bottom:32px;" />
        <h1 style="font-size:22px;font-weight:600;margin:0 0 12px;">Your workspace is approved</h1>
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 16px;">
          Hi ${opts.fullName},
        </p>
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 24px;">
          Your Known Objects workspace for <strong>${opts.brandName}</strong> has been approved.
          Use the details below to sign in — you'll be prompted to create your own password
          straight away.
        </p>

        <div style="background:#f9f9f8;border:1px solid #e8e8e6;border-radius:12px;padding:20px 24px;margin:0 0 28px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#8c8c8c;text-transform:uppercase;letter-spacing:0.05em;">Your sign-in details</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="font-size:13px;color:#8c8c8c;padding:6px 0;width:110px;">Email</td>
              <td style="font-size:14px;color:#000;font-weight:500;padding:6px 0;">${opts.to}</td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#8c8c8c;padding:6px 0;">Temp password</td>
              <td style="font-size:14px;color:#000;font-weight:600;font-family:monospace;padding:6px 0;letter-spacing:0.05em;">${opts.tempPassword}</td>
            </tr>
          </table>
        </div>

        <a href="${opts.loginUrl}" style="display:inline-block;background:#000;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;margin-bottom:28px;">
          Sign in to Known Objects →
        </a>

        <p style="font-size:13px;line-height:1.6;color:#8c8c8c;margin:0 0 8px;">
          After signing in you'll be asked to create a new password, then taken through a quick
          brand setup before you can start building passports. Your 14-day trial begins the
          moment you first log in.
        </p>

        ${onboardingUrl ? `
        <p style="font-size:13px;color:#525252;margin:24px 0 4px;">Want a guided walkthrough?</p>
        <a href="${onboardingUrl}" style="font-size:13px;color:#0e6dea;">Book an onboarding call</a>
        ` : ""}

        <p style="font-size:13px;color:#8c8c8c;margin-top:32px;">The Known Objects team</p>
      </div>
    `,
  });
}
