import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

async function askAI(prompt: string, systemPrompt?: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const messages: { role: string; content: string }[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export const recommendShifts = action({
  args: { volunteerId: v.id("users") },
  handler: async (ctx, args) => {
    const volunteer = await ctx.runQuery(api.users.getById, { id: args.volunteerId });
    if (!volunteer) throw new Error("Volunteer not found");

    const pastSignUps = await ctx.runQuery(api.signUps.listByVolunteer, { volunteerId: args.volunteerId });

    const activeOpportunities = await ctx.runQuery(api.opportunities.listActive, {});

    if (activeOpportunities.length === 0) {
      return { recommendations: [], message: "No active opportunities available right now." };
    }

    const opportunitiesWithShifts = [];
    for (const opp of activeOpportunities) {
      const shifts = await ctx.runQuery(api.shifts.listByOpportunity, { opportunityId: opp._id });
      const openShifts = shifts.filter((s) => s.status === "Open" && s.date > Date.now());
      if (openShifts.length > 0) {
        opportunitiesWithShifts.push({ ...opp, openShifts });
      }
    }

    const prompt = `You are a volunteer shift recommender. Given a volunteer's profile and available opportunities, rank the top opportunities by fit.

VOLUNTEER PROFILE:
- Name: ${volunteer.name}
- Skills: ${(volunteer.skills ?? []).join(", ") || "None listed"}
- Availability: ${volunteer.availabilityNotes ?? "Not specified"}
- Past sign-ups: ${pastSignUps.length} shifts

AVAILABLE OPPORTUNITIES:
${opportunitiesWithShifts.map((o, i) => `${i + 1}. "${o.title}" - ${o.category} at ${o.location}
   Skills needed: ${(o.skillsNeeded ?? []).join(", ") || "None specified"}
   Description: ${o.description}
   Open shifts: ${o.openShifts.length} available`).join("\n")}

Return a JSON array of objects with these fields: { "index": <1-based>, "title": "<opportunity title>", "reason": "<1-2 sentence explanation of fit>" }
Only return the JSON array, no other text.`;

    const result = await askAI(prompt);

    try {
      const cleaned = result.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const recommendations = JSON.parse(cleaned);
      return { recommendations, message: null };
    } catch {
      return { recommendations: [], message: result };
    }
  },
});

export const generateImpactReport = action({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const stats = await ctx.runQuery(api.dashboard.adminStats, {});
    const opportunities = await ctx.runQuery(api.opportunities.list, {});

    const prompt = `You are writing an impact report for a volunteer management platform called VolunteerHub.

DATA SUMMARY:
- Date range: ${new Date(args.startDate).toLocaleDateString()} to ${new Date(args.endDate).toLocaleDateString()}
- Total approved volunteer hours: ${stats.totalApprovedHours}
- Active volunteers: ${stats.activeUsersCount}
- Active opportunities: ${stats.activeOpportunitiesCount}
- Upcoming shifts: ${stats.upcomingShiftsCount}
- Pending hour logs awaiting review: ${stats.pendingHourLogsCount}
- This month's approved hours: ${stats.thisMonthApprovedHours}

PROGRAMS/OPPORTUNITIES:
${opportunities.slice(0, 10).map((o) => `- "${o.title}" (${o.category}, ${o.status}) at ${o.location} — ${o.spotsFilled}/${o.spotsTotal} spots filled`).join("\n")}

Write a compelling 3-5 paragraph narrative impact report suitable for an annual report or donor communication. Include specific numbers. Use an inspiring but professional tone. Do not use markdown headers — write flowing paragraphs.`;

    const report = await askAI(prompt, "You are a professional nonprofit communications writer.");
    return { report };
  },
});

export const generateThankYou = action({
  args: {
    volunteerId: v.id("users"),
    shiftId: v.id("shifts"),
  },
  handler: async (ctx, args) => {
    const volunteer = await ctx.runQuery(api.users.getById, { id: args.volunteerId });
    if (!volunteer) throw new Error("Volunteer not found");

    const shift = await ctx.runQuery(api.shifts.getById, { id: args.shiftId });
    if (!shift) throw new Error("Shift not found");

    const opportunity = await ctx.runQuery(api.opportunities.getById, { id: shift.opportunityId });

    const prompt = `Generate a personalized thank-you message for a volunteer who just completed a shift.

VOLUNTEER: ${volunteer.name}
SKILLS: ${(volunteer.skills ?? []).join(", ") || "Not specified"}
OPPORTUNITY: ${opportunity?.title ?? "Volunteer shift"}
DESCRIPTION: ${opportunity?.description ?? "N/A"}
LOCATION: ${opportunity?.location ?? "N/A"}
SHIFT DATE: ${new Date(shift.date).toLocaleDateString()}
SHIFT TIME: ${shift.startTime} – ${shift.endTime}

Write a warm, personalized 2-3 sentence thank-you that references what they did and their impact. Keep it sincere and specific.`;

    const message = await askAI(prompt, "You are a grateful volunteer coordinator writing personalized thank-you notes.");
    return { message };
  },
});

export const detectEngagementRisk = action({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.runQuery(api.users.list, {});
    const volunteers = users.filter((u) => u.role === "Volunteer" && u.isActive);

    const volunteerData = [];
    for (const vol of volunteers.slice(0, 20)) {
      const signUps = await ctx.runQuery(api.signUps.listByVolunteer, { volunteerId: vol._id });
      volunteerData.push({
        name: vol.name,
        id: vol._id,
        lastLogin: vol.lastLoginAt,
        totalSignUps: signUps.length,
        completedSignUps: signUps.filter((s) => s.status === "Completed").length,
        cancelledSignUps: signUps.filter((s) => s.status === "Cancelled").length,
        recentSignUps: signUps.filter((s) => s.signedUpAt > Date.now() - 30 * 86_400_000).length,
      });
    }

    const prompt = `Analyze these volunteer activity patterns and identify those at risk of disengagement.

VOLUNTEER DATA:
${volunteerData.map((v) => `- ${v.name}: ${v.totalSignUps} total sign-ups, ${v.completedSignUps} completed, ${v.cancelledSignUps} cancelled, ${v.recentSignUps} in last 30 days, last login: ${v.lastLogin ? new Date(v.lastLogin).toLocaleDateString() : "Never"}`).join("\n")}

For each at-risk volunteer, return a JSON array of objects: { "name": "<name>", "id": "<id>", "riskLevel": "high" | "medium" | "low", "reason": "<1-2 sentence reason>", "suggestedAction": "<specific action to re-engage>" }
Only include volunteers who show signs of disengagement risk. Return only the JSON array.`;

    const result = await askAI(prompt, "You are a volunteer engagement analyst. Be specific and actionable.");

    try {
      const cleaned = result.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const atRiskVolunteers = JSON.parse(cleaned);
      return { atRiskVolunteers, message: null };
    } catch {
      return { atRiskVolunteers: [], message: result };
    }
  },
});
