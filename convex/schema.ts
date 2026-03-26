import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("Admin"), v.literal("Coordinator"), v.literal("Volunteer")),
    bio: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    availabilityNotes: v.optional(v.string()),
    isActive: v.boolean(),
    lastLoginAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_isActive", ["isActive"]),

  opportunities: defineTable({
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
    spotsFilled: v.number(),
    skillsNeeded: v.optional(v.array(v.string())),
    status: v.union(
      v.literal("Draft"),
      v.literal("Active"),
      v.literal("Full"),
      v.literal("Completed"),
      v.literal("Cancelled")
    ),
    coordinatorId: v.id("users"),
    imageUrl: v.optional(v.string()),
    isRecurring: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_coordinatorId", ["coordinatorId"])
    .index("by_category", ["category"])
    .index("by_status_and_category", ["status", "category"]),

  shifts: defineTable({
    opportunityId: v.id("opportunities"),
    date: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    spotsAvailable: v.number(),
    spotsFilled: v.number(),
    locationOverride: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.union(
      v.literal("Open"),
      v.literal("Full"),
      v.literal("Completed"),
      v.literal("Cancelled")
    ),
  })
    .index("by_opportunityId", ["opportunityId"])
    .index("by_status", ["status"])
    .index("by_date", ["date"])
    .index("by_opportunityId_and_status", ["opportunityId", "status"]),

  signUps: defineTable({
    shiftId: v.id("shifts"),
    volunteerId: v.id("users"),
    status: v.union(
      v.literal("Confirmed"),
      v.literal("Waitlisted"),
      v.literal("Cancelled"),
      v.literal("NoShow"),
      v.literal("Completed")
    ),
    signedUpAt: v.number(),
    cancelledAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_shiftId", ["shiftId"])
    .index("by_volunteerId", ["volunteerId"])
    .index("by_shiftId_and_volunteerId", ["shiftId", "volunteerId"])
    .index("by_shiftId_and_status", ["shiftId", "status"])
    .index("by_volunteerId_and_status", ["volunteerId", "status"]),

  hourLogs: defineTable({
    volunteerId: v.id("users"),
    shiftId: v.id("shifts"),
    opportunityId: v.id("opportunities"),
    hoursWorked: v.number(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("Pending"),
      v.literal("Approved"),
      v.literal("Rejected")
    ),
    approvedById: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    rejectedReason: v.optional(v.string()),
    submittedAt: v.number(),
  })
    .index("by_volunteerId", ["volunteerId"])
    .index("by_shiftId", ["shiftId"])
    .index("by_opportunityId", ["opportunityId"])
    .index("by_status", ["status"])
    .index("by_opportunityId_and_status", ["opportunityId", "status"])
    .index("by_volunteerId_and_status", ["volunteerId", "status"]),

  teams: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    coordinatorId: v.id("users"),
    isActive: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_coordinatorId", ["coordinatorId"])
    .index("by_isActive", ["isActive"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    volunteerId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_teamId", ["teamId"])
    .index("by_volunteerId", ["volunteerId"])
    .index("by_teamId_and_volunteerId", ["teamId", "volunteerId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("ShiftReminder"),
      v.literal("SignUpConfirmed"),
      v.literal("HoursApproved"),
      v.literal("HoursRejected"),
      v.literal("NewOpportunity"),
      v.literal("ShiftCancelled"),
      v.literal("SystemAlert")
    ),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    isRead: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_isRead", ["userId", "isRead"]),

  auditLogs: defineTable({
    userId: v.id("users"),
    action: v.union(
      v.literal("Create"),
      v.literal("Update"),
      v.literal("Delete"),
      v.literal("StatusChange"),
      v.literal("SignUp"),
      v.literal("HourLog"),
      v.literal("Login")
    ),
    entityType: v.string(),
    entityId: v.string(),
    details: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_entityType_and_entityId", ["entityType", "entityId"]),
});
