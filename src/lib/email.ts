const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM     = process.env.EMAIL_FROM ?? "noreply@originsid.com";
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL ?? "https://originsid.com";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  if (!RESEND_API_KEY || RESEND_API_KEY === "re_...") {
    console.log(`[email] Would send to ${to}: "${subject}"`);
    return;
  }
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
  }
}

export async function sendApplicationReceived(opts: {
  to: string;
  fullName: string;
  brandName: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: "We've received your Origins application",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#333;">
        <img src="${APP_URL}/logo-dark.png" alt="Origins" height="22" style="margin-bottom:32px;" />
        <h1 style="font-size:22px;font-weight:600;margin:0 0 12px;">We've received your application</h1>
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 16px;">
          Hi ${opts.fullName},
        </p>
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 16px;">
          Thank you for applying to Origins with <strong>${opts.brandName}</strong>.
          Our team reviews every workspace request to ensure the best onboarding experience.
        </p>
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 32px;">
          Most applications are reviewed within one business day. We'll be in touch shortly.
        </p>
        <p style="font-size:13px;color:#8c8c8c;">The Origins team</p>
      </div>
    `,
  });
}

export async function sendWorkspaceApproved(opts: {
  to: string;
  fullName: string;
  brandName: string;
  trialEndDate: string;
}): Promise<void> {
  const onboardingUrl = process.env.NEXT_PUBLIC_ONBOARDING_URL ?? `${APP_URL}/dashboard`;
  await sendEmail({
    to: opts.to,
    subject: "Your Origins workspace is now active",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#333;">
        <img src="${APP_URL}/logo-dark.png" alt="Origins" height="22" style="margin-bottom:32px;" />
        <h1 style="font-size:22px;font-weight:600;margin:0 0 12px;">Your workspace is now active</h1>
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 16px;">
          Hi ${opts.fullName},
        </p>
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 16px;">
          Welcome to Origins. Your workspace for <strong>${opts.brandName}</strong> has been approved
          and your 14-day trial has started. Your trial runs until <strong>${opts.trialEndDate}</strong>.
        </p>
        <p style="font-size:15px;line-height:1.6;color:#525252;margin:0 0 32px;">
          Start building your first Digital Product Passport — you can publish up to 3 passports
          during your trial, with full access to the passport builder.
        </p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:#000;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;margin-bottom:32px;">
          Open your workspace →
        </a>
        ${onboardingUrl !== `${APP_URL}/dashboard` ? `
        <p style="font-size:13px;color:#525252;margin:0 0 4px;">Want a guided walkthrough?</p>
        <a href="${onboardingUrl}" style="font-size:13px;color:#0e6dea;">Book an onboarding call</a>
        ` : ""}
        <p style="font-size:13px;color:#8c8c8c;margin-top:32px;">The Origins team</p>
      </div>
    `,
  });
}
