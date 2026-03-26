import { mutation, query } from "./_generated/server";
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

export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();
    if (!user) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_isRead", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .take(200);

    return unread.length;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    const notification = await ctx.db.get(args.id);
    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== caller._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { isRead: true });
  },
});

export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const caller = await getCallerOrThrow(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_isRead", (q) =>
        q.eq("userId", caller._id).eq("isRead", false)
      )
      .take(200);

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  },
});
