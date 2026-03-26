import { query } from "./_generated/server";

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

export const adminStats = query({
  args: {},
  handler: async (ctx) => {
    const caller = await getCallerOrThrow(ctx);
    if (caller.role !== "Admin") throw new Error("Unauthorized");

    // Active users count
    const activeUsers = await ctx.db
      .query("users")
      .withIndex("by_isActive", (q: any) => q.eq("isActive", true))
      .take(1000);

    // Active opportunities count
    const activeOpportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_status", (q: any) => q.eq("status", "Active"))
      .take(1000);

    // Upcoming shifts (date in the future)
    const now = Date.now();
    const allOpenShifts = await ctx.db
      .query("shifts")
      .withIndex("by_status", (q: any) => q.eq("status", "Open"))
      .take(1000);
    const upcomingShifts = allOpenShifts.filter((s: any) => s.date > now);

    // Total approved hours
    const approvedLogs = await ctx.db
      .query("hourLogs")
      .withIndex("by_status", (q: any) => q.eq("status", "Approved"))
      .take(5000);
    const totalApprovedHours = approvedLogs.reduce((sum: number, log: any) => sum + log.hoursWorked, 0);

    // This month approved hours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const thisMonthHours = approvedLogs
      .filter((log: any) => log.approvedAt && log.approvedAt >= startOfMonth.getTime())
      .reduce((sum: number, log: any) => sum + log.hoursWorked, 0);

    // Pending hour logs
    const pendingLogs = await ctx.db
      .query("hourLogs")
      .withIndex("by_status", (q: any) => q.eq("status", "Pending"))
      .take(1000);

    return {
      activeUsersCount: activeUsers.length,
      activeOpportunitiesCount: activeOpportunities.length,
      upcomingShiftsCount: upcomingShifts.length,
      totalApprovedHours,
      thisMonthApprovedHours: thisMonthHours,
      pendingHourLogsCount: pendingLogs.length,
    };
  },
});

export const coordinatorStats = query({
  args: {},
  handler: async (ctx) => {
    const caller = await getCallerOrThrow(ctx);
    if (caller.role !== "Coordinator" && caller.role !== "Admin") {
      throw new Error("Unauthorized");
    }

    // Coordinator's opportunities
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_coordinatorId", (q: any) => q.eq("coordinatorId", caller._id))
      .take(100);

    const opportunityIds = opportunities.map((o: any) => o._id);

    // Pending hour logs across those opportunities
    let pendingHourLogs: any[] = [];
    for (const oppId of opportunityIds) {
      const logs = await ctx.db
        .query("hourLogs")
        .withIndex("by_opportunityId_and_status", (q: any) =>
          q.eq("opportunityId", oppId).eq("status", "Pending")
        )
        .take(100);
      pendingHourLogs = pendingHourLogs.concat(logs);
    }

    // Upcoming shifts across those opportunities
    const now = Date.now();
    let upcomingShifts: any[] = [];
    for (const oppId of opportunityIds) {
      const shifts = await ctx.db
        .query("shifts")
        .withIndex("by_opportunityId_and_status", (q: any) =>
          q.eq("opportunityId", oppId).eq("status", "Open")
        )
        .take(50);
      upcomingShifts = upcomingShifts.concat(shifts.filter((s: any) => s.date > now));
    }

    // Team member count for coordinator's teams
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_coordinatorId", (q: any) => q.eq("coordinatorId", caller._id))
      .take(50);

    let teamMemberCount = 0;
    for (const team of teams) {
      const members = await ctx.db
        .query("teamMembers")
        .withIndex("by_teamId", (q: any) => q.eq("teamId", team._id))
        .take(500);
      teamMemberCount += members.length;
    }

    return {
      opportunitiesCount: opportunities.length,
      opportunities,
      pendingHourLogsCount: pendingHourLogs.length,
      upcomingShiftsCount: upcomingShifts.length,
      teamCount: teams.length,
      teamMemberCount,
    };
  },
});
