import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

interface WelcomeEmailArgs {
  userName: string;
  partnerName: string;
  password: string;
  to: string;
  loginUrl: string;
}

function welcomeEmailHtml({ userName, partnerName, password, to, loginUrl }: WelcomeEmailArgs): string {
  const logoUrl = `${loginUrl}/logo.jpg`;
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Sqooli Account</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <img src="${logoUrl}" alt="Sqooli" width="100" height="32" style="display:block;object-fit:contain;" />
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:40px 44px;">

              <p style="margin:0 0 20px;font-size:15px;color:#1e293b;line-height:1.6;">Hi ${userName},</p>

              <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
                Your account has been set up on <strong style="color:#1e293b;">Sqooli</strong> under <strong style="color:#1e293b;">${partnerName}</strong>. Here are your login details:
              </p>

              <!-- Credentials -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px 12px;border-bottom:1px solid #e2e8f0;">
                    <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Email</p>
                    <p style="margin:0;font-size:14px;color:#1e293b;font-family:monospace;">${to}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px 16px;">
                    <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Temporary password</p>
                    <p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;font-family:monospace;letter-spacing:0.04em;">${password}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.7;">
                You'll be asked to set a new password the first time you sign in. Please keep these details private.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${loginUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:12px 28px;border-radius:6px;">
                      Sign in to Sqooli
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                <tr>
                  <td style="border-top:1px solid #f1f5f9;padding-top:24px;">
                    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
                      If you weren't expecting this, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 0;">
              <p style="margin:0;font-size:12px;color:#cbd5e1;">&copy; ${year} Sqooli</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const sendWelcomeEmail = action({
  args: {
    to: v.string(),
    userName: v.string(),
    partnerName: v.string(),
    password: v.string(),
    loginUrl: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set — skipping welcome email");
      return;
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Sqooli <noreply@sqooli.org>",
      to: args.to,
      subject: `Welcome to Sqooli — Your Account Credentials`,
      html: welcomeEmailHtml(args),
    });

    if (error) {
      console.error("Failed to send welcome email:", error);
    }
  },
});
