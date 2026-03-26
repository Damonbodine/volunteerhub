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

export const listByOpportunity = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("shifts")
      .withIndex("by_opportunityId", (q) => q.eq("opportunityId", args.opportunityId))
      .take(100);
  },
});

export const getById = query({
  args: { id: v.id("shifts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    date: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    spotsAvailable: v.number(),
    locationOverride: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);

    if (caller.role !== "Admin") {
      // Coordinators can only create shifts for their own opportunities
      if (caller.role === "Coordinator") {
        const opportunity = await ctx.db.get(args.opportunityId);
        if (!opportunity || opportunity.coordinatorId !== caller._id) {
          throw new Error("Unauthorized: not your opportunity");
        }
      } else {
        throw new Error("Unauthorized");
      }
    }

    const id = await ctx.db.insert("shifts", {
      ...args,
      spotsFilled: 0,
      status: "Open",
    });

    await createAuditLog(ctx, caller._id, "Create", "shifts", id, `Shift created for opportunity ${args.opportunityId}`);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("shifts"),
    date: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    spotsAvailable: v.optional(v.number()),
    locationOverride: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("Open"),
        v.literal("Full"),
        v.literal("Completed"),
        v.literal("Cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    const shift = await ctx.db.get(args.id);
    if (!shift) throw new Error("Shift not found");

    if (caller.role !== "Admin") {
      if (caller.role === "Coordinator") {
        const opportunity = await ctx.db.get(shift.opportunityId);
        if (!opportunity || opportunity.coordinatorId !== caller._id) {
          throw new Error("Unauthorized: not your opportunity");
        }
      } else {
        throw new Error("Unauthorized");
      }
    }

    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
    await createAuditLog(ctx, caller._id, "Update", "shifts", id, "Shift updated");
  },
});

export const complete = mutation({
  args: { id: v.id("shifts") },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    const shift = await ctx.db.get(args.id);
    if (!shift) throw new Error("Shift not found");

    if (caller.role !== "Admin") {
      if (caller.role === "Coordinator") {
        const opportunity = await ctx.db.get(shift.opportunityId);
        if (!opportunity || opportunity.coordinatorId !== caller._id) {
          throw new Error("Unauthorized: not your opportunity");
        }
      } else {
        throw new Error("Unauthorized");
      }
    }

    await ctx.db.patch(args.id, { status: "Completed" });

    // Update all Confirmed signups for this shift to Completed
    const confirmedSignUps = await ctx.db
      .query("signUps")
      .withIndex("by_shiftId_and_status", (q) =>
        q.eq("shiftId", args.id).eq("status", "Confirmed")
      )
      .take(200);

    for (const signUp of confirmedSignUps) {
      await ctx.db.patch(signUp._id, { status: "Completed" });
    }

    await createAuditLog(ctx, caller._id, "StatusChange", "shifts", args.id, "Shift marked completed");
  },
});
