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
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img src="${logoUrl}" alt="Sqooli" width="110" height="36" style="display:block;object-fit:contain;" />
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(15,23,42,0.08),0 4px 16px rgba(15,23,42,0.05);">

              <!-- Blue header -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#0ea5e9;padding:36px 48px 32px;">
                    <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.1em;">Welcome aboard</p>
                    <h1 style="margin:0 0 10px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.2;">Hi ${userName}!</h1>
                    <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85);line-height:1.6;">
                      Your account has been created for <strong style="color:#ffffff;">${partnerName}</strong>.<br/>Here are your login credentials to get started.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:36px 48px;">

                    <!-- Credentials card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                      <tr>
                        <td style="padding:14px 20px 8px;">
                          <p style="margin:0;font-size:10px;font-weight:700;color:#0ea5e9;text-transform:uppercase;letter-spacing:0.1em;">Email Address</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 20px 16px;border-bottom:1px solid #e2e8f0;">
                          <p style="margin:0;font-size:15px;font-weight:500;color:#0f172a;font-family:monospace;">${to}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 20px 8px;">
                          <p style="margin:0;font-size:10px;font-weight:700;color:#0ea5e9;text-transform:uppercase;letter-spacing:0.1em;">Temporary Password</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 20px 18px;">
                          <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;font-family:monospace;letter-spacing:0.06em;">${password}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Green tip -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf9;border:1px solid #a7f3d0;border-radius:10px;margin-bottom:32px;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0;font-size:13px;color:#065f46;line-height:1.6;">
                            <strong style="color:#10b981;">Tip:</strong> You will be prompted to change your password on first login. Keep these credentials safe and do not share them with anyone.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA button -->
                    <table cellpadding="0" cellspacing="0" style="width:100%;">
                      <tr>
                        <td align="center">
                          <a href="${loginUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 44px;border-radius:8px;letter-spacing:0.01em;">
                            Login to your account &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider + note -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                      <tr>
                        <td style="border-top:1px solid #e2e8f0;padding-top:20px;">
                          <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                            If you did not expect this email, please ignore it or contact your administrator.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 8px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7;">
                This is an automated message — please do not reply.<br />
                &copy; ${year} Sqooli. All rights reserved.
              </p>
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
