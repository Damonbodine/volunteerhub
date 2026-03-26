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
  args: {},
  handler: async (ctx) => {
    const caller = await getCallerOrThrow(ctx);

    let teams: any[] = [];
    if (caller.role === "Admin") {
      teams = await ctx.db.query("teams").take(100);
    } else if (caller.role === "Coordinator") {
      teams = await ctx.db
        .query("teams")
        .withIndex("by_coordinatorId", (q) => q.eq("coordinatorId", caller._id))
        .take(50);
    } else {
      return [];
    }

    return await Promise.all(
      teams.map(async (team) => {
        const coordinator = (await ctx.db.get(team.coordinatorId)) as { name: string } | null;
        const memberCount = (
          await ctx.db
            .query("teamMembers")
            .withIndex("by_teamId", (q) => q.eq("teamId", team._id))
            .take(1000)
        ).length;
        return {
          ...team,
          coordinatorName: coordinator?.name ?? null,
          memberCount,
        };
      })
    );
  },
});

export const getById = query({
  args: { id: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    if (caller.role !== "Coordinator" && caller.role !== "Admin") {
      throw new Error("Unauthorized");
    }

    const id = await ctx.db.insert("teams", {
      name: args.name,
      description: args.description,
      coordinatorId: caller._id,
      isActive: true,
      updatedAt: Date.now(),
    });

    await createAuditLog(ctx, caller._id, "Create", "teams", id, `Team created: ${args.name}`);
    return id;
  },
});

export const getMembers = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .take(200);

    return await Promise.all(
      memberships.map(async (m) => {
        const volunteer = await ctx.db.get(m.volunteerId);
        return {
          ...m,
          name: volunteer?.name ?? "Unknown",
          email: volunteer?.email ?? "",
        };
      })
    );
  },
});

export const addMember = mutation({
  args: {
    teamId: v.id("teams"),
    volunteerEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    if (caller.role !== "Admin" && caller.role !== "Coordinator") {
      throw new Error("Unauthorized");
    }

    const volunteer = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.volunteerEmail))
      .unique();
    if (!volunteer) throw new Error("Volunteer not found with that email");

    const existing = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId_and_volunteerId", (q) =>
        q.eq("teamId", args.teamId).eq("volunteerId", volunteer._id)
      )
      .unique();
    if (existing) throw new Error("Volunteer is already a member of this team");

    const id = await ctx.db.insert("teamMembers", {
      teamId: args.teamId,
      volunteerId: volunteer._id,
      joinedAt: Date.now(),
    });

    await createAuditLog(ctx, caller._id, "Create", "teamMembers", id, `Added ${volunteer.email} to team`);
    return id;
  },
});

export const removeMember = mutation({
  args: {
    teamId: v.id("teams"),
    volunteerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    if (caller.role !== "Admin" && caller.role !== "Coordinator") {
      throw new Error("Unauthorized");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_teamId_and_volunteerId", (q) =>
        q.eq("teamId", args.teamId).eq("volunteerId", args.volunteerId)
      )
      .unique();
    if (!membership) throw new Error("Member not found");

    await ctx.db.delete(membership._id);
    await createAuditLog(ctx, caller._id, "Delete", "teamMembers", membership._id, "Member removed from team");
  },
});

export const update = mutation({
  args: {
    id: v.id("teams"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const caller = await getCallerOrThrow(ctx);
    const team = await ctx.db.get(args.id);
    if (!team) throw new Error("Team not found");

    if (caller.role !== "Admin" && team.coordinatorId !== caller._id) {
      throw new Error("Unauthorized");
    }

    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    await createAuditLog(ctx, caller._id, "Update", "teams", id, "Team updated");
  },
});
