"use client";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StatCard } from "@/components/stat-card";
import { RoleGuard } from "@/components/role-guard";
import { Clock, Users, Search, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardContent() {
  const stats = useQuery(api.dashboard.adminStats);

  if (stats === undefined) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of volunteer activity across the platform.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Approved Hours"
          value={stats.totalApprovedHours ?? 0}
          icon={Clock}
          tintColor="coral"
        />
        <StatCard
          label="Active Volunteers"
          value={stats.activeUsersCount ?? 0}
          icon={Users}
          tintColor="teal"
        />
        <StatCard
          label="Active Opportunities"
          value={stats.activeOpportunitiesCount ?? 0}
          icon={Search}
          tintColor="coral"
        />
        <StatCard
          label="Upcoming Shifts"
          value={stats.upcomingShiftsCount ?? 0}
          icon={Calendar}
          tintColor="teal"
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <DashboardContent />
    </RoleGuard>
  );
}
