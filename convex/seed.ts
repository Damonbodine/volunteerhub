import { internalMutation } from "./_generated/server";

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Idempotency check: if any users exist with our seed clerkIds, skip
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", "seed|admin_clerk_id"))
      .unique();
    if (existingAdmin) {
      console.log("Seed data already exists, skipping.");
      return;
    }

    const now = Date.now();
    const DAY = 86_400_000;

    // ── Users ────────────────────────────────────────────────────────────────

    const adminId = await ctx.db.insert("users", {
      clerkId: "seed|admin_clerk_id",
      name: "Alex Admin",
      email: "admin@volunteerhub.dev",
      role: "Admin",
      isActive: true,
      bio: "Platform administrator for VolunteerHub.",
      skills: ["Management", "Coordination"],
      updatedAt: now,
    });

    const coord1Id = await ctx.db.insert("users", {
      clerkId: "seed|coordinator_1",
      name: "Casey Coordinator",
      email: "casey@volunteerhub.dev",
      role: "Coordinator",
      isActive: true,
      bio: "Manages environmental clean-up programs.",
      skills: ["Leadership", "Outdoor Activities"],
      updatedAt: now,
    });

    const coord2Id = await ctx.db.insert("users", {
      clerkId: "seed|coordinator_2",
      name: "Morgan Coordinator",
      email: "morgan@volunteerhub.dev",
      role: "Coordinator",
      isActive: true,
      bio: "Coordinates food bank and shelter programs.",
      skills: ["Community Outreach", "Logistics"],
      updatedAt: now,
    });

    const vol1Id = await ctx.db.insert("users", {
      clerkId: "seed|volunteer_1",
      name: "Jamie Volunteer",
      email: "jamie@example.com",
      role: "Volunteer",
      isActive: true,
      skills: ["Gardening", "Physical Labor"],
      availabilityNotes: "Weekends only",
      updatedAt: now,
    });

    const vol2Id = await ctx.db.insert("users", {
      clerkId: "seed|volunteer_2",
      name: "Riley Volunteer",
      email: "riley@example.com",
      role: "Volunteer",
      isActive: true,
      skills: ["Cooking", "Customer Service"],
      updatedAt: now,
    });

    const vol3Id = await ctx.db.insert("users", {
      clerkId: "seed|volunteer_3",
      name: "Taylor Volunteer",
      email: "taylor@example.com",
      role: "Volunteer",
      isActive: true,
      skills: ["Teaching", "Administration"],
      updatedAt: now,
    });

    const vol4Id = await ctx.db.insert("users", {
      clerkId: "seed|volunteer_4",
      name: "Jordan Volunteer",
      email: "jordan@example.com",
      role: "Volunteer",
      isActive: true,
      skills: ["Driving", "Logistics"],
      updatedAt: now,
    });

    const vol5Id = await ctx.db.insert("users", {
      clerkId: "seed|volunteer_5",
      name: "Sam Volunteer",
      email: "sam@example.com",
      role: "Volunteer",
      isActive: true,
      skills: ["Photography", "Social Media"],
      updatedAt: now,
    });

    // ── Opportunities ────────────────────────────────────────────────────────

    const opp1Id = await ctx.db.insert("opportunities", {
      title: "City Park Clean-Up",
      description: "Join us to clean up Riverside Park — pick up litter, pull weeds, and plant native flowers.",
      category: "Event",
      location: "Riverside Park",
      address: "100 Riverside Dr, Austin, TX 78701",
      startDate: now + 7 * DAY,
      endDate: now + 7 * DAY + 4 * 3_600_000,
      spotsTotal: 20,
      spotsFilled: 3,
      skillsNeeded: ["Gardening", "Physical Labor"],
      status: "Active",
      coordinatorId: coord1Id,
      isRecurring: false,
      updatedAt: now,
    });

    const opp2Id = await ctx.db.insert("opportunities", {
      title: "Weekly Food Bank",
      description: "Help sort and distribute food donations at the Austin Food Bank every Saturday morning.",
      category: "Ongoing",
      location: "Austin Food Bank",
      address: "6201 Berkman Dr, Austin, TX 78723",
      startDate: now + DAY,
      spotsTotal: 10,
      spotsFilled: 4,
      skillsNeeded: ["Cooking", "Physical Labor"],
      status: "Active",
      coordinatorId: coord2Id,
      isRecurring: true,
      updatedAt: now,
    });

    const opp3Id = await ctx.db.insert("opportunities", {
      title: "Back-to-School Supply Drive",
      description: "One-time event: help collect and pack school supplies for underprivileged students.",
      category: "OneTime",
      location: "Community Center",
      address: "500 E 6th St, Austin, TX 78701",
      startDate: now + 14 * DAY,
      endDate: now + 14 * DAY + 6 * 3_600_000,
      spotsTotal: 15,
      spotsFilled: 0,
      skillsNeeded: ["Administration", "Customer Service"],
      status: "Draft",
      coordinatorId: coord1Id,
      isRecurring: false,
      updatedAt: now,
    });

    const opp4Id = await ctx.db.insert("opportunities", {
      title: "Winter Shelter Support",
      description: "Seasonal support for the downtown homeless shelter during winter months.",
      category: "Seasonal",
      location: "Downtown Shelter",
      address: "200 W 2nd St, Austin, TX 78701",
      startDate: now - 30 * DAY,
      endDate: now + 60 * DAY,
      spotsTotal: 8,
      spotsFilled: 8,
      skillsNeeded: ["Cooking", "Community Outreach"],
      status: "Full",
      coordinatorId: coord2Id,
      isRecurring: false,
      updatedAt: now,
    });

    // ── Shifts ───────────────────────────────────────────────────────────────

    const shift1Id = await ctx.db.insert("shifts", {
      opportunityId: opp1Id,
      date: now + 7 * DAY,
      startTime: "08:00",
      endTime: "12:00",
      spotsAvailable: 10,
      spotsFilled: 2,
      notes: "Bring gloves and sunscreen.",
      status: "Open",
    });

    const shift2Id = await ctx.db.insert("shifts", {
      opportunityId: opp1Id,
      date: now + 7 * DAY,
      startTime: "13:00",
      endTime: "17:00",
      spotsAvailable: 10,
      spotsFilled: 1,
      status: "Open",
    });

    const shift3Id = await ctx.db.insert("shifts", {
      opportunityId: opp2Id,
      date: now + DAY,
      startTime: "07:00",
      endTime: "11:00",
      spotsAvailable: 5,
      spotsFilled: 2,
      notes: "Check in at the main entrance.",
      status: "Open",
    });

    const shift4Id = await ctx.db.insert("shifts", {
      opportunityId: opp2Id,
      date: now + 8 * DAY,
      startTime: "07:00",
      endTime: "11:00",
      spotsAvailable: 5,
      spotsFilled: 2,
      status: "Open",
    });

    const shift5Id = await ctx.db.insert("shifts", {
      opportunityId: opp4Id,
      date: now - 3 * DAY,
      startTime: "18:00",
      endTime: "22:00",
      spotsAvailable: 4,
      spotsFilled: 4,
      status: "Full",
    });

    const shift6Id = await ctx.db.insert("shifts", {
      opportunityId: opp4Id,
      date: now - 10 * DAY,
      startTime: "18:00",
      endTime: "22:00",
      spotsAvailable: 4,
      spotsFilled: 4,
      status: "Completed",
    });

    const shift7Id = await ctx.db.insert("shifts", {
      opportunityId: opp2Id,
      date: now + 15 * DAY,
      startTime: "07:00",
      endTime: "11:00",
      spotsAvailable: 5,
      spotsFilled: 0,
      status: "Open",
    });

    const shift8Id = await ctx.db.insert("shifts", {
      opportunityId: opp1Id,
      date: now + 21 * DAY,
      startTime: "09:00",
      endTime: "13:00",
      spotsAvailable: 8,
      spotsFilled: 0,
      status: "Open",
    });

    // ── SignUps ───────────────────────────────────────────────────────────────

    await ctx.db.insert("signUps", {
      shiftId: shift1Id,
      volunteerId: vol1Id,
      status: "Confirmed",
      signedUpAt: now - 2 * DAY,
    });

    await ctx.db.insert("signUps", {
      shiftId: shift1Id,
      volunteerId: vol2Id,
      status: "Confirmed",
      signedUpAt: now - DAY,
    });

    await ctx.db.insert("signUps", {
      shiftId: shift2Id,
      volunteerId: vol3Id,
      status: "Confirmed",
      signedUpAt: now - DAY,
    });

    await ctx.db.insert("signUps", {
      shiftId: shift3Id,
      volunteerId: vol1Id,
      status: "Confirmed",
      signedUpAt: now - 3 * DAY,
    });

    await ctx.db.insert("signUps", {
      shiftId: shift3Id,
      volunteerId: vol4Id,
      status: "Confirmed",
      signedUpAt: now - 2 * DAY,
    });

    await ctx.db.insert("signUps", {
      shiftId: shift5Id,
      volunteerId: vol2Id,
      status: "Confirmed",
      signedUpAt: now - 5 * DAY,
    });

    const su7 = await ctx.db.insert("signUps", {
      shiftId: shift6Id,
      volunteerId: vol3Id,
      status: "Completed",
      signedUpAt: now - 15 * DAY,
    });

    const su8 = await ctx.db.insert("signUps", {
      shiftId: shift6Id,
      volunteerId: vol4Id,
      status: "Completed",
      signedUpAt: now - 14 * DAY,
    });

    await ctx.db.insert("signUps", {
      shiftId: shift4Id,
      volunteerId: vol5Id,
      status: "Waitlisted",
      signedUpAt: now - DAY,
    });

    await ctx.db.insert("signUps", {
      shiftId: shift3Id,
      volunteerId: vol5Id,
      status: "Cancelled",
      signedUpAt: now - 4 * DAY,
      cancelledAt: now - 3 * DAY,
    });

    // ── HourLogs ─────────────────────────────────────────────────────────────

    await ctx.db.insert("hourLogs", {
      volunteerId: vol3Id,
      shiftId: shift6Id,
      opportunityId: opp4Id,
      hoursWorked: 4,
      description: "Served meals and cleaned up.",
      status: "Approved",
      approvedById: coord2Id,
      approvedAt: now - 7 * DAY,
      submittedAt: now - 9 * DAY,
    });

    await ctx.db.insert("hourLogs", {
      volunteerId: vol4Id,
      shiftId: shift6Id,
      opportunityId: opp4Id,
      hoursWorked: 4,
      description: "Helped with intake and guest services.",
      status: "Approved",
      approvedById: coord2Id,
      approvedAt: now - 7 * DAY,
      submittedAt: now - 9 * DAY,
    });

    await ctx.db.insert("hourLogs", {
      volunteerId: vol1Id,
      shiftId: shift3Id,
      opportunityId: opp2Id,
      hoursWorked: 4,
      description: "Sorted canned goods and stocked shelves.",
      status: "Pending",
      submittedAt: now - DAY,
    });

    await ctx.db.insert("hourLogs", {
      volunteerId: vol2Id,
      shiftId: shift3Id,
      opportunityId: opp2Id,
      hoursWorked: 4,
      description: "Assisted with food distribution.",
      status: "Rejected",
      rejectedReason: "Duplicate submission — please resubmit with correct shift.",
      submittedAt: now - 2 * DAY,
    });

    await ctx.db.insert("hourLogs", {
      volunteerId: vol4Id,
      shiftId: shift5Id,
      opportunityId: opp4Id,
      hoursWorked: 4,
      description: "Evening shelter support.",
      status: "Pending",
      submittedAt: now - DAY,
    });

    // ── Teams ────────────────────────────────────────────────────────────────

    const team1Id = await ctx.db.insert("teams", {
      name: "Green Squad",
      description: "Dedicated volunteers for environmental clean-up projects.",
      coordinatorId: coord1Id,
      isActive: true,
      updatedAt: now,
    });

    const team2Id = await ctx.db.insert("teams", {
      name: "Community Kitchen Crew",
      description: "Focused on food bank and meal service events.",
      coordinatorId: coord2Id,
      isActive: true,
      updatedAt: now,
    });

    // ── TeamMembers ───────────────────────────────────────────────────────────

    await ctx.db.insert("teamMembers", {
      teamId: team1Id,
      volunteerId: vol1Id,
      joinedAt: now - 30 * DAY,
    });

    await ctx.db.insert("teamMembers", {
      teamId: team1Id,
      volunteerId: vol5Id,
      joinedAt: now - 20 * DAY,
    });

    await ctx.db.insert("teamMembers", {
      teamId: team2Id,
      volunteerId: vol2Id,
      joinedAt: now - 45 * DAY,
    });

    await ctx.db.insert("teamMembers", {
      teamId: team2Id,
      volunteerId: vol3Id,
      joinedAt: now - 40 * DAY,
    });

    await ctx.db.insert("teamMembers", {
      teamId: team2Id,
      volunteerId: vol4Id,
      joinedAt: now - 35 * DAY,
    });

    // ── Notifications ─────────────────────────────────────────────────────────

    await ctx.db.insert("notifications", {
      userId: vol1Id,
      type: "SignUpConfirmed",
      title: "Sign-Up Confirmed",
      message: "You are confirmed for City Park Clean-Up on the morning shift.",
      link: `/opportunities/${opp1Id}`,
      isRead: false,
    });

    await ctx.db.insert("notifications", {
      userId: vol3Id,
      type: "HoursApproved",
      title: "Hours Approved",
      message: "Your 4 hours for Winter Shelter Support have been approved.",
      link: `/hour-logs`,
      isRead: true,
    });

    await ctx.db.insert("notifications", {
      userId: vol2Id,
      type: "HoursRejected",
      title: "Hours Rejected",
      message: "Your hour log was rejected. Reason: Duplicate submission — please resubmit with correct shift.",
      link: `/hour-logs`,
      isRead: false,
    });

    await ctx.db.insert("notifications", {
      userId: vol5Id,
      type: "NewOpportunity",
      title: "New Opportunity Available",
      message: "A new opportunity — City Park Clean-Up — is now accepting volunteers!",
      link: `/opportunities/${opp1Id}`,
      isRead: false,
    });

    await ctx.db.insert("notifications", {
      userId: vol4Id,
      type: "ShiftReminder",
      title: "Shift Reminder",
      message: "Reminder: You have a confirmed shift at the Weekly Food Bank tomorrow at 7:00 AM.",
      link: `/opportunities/${opp2Id}`,
      isRead: false,
    });

    console.log("Seed data inserted successfully.");
  },
});
