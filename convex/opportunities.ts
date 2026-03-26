import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

async function createAuditLog(
  ctx: any,
  userId: Id<"users">,
  action: "Create" | "Update" | "Delete" | "StatusChange" | "SignUp" | "HourLog" | "Login",
  entityType: string,
  entityId: string,
  details?: string
) {
  await ctx.db.insert("auditLogs", {
    userId,
    action,
    entityType,
    entityId,
    details,
  });
}

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
  args: {
    status: v.optional(
      v.union(
        v.literal("Draft"),
        v.literal("Active"),
        v.literal("Full"),
        v.literal("Completed"),
        v.literal("Cancelled")
      )
    ),
    category: v.optional(
      v.union(
        v.literal("Event"),
        v.literal("Ongoing"),
        v.literal("OneTime"),
        v.literal("Seasonal")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.status && args.category) {
      return await ctx.db
        .query("opportunities")
        .withIndex("by_status_and_category", (q: any) =>
          q.eq("status", args.status).eq("category", args.category)
        )
        .take(50);
    } else if (args.status) {
      return await ctx.db
        .query("opportunities")
        .withIndex("by_status", (q: any) => q.eq("status", args.status))
        .take(50);
    } else if (args.category) {
      return await ctx.db
        .query("opportunities")
        .withIndex("by_category", (q: any) => q.eq("category", args.category))
        .take(50);
    } else {
      return await ctx.db.query("opportunities").take(50);
    }
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("opportunities")
      .withIndex("by_status", (q) => q.eq("status", "Active"))
      .take(50);
  },
});

export const getById = query({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByCoordinator = query({
  args: { coordinatorId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("opportunities")
      .withIndex("by_coordinatorId", (q) => q.eq("coordinatorId", args.coordinatorId))
      .take(50);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("Event"),
      v.literal("Ongoing"),
      v.literal("OneTime"),
      v.literal("Seasonal")
    ),
    location: v.string(),
    address: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
    spotsTotal: v.number(),
    skillsNeeded: v.optional(v.array(v.string())),
    coordinatorId: v.id("users"),
    imageUrl: v.optional(v.string()),
    isRecurring: v.boolean(),
  },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    if (caller.role !== "Admin") throw new Error("Unauthorized");

    const id = await ctx.db.insert("opportunities", {
      ...args,
      spotsFilled: 0,
      status: "Draft",
      updatedAt: Date.now(),
    });

    await createAuditLog(ctx, caller._id, "Create", "opportunities", id, `Opportunity created: ${args.title}`);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("opportunities"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("Event"),
        v.literal("Ongoing"),
        v.literal("OneTime"),
        v.literal("Seasonal")
      )
    ),
    location: v.optional(v.string()),
    address: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    spotsTotal: v.optional(v.number()),
    skillsNeeded: v.optional(v.array(v.string())),
    coordinatorId: v.optional(v.id("users")),
    imageUrl: v.optional(v.string()),
    isRecurring: v.optional(v.boolean()),
    status: v.optional(
      v.union(
        v.literal("Draft"),
        v.literal("Active"),
        v.literal("Full"),
        v.literal("Completed"),
        v.literal("Cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    const opportunity = await ctx.db.get(args.id);
    if (!opportunity) throw new Error("Opportunity not found");

    if (caller.role !== "Admin" && opportunity.coordinatorId !== caller._id) {
      throw new Error("Unauthorized");
    }

    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    await createAuditLog(ctx, caller._id, "Update", "opportunities", id, "Opportunity updated");
  },
});

export const cancel = mutation({
  args: { id: v.id("opportunities") },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    if (caller.role !== "Admin") throw new Error("Unauthorized");

    const opportunity = await ctx.db.get(args.id);
    if (!opportunity) throw new Error("Opportunity not found");

    // Cancel the opportunity
    await ctx.db.patch(args.id, { status: "Cancelled", updatedAt: Date.now() });

    // Cancel all shifts for this opportunity
    const shifts = await ctx.db
      .query("shifts")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.id))
      .take(200);

    for (const shift of shifts) {
      await ctx.db.patch(shift._id, { status: "Cancelled" });

      // Cancel all active signups for each shift and notify volunteers
      const activeSignUps = await ctx.db
        .query("signUps")
        .withIndex("by_shiftId_and_status", (q) =>
          q.eq("shiftId", shift._id).eq("status", "Confirmed")
        )
        .take(100);

      for (const signUp of activeSignUps) {
        await ctx.db.patch(signUp._id, {
          status: "Cancelled",
          cancelledAt: Date.now(),
        });

        // Notify the volunteer
        await ctx.db.insert("notifications", {
          userId: signUp.volunteerId,
          type: "ShiftCancelled",
          title: "Shift Cancelled",
          message: `A shift for "${opportunity.title}" has been cancelled.`,
          link: `/opportunities/${args.id}`,
          isRead: false,
        });
      }

      // Also cancel waitlisted signups
      const waitlistedSignUps = await ctx.db
        .query("signUps")
        .withIndex("by_shiftId_and_status", (q) =>
          q.eq("shiftId", shift._id).eq("status", "Waitlisted")
        )
        .take(100);

      for (const signUp of waitlistedSignUps) {
        await ctx.db.patch(signUp._id, {
          status: "Cancelled",
          cancelledAt: Date.now(),
        });

        await ctx.db.insert("notifications", {
          userId: signUp.volunteerId,
          type: "ShiftCancelled",
          title: "Shift Cancelled",
          message: `A shift you were waitlisted for at "${opportunity.title}" has been cancelled.`,
          link: `/opportunities/${args.id}`,
          isRead: false,
        });
      }
    }

    await createAuditLog(
      ctx,
      caller._id,
      "StatusChange",
      "opportunities",
      args.id,
      "Opportunity cancelled with cascading cancellation"
    );
  },
});
