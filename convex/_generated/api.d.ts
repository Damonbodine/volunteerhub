/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as auditLogs from "../auditLogs.js";
import type * as dashboard from "../dashboard.js";
import type * as hourLogs from "../hourLogs.js";
import type * as notifications from "../notifications.js";
import type * as opportunities from "../opportunities.js";
import type * as qaHelper from "../qaHelper.js";
import type * as seed from "../seed.js";
import type * as shifts from "../shifts.js";
import type * as signUps from "../signUps.js";
import type * as teamMembers from "../teamMembers.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  auditLogs: typeof auditLogs;
  dashboard: typeof dashboard;
  hourLogs: typeof hourLogs;
  notifications: typeof notifications;
  opportunities: typeof opportunities;
  qaHelper: typeof qaHelper;
  seed: typeof seed;
  shifts: typeof shifts;
  signUps: typeof signUps;
  teamMembers: typeof teamMembers;
  teams: typeof teams;
  users: typeof users;
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

export declare const components: {};
