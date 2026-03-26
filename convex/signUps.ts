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

export const listByShift = query({
  args: { shiftId: v.id("shifts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("signUps")
      .withIndex("by_shiftId", (q) => q.eq("shiftId", args.shiftId))
      .take(100);
  },
});

export const listByVolunteer = query({
  args: { volunteerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("signUps")
      .withIndex("by_volunteerId", (q) => q.eq("volunteerId", args.volunteerId))
      .take(50);
  },
});

export const mySignUps = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    const signUps = await ctx.db
      .query("signUps")
      .withIndex("by_volunteerId", (q) => q.eq("volunteerId", user._id))
      .take(50);

    return await Promise.all(
      signUps.map(async (s) => {
        const shift = await ctx.db.get(s.shiftId);
        const opportunity = shift ? await ctx.db.get(shift.opportunityId) : null;
        return {
          ...s,
          shiftDate: shift?.date ?? null,
          startTime: shift?.startTime ?? null,
          endTime: shift?.endTime ?? null,
          location: opportunity?.location ?? null,
          opportunityTitle: opportunity?.title ?? null,
          opportunityId: shift?.opportunityId ?? null,
        };
      })
    );
  },
});

export const listCompletedForVolunteer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();
    if (!user) return [];
    const signUps = await ctx.db
      .query("signUps")
      .withIndex("by_volunteerId", (q) => q.eq("volunteerId", user._id))
      .take(100);

    const completed = signUps.filter((s) => s.status === "Completed");

    return await Promise.all(
      completed.map(async (s) => {
        const shift = await ctx.db.get(s.shiftId);
        const opportunity = shift ? await ctx.db.get(shift.opportunityId) : null;
        return {
          ...s,
          shiftDate: shift?.date ?? null,
          opportunityTitle: opportunity?.title ?? null,
          opportunityId: shift?.opportunityId ?? null,
        };
      })
    );
  },
});

export const create = mutation({
  args: {
    shiftId: v.id("shifts"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);

    const shift = await ctx.db.get(args.shiftId);
    if (!shift) throw new Error("Shift not found");
    if (shift.status === "Cancelled") throw new Error("Shift is cancelled");
    if (shift.status === "Completed") throw new Error("Shift is already completed");

    // Check for duplicate active signup
    const existing = await ctx.db
      .query("signUps")
      .withIndex("by_shiftId_and_volunteerId", (q) =>
        q.eq("shiftId", args.shiftId).eq("volunteerId", caller._id)
      )
      .unique();

    if (existing && existing.status !== "Cancelled") {
      throw new Error("Already signed up for this shift");
    }

    const spotsRemaining = shift.spotsAvailable - shift.spotsFilled;
    const status = spotsRemaining > 0 ? "Confirmed" : "Waitlisted";

    const signUpId = await ctx.db.insert("signUps", {
      shiftId: args.shiftId,
      volunteerId: caller._id,
      status,
      signedUpAt: Date.now(),
      notes: args.notes,
    });

    if (status === "Confirmed") {
      const newSpotsFilled = shift.spotsFilled + 1;
      const newStatus = newSpotsFilled >= shift.spotsAvailable ? "Full" : "Open";
      await ctx.db.patch(args.shiftId, {
        spotsFilled: newSpotsFilled,
        status: newStatus,
      });
    }

    // Create notification
    await ctx.db.insert("notifications", {
      userId: caller._id,
      type: "SignUpConfirmed",
      title: status === "Confirmed" ? "Sign-Up Confirmed" : "Added to Waitlist",
      message:
        status === "Confirmed"
          ? "You have been confirmed for the shift."
          : "You have been added to the waitlist for the shift.",
      link: `/shifts/${args.shiftId}`,
      isRead: false,
    });

    await createAuditLog(ctx, caller._id, "SignUp", "signUps", signUpId, `Status: ${status}`);
    return { signUpId, status };
  },
});

export const cancel = mutation({
  args: { id: v.id("signUps") },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);

    const signUp = await ctx.db.get(args.id);
    if (!signUp) throw new Error("Sign-up not found");
    if (signUp.volunteerId !== caller._id && caller.role === "Volunteer") {
      throw new Error("Unauthorized");
    }

    const wasConfirmed = signUp.status === "Confirmed";

    await ctx.db.patch(args.id, {
      status: "Cancelled",
      cancelledAt: Date.now(),
    });

    if (wasConfirmed) {
      const shift = await ctx.db.get(signUp.shiftId);
      if (shift) {
        const newSpotsFilled = Math.max(0, shift.spotsFilled - 1);
        await ctx.db.patch(signUp.shiftId, {
          spotsFilled: newSpotsFilled,
          status: newSpotsFilled < shift.spotsAvailable ? "Open" : "Full",
        });

        // Promote first waitlisted volunteer
        const firstWaitlisted = await ctx.db
          .query("signUps")
          .withIndex("by_shiftId_and_status", (q) =>
            q.eq("shiftId", signUp.shiftId).eq("status", "Waitlisted")
          )
          .first();

        if (firstWaitlisted) {
          await ctx.db.patch(firstWaitlisted._id, { status: "Confirmed" });
          await ctx.db.patch(signUp.shiftId, {
            spotsFilled: newSpotsFilled + 1,
          });

          // Notify the promoted volunteer
          await ctx.db.insert("notifications", {
            userId: firstWaitlisted.volunteerId,
            type: "SignUpConfirmed",
            title: "Spot Available — You're Confirmed!",
            message: "A spot opened up and you have been moved from the waitlist to confirmed.",
            link: `/shifts/${signUp.shiftId}`,
            isRead: false,
          });
        }
      }
    }

    await createAuditLog(ctx, caller._id, "StatusChange", "signUps", args.id, "Sign-up cancelled");
  },
});
