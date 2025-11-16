import { components } from "./_generated/api";
import { action } from "./_generated/server";
import { Resend } from "@convex-dev/resend";
import { v } from "convex/values";

export const resend = new Resend(components.resend, {
  testMode: false, // Set to true for development
});

/**
 * Send user credentials email
 */
export const sendUserCredentialsEmail = action({
  args: {
    user_email: v.string(),
    user_name: v.string(),
    password: v.string(),
    extension: v.string(),
    partner_name: v.string(),
  },
  handler: async (ctx, args) => {
    const loginUrl = `${'https://sqooli.org'}/signIn?extension=${args.extension}`;

    // Create email HTML
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 30px;
            }
            .credentials-box {
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .credential-item {
              margin: 15px 0;
              padding: 12px;
              background: white;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
            }
            .credential-label {
              font-size: 12px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .credential-value {
              font-size: 16px;
              color: #0f172a;
              font-weight: 600;
              font-family: 'Courier New', monospace;
            }
            .button {
              display: inline-block;
              background: #0ea5e9;
              color: white;
              padding: 14px 28px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
              text-align: center;
            }
            .warning-box {
              background: #fef3c7;
              border: 1px solid #fbbf24;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }
            .warning-box p {
              margin: 0;
              color: #92400e;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #64748b;
              font-size: 14px;
              background: #f8fafc;
            }
            .steps {
              margin: 20px 0;
            }
            .step {
              display: flex;
              align-items: start;
              margin: 15px 0;
            }
            .step-number {
              background: #0ea5e9;
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 600;
              flex-shrink: 0;
              margin-right: 12px;
            }
            .step-content {
              flex: 1;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Sqooli! 🎉</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your account is ready</p>
            </div>
            
            <div class="content">
              <p>Hi <strong>${args.user_name}</strong>,</p>
              <p>Your account has been created for <strong>${args.partner_name}</strong>. Below are your login credentials:</p>
              
              <div class="credentials-box">
                <h3 style="margin-top: 0; color: #0f172a;">Your Login Credentials</h3>
                
                <div class="credential-item">
                  <div class="credential-label">Email</div>
                  <div class="credential-value">${args.user_email}</div>
                </div>
                
                <div class="credential-item">
                  <div class="credential-label">Password</div>
                  <div class="credential-value">${args.password}</div>
                </div>
                
                <div class="credential-item">
                  <div class="credential-label">Extension (Login ID)</div>
                  <div class="credential-value">${args.extension}</div>
                </div>
              </div>
              
              <div class="warning-box">
                <p><strong>⚠️ Important:</strong> Please save these credentials securely. You'll need the extension to log in.</p>
              </div>
              
              <div class="steps">
                <h3 style="color: #0f172a;">How to Log In:</h3>
                
                <div class="step">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <strong>Click the login button below</strong> or use your unique login link
                  </div>
                </div>
                
                <div class="step">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <strong>Enter your email and password</strong> from above
                  </div>
                </div>
                
                <div class="step">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <strong>The extension will auto-fill</strong> from the link
                  </div>
                </div>
              </div>
              
              <center>
                <a href="${loginUrl}" class="button">
                  Log In Now
                </a>
              </center>
              
              <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <span style="color: #0ea5e9; word-break: break-all;">${loginUrl}</span>
              </p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
                If you didn't expect this email or need help, please contact your administrator.
              </p>
            </div>
            
            <div class="footer">
              <p>This is an automated email from Sqooli Partners Dashboard</p>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 10px;">
                © ${new Date().getFullYear()} Sqooli. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await resend.sendEmail(ctx, {
        from: "Sqooli <noreply@sqooli.org>",
        to: args.user_email,
        subject: `Your Sqooli Account Credentials - ${args.partner_name}`,
        html,
      });

      console.log(`Credentials email sent to ${args.user_email}`);
      return { success: true };
    } catch (error: unknown) {
      console.error("Failed to send credentials email:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
});
