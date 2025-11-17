/**
 * Test Email Functions
 *
 * These are test actions to verify email sending is working correctly.
 * Run these from the Convex dashboard under the "testEmails" module.
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
// @ts-ignore - emails module exists but TS can't find it
import { api } from "./_generated/api";

/**
 * Test sending user credentials email
 *
 * Usage: Run from Convex dashboard with your test email
 * Example args:
 * {
 *   "test_email": "your-email@example.com",
 *   "user_name": "Test User"
 * }
 */
export const testCredentialsEmail = action({
  args: {
    test_email: v.string(),
    user_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("🧪 Testing credentials email...");

    // @ts-ignore - emails module exists in runtime
    const result = await ctx.runAction(api.emails.sendUserCredentialsEmail, {
      user_email: args.test_email,
      user_name: args.user_name || "Test User",
      password: "TestPass123!",
      extension: "TEST001",
      partner_name: "Test Partner Organization",
    });

    if (result.success) {
      console.log("✅ Credentials email sent successfully to:", args.test_email);
      return {
        success: true,
        message: `Test credentials email sent to ${args.test_email}`,
      };
    } else {
      console.error("❌ Failed to send credentials email:", result.error);
      return {
        success: false,
        error: result.error,
      };
    }
  },
});

/**
 * Test sending withdrawal notification email
 *
 * Usage: Run from Convex dashboard with your test email
 * Example args:
 * {
 *   "test_email": "your-email@example.com",
 *   "partner_name": "Test Partner"
 * }
 */
export const testWithdrawalEmail = action({
  args: {
    test_email: v.string(),
    partner_name: v.optional(v.string()),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log("🧪 Testing withdrawal notification email...");

    // @ts-ignore - emails module exists in runtime
    const result = await ctx.runAction(api.emails.sendWithdrawalNotificationEmail, {
      partner_email: args.test_email,
      partner_name: args.partner_name || "Test Partner",
      amount: args.amount || 50000,
      reference_number: "WD-TEST-123456",
      withdrawal_method: "mpesa",
      destination_account: "254700000000",
      processing_days: 3,
    });

    if (result.success) {
      console.log("✅ Withdrawal email sent successfully to:", args.test_email);
      return {
        success: true,
        message: `Test withdrawal email sent to ${args.test_email}`,
      };
    } else {
      console.error("❌ Failed to send withdrawal email:", result.error);
      return {
        success: false,
        error: result.error,
      };
    }
  },
});

/**
 * Test both emails at once
 *
 * Usage: Run from Convex dashboard with your test email
 * Example args:
 * {
 *   "test_email": "your-email@example.com"
 * }
 */
export const testAllEmails = action({
  args: {
    test_email: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("🧪 Testing all email templates...");

    const results: {
      credentials: { success: boolean; error?: string };
      withdrawal: { success: boolean; error?: string };
    } = {
      credentials: { success: false, error: "" },
      withdrawal: { success: false, error: "" },
    };

    // Test credentials email
    try {
      // @ts-ignore - emails module exists in runtime
      const credentialsResult = await ctx.runAction(api.emails.sendUserCredentialsEmail, {
        user_email: args.test_email,
        user_name: "Test User",
        password: "TestPass123!",
        extension: "TEST001",
        partner_name: "Test Partner Organization",
      });
      results.credentials = credentialsResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      results.credentials = { success: false, error: errorMessage };
    }

    // Test withdrawal email
    try {
      // @ts-ignore - emails module exists in runtime
      const withdrawalResult = await ctx.runAction(api.emails.sendWithdrawalNotificationEmail, {
        partner_email: args.test_email,
        partner_name: "Test Partner",
        amount: 50000,
        reference_number: "WD-TEST-123456",
        withdrawal_method: "mpesa",
        destination_account: "254700000000",
        processing_days: 3,
      });
      results.withdrawal = withdrawalResult;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      results.withdrawal = { success: false, error: errorMessage };
    }

    const allSuccess = results.credentials.success && results.withdrawal.success;

    if (allSuccess) {
      console.log("✅ All test emails sent successfully!");
    } else {
      console.error("❌ Some emails failed:", results);
    }

    return {
      success: allSuccess,
      results,
      message: allSuccess
        ? `All test emails sent to ${args.test_email}`
        : "Some emails failed to send. Check results for details.",
    };
  },
});
