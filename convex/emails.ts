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

    const htmlContent = `
     <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html dir="ltr" lang="en">
        <head>
          <meta content="width=device-width" name="viewport" />
          <link
            rel="preload"
            as="image"
            href="https://resend-attachments.s3.amazonaws.com/gFrCHn8THmN6gbB" />
          <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
          <meta name="x-apple-disable-message-reformatting" />
          <meta content="IE=edge" http-equiv="X-UA-Compatible" />
          <meta name="x-apple-disable-message-reformatting" />
          <meta
            content="telephone=no,address=no,email=no,date=no,url=no"
            name="format-detection" />
        </head>
        <body>
          <!--$--><!--html--><!--head-->
          <div
            style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
            data-skip-in-text="true">
            Your partner account
            <div>
               ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
            </div>
          </div>
          <!--body-->
          <table
            border="0"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            align="center">
            <tbody>
              <tr>
                <td>
                  <table
                    align="center"
                    width="100%"
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    role="presentation">
                    <tbody>
                      <tr>
                        <td>
                          <table
                            width="100%"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="width:100%">
                            <tbody>
                              <tr>
                                <td>
                                  <div
                                    style="margin:0;padding:0;background-color:rgb(246,249,252)">
                                    <table
                                      align="center"
                                      width="100%"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                      style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                      <tbody>
                                        <tr>
                                          <td>
                                            <tr style="margin:0;padding:0">
                                              <td
                                                data-id="__react-email-column"
                                                style="margin:0;padding:0;background-color:rgb(246,249,252);padding-bottom:10px;padding-top:10px">
                                                <div
                                                  style="margin:0;padding:0;display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">
                                                  <p style="margin:0;padding:0">
                                                    <span
                                                      >Dropbox reset your
                                                      password</span
                                                    >
                                                  </p>
                                                  <div style="margin:0;padding:0">
                                                    <p style="margin:0;padding:0">
                                                      <span
                                                        > ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</span
                                                      >
                                                    </p>
                                                  </div>
                                                </div>
                                                <table
                                                  align="center"
                                                  width="100%"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  role="presentation"
                                                  style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:45px;padding-right:45px;padding-bottom:45px;padding-left:45px;max-width:37.5em;background-color:rgb(255,255,255);border-style:solid;border-width:1px;border-color:rgb(240,240,240)">
                                                  <tbody>
                                                    <tr>
                                                      <td>
                                                        <tr
                                                          style="margin:0;padding:0;width:100%">
                                                          <td
                                                            data-id="__react-email-column"
                                                            style="margin:0;padding:0">
                                                            <table
                                                              align="center"
                                                              width="100%"
                                                              border="0"
                                                              cellpadding="0"
                                                              cellspacing="0"
                                                              role="presentation"
                                                              style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                                              <tbody>
                                                                <tr>
                                                                  <td>
                                                                    <tr
                                                                      style="margin:0;padding:0">
                                                                      <td
                                                                        data-id="__react-email-column"
                                                                        style="margin:0;padding:0">
                                                                        <table
                                                                          align="center"
                                                                          width="100%"
                                                                          border="0"
                                                                          cellpadding="0"
                                                                          cellspacing="0"
                                                                          role="presentation">
                                                                          <tbody
                                                                            style="width:100%">
                                                                            <tr
                                                                              style="width:100%">
                                                                              <td
                                                                                align="start"
                                                                                data-id="__react-email-column">
                                                                                <img
                                                                                  alt='Sqooli'
                                                                                  height="30"
                                                                                  src="https://resend-attachments.s3.amazonaws.com/gFrCHn8THmN6gbB"
                                                                                  style="display:block;outline:none;border:none;text-decoration:none"
                                                                                  width="146" />
                                                                              </td>
                                                                            </tr>
                                                                          </tbody>
                                                                        </table>
                                                                        <p
                                                                          style="margin:0;padding:0;font-size:16px;line-height:26px;font-family:Open Sans,HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif;font-weight:300;color:rgb(64,64,64);margin-top:16px;margin-bottom:16px">
                                                                          <br /><span
                                                                            >Hi </span
                                                                          >${args.partner_name}<span>
                                                                            ,</span
                                                                          >
                                                                        </p>
                                                                        <p
                                                                          style="margin:0;padding:0;font-size:16px;line-height:26px;font-family:Open Sans,HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif;font-weight:300;color:rgb(64,64,64);margin-top:16px;margin-bottom:16px">
                                                                          <span
                                                                            >Your
                                                                            account
                                                                            has
                                                                            successfully
                                                                            been
                                                                            created,
                                                                            please use
                                                                            the
                                                                            credentials
                                                                            and link
                                                                            below to
                                                                            login:</span
                                                                          ><br /><br /><span
                                                                            >Username: </span
                                                                          >${args.user_name}<span
                                                                          > </span
                                                                          ><br /><span
                                                                            >Password: </span
                                                                          >${args.password}<span
                                                                          > </span
                                                                          ><br /><br /><span
                                                                            >Link: </span
                                                                          >${loginUrl}<span
                                                                          > </span>
                                                                        </p>
                                                                        <p
                                                                          style="margin:0;padding:0">
                                                                          <span
                                                                            ><a
                                                                              href="${loginUrl}"
                                                                              rel="noopener noreferrer nofollow"
                                                                              style="color:rgb(255,255,255);text-decoration-line:none;line-height:100%;text-decoration:none;display:block;max-width:100%;background-color:rgb(0,126,230);border-radius:0.25rem;font-size:15px;text-align:center;font-family:Open Sans,Helvetica Neue,Arial;width:210px;padding-bottom:14px;padding-top:14px;padding-right:7px;padding-left:7px"
                                                                              target="_blank"
                                                                              >Login</a
                                                                            ></span
                                                                          >
                                                                        </p>
                                                                        <p
                                                                          style="margin:0;padding:0;font-size:16px;line-height:26px;font-family:Open Sans,HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif;font-weight:300;color:rgb(64,64,64);margin-top:16px;margin-bottom:16px">
                                                                          <span
                                                                            >If you
                                                                            have any
                                                                            issues,
                                                                            please
                                                                            reach out
                                                                            by sending
                                                                            us an
                                                                            email or
                                                                            reaching
                                                                            out to us
                                                                            via the
                                                                            number
                                                                            provided
                                                                            on our
                                                                            website.</span
                                                                          ><br /><br /><span
                                                                            >To keep
                                                                            your
                                                                            account
                                                                            secure,
                                                                            please
                                                                            don&#x27;t
                                                                            forward
                                                                            this email
                                                                            to
                                                                            anyone.</span
                                                                          >
                                                                        </p>
                                                                        <p
                                                                          style="margin:0;padding:0;font-size:16px;line-height:26px;font-family:Open Sans,HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif;font-weight:300;color:rgb(64,64,64);margin-top:16px;margin-bottom:16px">
                                                                          <span
                                                                            >Thanks!</span
                                                                          >
                                                                        </p>
                                                                      </td>
                                                                    </tr>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </td>
                                            </tr>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  <p style="margin:0;padding:0"><br /></p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
          <!--/$-->
        </body>
      </html>
    `;

    try {
      await resend.sendEmail(ctx, {
        from: "Sqooli <noreply@sqooli.org>",
        to: args.user_email,
        subject: `Your Sqooli Account Credentials - ${args.partner_name}`,
        html: htmlContent,
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

/**
 * Send withdrawal notification email
 */
export const sendWithdrawalNotificationEmail = action({
  args: {
    partner_email: v.string(),
    partner_name: v.string(),
    amount: v.number(),
    reference_number: v.string(),
    withdrawal_method: v.string(),
    destination_account: v.string(),
    processing_days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const htmlContent = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html dir="ltr" lang="en">
        <head>
          <meta content="width=device-width" name="viewport" />
          <link
            rel="preload"
            as="image"
            href="https://resend-attachments.s3.amazonaws.com/gFrCHn8THmN6gbB" />
          <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
          <meta name="x-apple-disable-message-reformatting" />
          <meta content="IE=edge" http-equiv="X-UA-Compatible" />
          <meta name="x-apple-disable-message-reformatting" />
          <meta
            content="telephone=no,address=no,email=no,date=no,url=no"
            name="format-detection" />
        </head>
        <body>
          <!--$--><!--html--><!--head-->
          <div
            style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0"
            data-skip-in-text="true">
            Your withdrawal request has been submitted.
            <div>
              <!-- Preview text spacer -->
              ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌V
              ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
            </div>
          </div>
          <!--body-->
          <table
            border="0"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            align="center">
            <tbody>
              <tr>
                <td>
                  <table
                    align="center"
                    width="100%"
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    role="presentation">
                    <tbody>
                      <tr>
                        <td>
                          <table
                            width="100%"
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            role="presentation"
                            style="width:100%">
                            <tbody>
                              <tr>
                                <td>
                                  <div
                                    style="margin:0;padding:0;background-color:rgb(246,249,252)">
                                    <table
                                      align="center"
                                      width="100%"
                                      border="0"
                                      cellpadding="0"
                                      cellspacing="0"
                                      role="presentation"
                                      style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                      <tbody>
                                        <tr>
                                          <td>
                                            <tr style="margin:0;padding:0">
                                              <td
                                                data-id="__react-email-column"
                                                style="margin:0;padding:0;background-color:rgb(246,249,252);padding-bottom:10px;padding-top:10px">
                                              
                                                <table
                                                  align="center"
                                                  width="100%"
                                                  border="0"
                                                  cellpadding="0"
                                                  cellspacing="0"
                                                  role="presentation"
                                                  style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:45px;padding-right:45px;padding-bottom:45px;padding-left:45px;max-width:37.5em;background-color:rgb(255,255,255);border-style:solid;border-width:1px;border-color:rgb(240,240,240)">
                                                  <tbody>
                                                    <tr>
                                                      <td>
                                                        <tr
                                                          style="margin:0;padding:0;width:100%">
                                                          <td
                                                            data-id="__react-email-column"
                                                            style="margin:0;padding:0">
                                                            <table
                                                              align="center"
                                                              width="100%"
                                                              border="0"
                                                              cellpadding="0"
                                                              cellspacing="0"
                                                              role="presentation"
                                                              style="margin-top:0;margin-right:auto;margin-bottom:0;margin-left:auto;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0">
                                                              <tbody>
                                                                <tr>
                                                                  <td>
                                                                    <tr
                                                                      style="margin:0;padding:0">
                                                                      <td
                                                                        data-id="__react-email-column"
                                                                        style="margin:0;padding:0">
                                                                        <table
                                                                          align="center"
                                                                          width="100%"
                                                                          border="0"
                                                                          cellpadding="0"
                                                                          cellspacing="0"
                                                                          role="presentation">
                                                                          <tbody
                                                                            style="width:100%">
                                                                            <tr
                                                                              style="width:100%">
                                                                              <td
                                                                                align="start"
                                                                                data-id="__react-email-column">
                                                                                <img
                                                                                  alt='Sqooli'
                                                                                  height="30"
                                                                                  src="https://resend-attachments.s3.amazonaws.com/gFrCHn8THmN6gbB"
                                                                                  style="display:block;outline:none;border:none;text-decoration:none"
                                                                                  width="146" />
                                                                              </td>
                                                                            </tr>
                                                                          </tbody>
                                                                        </table>
                                                                        <h1
                                                                          style="margin:0;padding:0;font-size:24px;line-height:32px;font-family:Open Sans,HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif;font-weight:400;color:rgb(64,64,64);margin-top:24px;margin-bottom:16px">
                                                                          Withdrawal Request Submitted
                                                                        </h1>
                                                                        <p
                                                                          style="margin:0;padding:0;font-size:16px;line-height:26px;font-family:Open Sans,HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif;font-weight:300;color:rgb(64,64,64);margin-top:16px;margin-bottom:16px">
                                                                          <span>Hello </span
                                                                          >${args.partner_name}<span>,</span>
                                                                        </p>
                                                                        <p
                                                                          style="margin:0;padding:0;font-size:16px;line-height:26px;font-family:Open Sans,HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif;font-weight:300;color:rgb(64,64,64);margin-top:16px;margin-bottom:16px">
                                                                          <span>Your withdrawal request has been received and is being processed. You will receive a confirmation email once it's complete.</span>
                                                                        </p>

                                                                        <p
                                                                          style="margin:0;padding:0;font-size:16px;line-height:26px;font-family:Open Sans,HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif;font-weight:300;color:rgb(64,64,64);margin-top:24px;margin-bottom:16px; font-weight: 600;">
                                                                          Withdrawal Details:
                                                                        </p>

                                                                        <p
                                                                          style="margin:0;padding:0;font-size:16px;line-height:24px;font-family:Open Sans,HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif;font-weight:300;color:rgb(64,64,64);margin-top:8px;margin-bottom:8px">
                                                                          <span><strong>Amount:</strong> KES</span>${args.amount.toLocaleString()}<br>
                                                                          <span><strong>Reference Number:</strong> </span>${args.reference_number}<br>
                                                                          <span><strong>Withdrawal Method:</strong> </span>${args.withdrawal_method}<br>
                                                                          <span><strong>Destination Account:</strong> </span>${args.destination_account}<br>
                                                                        </p>
                                                                      
                                                                        <p
                                                                          style="margin:0;padding:0;font-size:16px;line-height:26px;font-family:Open Sans,HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif;font-weight:300;color:rgb(64,64,64);margin-top:16px;margin-bottom:16px">
                                                                          <span>If you
                                                                            have any
                                                                            issues,
                                                                            please
                                                                            reach out
                                                                            by sending
                                                                            us an
                                                                            email or
                                                                            reaching
                                                                            out to us
                                                                            via the
                                                                            number
                                                                            provided
                                                                            on our
                                                                            website.</span>
                                                                        </p>
                                                                        <p
                                                                          style="margin:0;padding:0;font-size:16px;line-height:26px;font-family:Open Sans,HelveticaNeue-Light,Helvetica Neue Light,Helvetica Neue,Helvetica,Arial,Lucida Grande,sans-serif;font-weight:300;color:rgb(64,64,64);margin-top:16px;margin-bottom:16px">
                                                                          <span>Thanks!</span>
                                                                        </p>
                                                                      </td>
                                                                    </tr>
                                                                  </td>
                                                                </tr>
                                                              </tbody>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </td>
                                            </tr>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                  <p style="margin:0;padding:0"><br /></p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
          <!--/$-->
        </body>
      </html>
    `;

    try {
      await resend.sendEmail(ctx, {
        from: "Sqooli <noreply@sqooli.org>",
        to: args.partner_email,
        subject: `Withdrawal Request Submitted - ${args.reference_number}`,
        html: htmlContent,
      });

      console.log(`Withdrawal notification email sent to ${args.partner_email}`);
      return { success: true };
    } catch (error: unknown) {
      console.error("Failed to send withdrawal notification email:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
});