"use client";
export const dynamic = 'force-dynamic';
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StatCard } from "@/components/stat-card";
import { RoleGuard } from "@/components/role-guard";
import { Clock, Users, Search, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EngagementRiskDetector } from "@/components/engagement-risk-detector";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { DemoModeStartButton } from "@/components/demo-mode";

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
    <div className="space-y-8" data-demo="dashboard-overview">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of volunteer activity across the platform.</p>
        </div>
        <div className="flex gap-2">
          <DemoModeStartButton />
          <Link href="/admin/impact-report" className={cn(buttonVariants({ variant: "outline" }))}>
            <FileText className="h-4 w-4 mr-2" />
            Impact Report
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" data-demo="dashboard-stats">
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

      <div data-demo="engagement-risk">
        <EngagementRiskDetector />
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
