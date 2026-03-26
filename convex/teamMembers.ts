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

export const listByTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .take(100);
  },
});

export const addMember = mutation({
  args: {
    teamId: v.id("teams"),
    volunteerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new Error("Team not found");

    if (caller.role !== "Admin" && team.coordinatorId !== caller._id) {
      throw new Error("Unauthorized: not your team");
    }

    // Check if already a member
    const existing = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId_and_volunteerId", (q) =>
        q.eq("teamId", args.teamId).eq("volunteerId", args.volunteerId)
      )
      .unique();

    if (existing) throw new Error("User is already a team member");

    const id = await ctx.db.insert("teamMembers", {
      teamId: args.teamId,
      volunteerId: args.volunteerId,
      joinedAt: Date.now(),
    });

    await createAuditLog(
      ctx,
      caller._id,
      "Create",
      "teamMembers",
      id,
      `Added volunteer ${args.volunteerId} to team ${args.teamId}`
    );
    return id;
  },
});

export const removeMember = mutation({
  args: { id: v.id("teamMembers") },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    const member = await ctx.db.get(args.id);
    if (!member) throw new Error("Team member not found");

    const team = await ctx.db.get(member.teamId);
    if (!team) throw new Error("Team not found");

    if (caller.role !== "Admin" && team.coordinatorId !== caller._id) {
      throw new Error("Unauthorized: not your team");
    }

    await ctx.db.delete(args.id);
    await createAuditLog(
      ctx,
      caller._id,
      "Delete",
      "teamMembers",
      args.id,
      `Removed volunteer ${member.volunteerId} from team ${member.teamId}`
    );
  },
});
