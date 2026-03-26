import { query } from "./_generated/server";
import { v } from "convex/values";

async function getCallerOrThrow(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  const caller = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.tokenIdentifier))
    .unique();
  if (!caller) throw new Error("User not found");
  return caller;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const caller = await getCallerOrThrow(ctx);
    if (caller.role !== "Admin") throw new Error("Unauthorized");

    return await ctx.db.query("auditLogs").order("desc").take(50);
  },
});

export const listByEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    if (caller.role !== "Admin") throw new Error("Unauthorized");

    return await ctx.db
      .query("auditLogs")
      .withIndex("by_entityType_and_entityId", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .take(100);
  },
});
