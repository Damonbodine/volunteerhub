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

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();
  },
});

export const createOrGet = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastLoginAt: Date.now() });
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: identity.tokenIdentifier,
      name: identity.name ?? "Unknown",
      email: identity.email ?? "",
      role: "Volunteer",
      isActive: true,
      lastLoginAt: Date.now(),
      updatedAt: Date.now(),
    });

    await createAuditLog(ctx, userId, "Create", "users", userId, "User created via createOrGet");
    return userId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();
    if (!caller || caller.role !== "Admin") throw new Error("Unauthorized");

    return await ctx.db.query("users").take(100);
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    availabilityNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();
    if (!caller) throw new Error("User not found");

    const { id, ...fields } = args;
    const patch: Record<string, any> = { updatedAt: Date.now() };
    if (fields.name !== undefined) patch.name = fields.name;
    if (fields.phone !== undefined) patch.phone = fields.phone;
    if (fields.bio !== undefined) patch.bio = fields.bio;
    if (fields.skills !== undefined) patch.skills = fields.skills;
    if (fields.availabilityNotes !== undefined) patch.availabilityNotes = fields.availabilityNotes;

    await ctx.db.patch(id, patch);
    await createAuditLog(ctx, caller._id, "Update", "users", id, "User profile updated");
  },
});

export const updateRole = mutation({
  args: {
    id: v.id("users"),
    role: v.union(v.literal("Admin"), v.literal("Coordinator"), v.literal("Volunteer")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();
    if (!caller || caller.role !== "Admin") throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { role: args.role, updatedAt: Date.now() });
    await createAuditLog(ctx, caller._id, "Update", "users", args.id, `Role changed to ${args.role}`);
  },
});

export const listCoordinators = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "Coordinator"))
      .take(100);
  },
});

export const deactivate = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const caller = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.tokenIdentifier))
      .unique();
    if (!caller || caller.role !== "Admin") throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { isActive: false, updatedAt: Date.now() });
    await createAuditLog(ctx, caller._id, "StatusChange", "users", args.id, "User deactivated");
  },
});
