/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assets from "../assets.js";
import type * as audit from "../audit.js";
import type * as campaign from "../campaign.js";
import type * as createPartner from "../createPartner.js";
import type * as createSuperAdmin from "../createSuperAdmin.js";
import type * as curricula from "../curricula.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as makeSuperAdmin from "../makeSuperAdmin.js";
import type * as notifications from "../notifications.js";
import type * as partner from "../partner.js";
import type * as partner_revenue from "../partner_revenue.js";
import type * as permission from "../permission.js";
import type * as program from "../program.js";
import type * as program_enrollments from "../program_enrollments.js";
import type * as program_subjects from "../program_subjects.js";
import type * as role from "../role.js";
import type * as seedPermissions from "../seedPermissions.js";
import type * as seedProgram from "../seedProgram.js";
import type * as seedRoles from "../seedRoles.js";
import type * as session from "../session.js";
import type * as subjects from "../subjects.js";
import type * as testEmails from "../testEmails.js";
import type * as transactions from "../transactions.js";
import type * as updateExistingPartner from "../updateExistingPartner.js";
import type * as user from "../user.js";
import type * as wallet from "../wallet.js";
import type * as withdrawalLimits from "../withdrawalLimits.js";
import type * as withdrawals from "../withdrawals.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assets: typeof assets;
  audit: typeof audit;
  campaign: typeof campaign;
  createPartner: typeof createPartner;
  createSuperAdmin: typeof createSuperAdmin;
  curricula: typeof curricula;
  emails: typeof emails;
  http: typeof http;
  makeSuperAdmin: typeof makeSuperAdmin;
  notifications: typeof notifications;
  partner: typeof partner;
  partner_revenue: typeof partner_revenue;
  permission: typeof permission;
  program: typeof program;
  program_enrollments: typeof program_enrollments;
  program_subjects: typeof program_subjects;
  role: typeof role;
  seedPermissions: typeof seedPermissions;
  seedProgram: typeof seedProgram;
  seedRoles: typeof seedRoles;
  session: typeof session;
  subjects: typeof subjects;
  testEmails: typeof testEmails;
  transactions: typeof transactions;
  updateExistingPartner: typeof updateExistingPartner;
  user: typeof user;
  wallet: typeof wallet;
  withdrawalLimits: typeof withdrawalLimits;
  withdrawals: typeof withdrawals;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      cleanupAbandonedEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      cleanupOldEmails: FunctionReference<
        "mutation",
        "internal",
        { olderThan?: number },
        null
      >;
      createManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          replyTo?: Array<string>;
          subject: string;
          to: string;
        },
        string
      >;
      get: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          createdAt: number;
          errorMessage?: string;
          finalizedAt: number;
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          opened: boolean;
          replyTo: Array<string>;
          resendId?: string;
          segment: number;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
          subject: string;
          text?: string;
          to: string;
        } | null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          errorMessage: string | null;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        } | null
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject: string;
          text?: string;
          to: string;
        },
        string
      >;
      updateManualEmail: FunctionReference<
        "mutation",
        "internal",
        {
          emailId: string;
          errorMessage?: string;
          resendId?: string;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced"
            | "failed";
        },
        null
      >;
    };
  };
};
