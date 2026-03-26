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

export const listByVolunteer = query({
  args: { volunteerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (args.volunteerId) {
      return await ctx.db
        .query("hourLogs")
        .withIndex("by_volunteerId", (q) => q.eq("volunteerId", args.volunteerId!))
        .take(100);
    }
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    return await ctx.db
      .query("hourLogs")
      .withIndex("by_volunteerId", (q) => q.eq("volunteerId", user._id))
      .take(100);
  },
});

export const myHourLogs = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    const logs = await ctx.db
      .query("hourLogs")
      .withIndex("by_volunteerId", (q) => q.eq("volunteerId", user._id))
      .take(100);

    return await Promise.all(
      logs.map(async (log) => {
        const opportunity = (await ctx.db.get(log.opportunityId)) as { title: string } | null;
        return {
          ...log,
          opportunityTitle: opportunity?.title ?? null,
        };
      })
    );
  },
});

export const listPendingByOpportunity = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("hourLogs")
      .withIndex("by_opportunityId_and_status", (q) =>
        q.eq("opportunityId", args.opportunityId).eq("status", "Pending")
      )
      .take(100);
  },
});

export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const caller = await getCallerOrThrow(ctx);

    let rawLogs: any[] = [];

    if (caller.role === "Admin") {
      rawLogs = await ctx.db
        .query("hourLogs")
        .withIndex("by_status", (q) => q.eq("status", "Pending"))
        .take(100);
    } else if (caller.role === "Coordinator") {
      // Get the coordinator's opportunities
      const opportunities = await ctx.db
        .query("opportunities")
        .withIndex("by_coordinatorId", (q) => q.eq("coordinatorId", caller._id))
        .take(50);

      for (const opp of opportunities) {
        const logs = await ctx.db
          .query("hourLogs")
          .withIndex("by_opportunityId_and_status", (q) =>
            q.eq("opportunityId", opp._id).eq("status", "Pending")
          )
          .take(50);
        rawLogs.push(...logs);
      }
    } else {
      return [];
    }

    return await Promise.all(
      rawLogs.map(async (log) => {
        const volunteer = (await ctx.db.get(log.volunteerId)) as { name: string } | null;
        const opportunity = (await ctx.db.get(log.opportunityId)) as { title: string } | null;
        return {
          ...log,
          volunteerName: volunteer?.name ?? null,
          opportunityTitle: opportunity?.title ?? null,
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    shiftId: v.id("shifts"),
    hoursWorked: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    if (caller.role !== "Volunteer" && caller.role !== "Coordinator") {
      // Admins can also log hours
    }

    const shift = await ctx.db.get(args.shiftId);
    if (!shift) throw new Error("Shift not found");

    // Enforce: shift must be Completed, or volunteer's signup must be Completed
    let isEligible = shift.status === "Completed";
    if (!isEligible) {
      const signUp = await ctx.db
        .query("signUps")
        .withIndex("by_shiftId_and_volunteerId", (q) =>
          q.eq("shiftId", args.shiftId).eq("volunteerId", caller._id)
        )
        .unique();
      if (signUp && signUp.status === "Completed") {
        isEligible = true;
      }
    }

    if (!isEligible) {
      throw new Error("Shift must be completed before logging hours");
    }

    const id = await ctx.db.insert("hourLogs", {
      volunteerId: caller._id,
      shiftId: args.shiftId,
      opportunityId: shift.opportunityId,
      hoursWorked: args.hoursWorked,
      description: args.description,
      status: "Pending",
      submittedAt: Date.now(),
    });

    await createAuditLog(ctx, caller._id, "HourLog", "hourLogs", id, `${args.hoursWorked} hours submitted`);
    return id;
  },
});

export const approve = mutation({
  args: { id: v.id("hourLogs") },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);

    const log = await ctx.db.get(args.id);
    if (!log) throw new Error("Hour log not found");

    if (caller.role !== "Admin") {
      if (caller.role === "Coordinator") {
        const opportunity = await ctx.db.get(log.opportunityId);
        if (!opportunity || opportunity.coordinatorId !== caller._id) {
          throw new Error("Unauthorized: not your opportunity");
        }
      } else {
        throw new Error("Unauthorized");
      }
    }

    await ctx.db.patch(args.id, {
      status: "Approved",
      approvedById: caller._id,
      approvedAt: Date.now(),
    });

    await ctx.db.insert("notifications", {
      userId: log.volunteerId,
      type: "HoursApproved",
      title: "Hours Approved",
      message: `Your ${log.hoursWorked} hour(s) have been approved.`,
      link: `/hour-logs/${args.id}`,
      isRead: false,
    });

    await createAuditLog(ctx, caller._id, "StatusChange", "hourLogs", args.id, "Hours approved");
  },
});

export const reject = mutation({
  args: {
    id: v.id("hourLogs"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);

    const log = await ctx.db.get(args.id);
    if (!log) throw new Error("Hour log not found");

    if (caller.role !== "Admin") {
      if (caller.role === "Coordinator") {
        const opportunity = await ctx.db.get(log.opportunityId);
        if (!opportunity || opportunity.coordinatorId !== caller._id) {
          throw new Error("Unauthorized: not your opportunity");
        }
      } else {
        throw new Error("Unauthorized");
      }
    }

    await ctx.db.patch(args.id, {
      status: "Rejected",
      rejectedReason: args.reason,
    });

    await ctx.db.insert("notifications", {
      userId: log.volunteerId,
      type: "HoursRejected",
      title: "Hours Rejected",
      message: `Your hour log was rejected. Reason: ${args.reason}`,
      link: `/hour-logs/${args.id}`,
      isRead: false,
    });

    await createAuditLog(ctx, caller._id, "StatusChange", "hourLogs", args.id, `Hours rejected: ${args.reason}`);
  },
});
