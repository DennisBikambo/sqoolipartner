/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as assets from "../assets.js";
import type * as campaign from "../campaign.js";
import type * as curricula from "../curricula.js";
import type * as http from "../http.js";
import type * as partner from "../partner.js";
import type * as partner_revenue from "../partner_revenue.js";
import type * as program from "../program.js";
import type * as program_enrollments from "../program_enrollments.js";
import type * as program_subjects from "../program_subjects.js";
import type * as subjects from "../subjects.js";
import type * as transactions from "../transactions.js";
import type * as wallet from "../wallet.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assets: typeof assets;
  campaign: typeof campaign;
  curricula: typeof curricula;
  http: typeof http;
  partner: typeof partner;
  partner_revenue: typeof partner_revenue;
  program: typeof program;
  program_enrollments: typeof program_enrollments;
  program_subjects: typeof program_subjects;
  subjects: typeof subjects;
  transactions: typeof transactions;
  wallet: typeof wallet;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
