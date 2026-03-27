import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Temporary QA helper — will be removed after testing

export const createTestUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("Admin"), v.literal("Coordinator"), v.literal("Volunteer")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (existing) {
      // Update role if needed
      if (existing.role !== args.role) {
        await ctx.db.patch(existing._id, { role: args.role, updatedAt: Date.now() });
      }
      return existing._id;
    }
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      role: args.role,
      isActive: true,
      updatedAt: Date.now(),
    });
  },
});

export const countTable = query({
  args: { table: v.string() },
  handler: async (ctx, args) => {
    const tableName = args.table as any;
    const records = await ctx.db.query(tableName).take(200);
    return records.length;
  },
});
