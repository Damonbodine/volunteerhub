"use client";
export const dynamic = 'force-dynamic';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StatCard } from "@/components/stat-card";
import { RoleGuard } from "@/components/role-guard";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ClipboardCheck, Users, Search } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";

function CoordinatorDashboardContent() {
  const stats = useQuery(api.dashboard.coordinatorStats);
  const pendingHours = useQuery(api.hourLogs.listPending);
  const approveHours = useMutation(api.hourLogs.approve);
  const rejectHours = useMutation(api.hourLogs.reject);

  const handleApprove = async (id: Id<"hourLogs">) => {
    await approveHours({ id });
  };

  const handleReject = async (id: Id<"hourLogs">) => {
    const reason = prompt("Rejection reason (optional):");
    await rejectHours({ id, reason: reason ?? "" });
  };

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
        <h1 className="text-2xl font-bold text-foreground">Coordinator Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your opportunities and volunteer hours.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned Opportunities"
          value={stats.opportunitiesCount ?? 0}
          icon={Search}
          tintColor="coral"
        />
        <StatCard
          label="Pending Approvals"
          value={stats.pendingHourLogsCount ?? 0}
          icon={ClipboardCheck}
          tintColor="teal"
        />
        <StatCard
          label="Upcoming Shifts"
          value={stats.upcomingShiftsCount ?? 0}
          icon={Calendar}
          tintColor="coral"
        />
        <StatCard
          label="Team Members"
          value={stats.teamCount ?? 0}
          icon={Users}
          tintColor="teal"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Hour Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingHours === undefined ? (
            <Skeleton className="h-48 w-full" />
          ) : pendingHours.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending hour logs.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingHours.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="font-medium">{log.volunteerName ?? "Unknown"}</TableCell>
                    <TableCell>{log.opportunityTitle ?? "Unknown"}</TableCell>
                    <TableCell>{log.hoursWorked}h</TableCell>
                    <TableCell>{new Date(log.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={log.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleApprove(log._id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleReject(log._id)}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CoordinatorDashboardPage() {
  return (
    <RoleGuard allowedRoles={["Admin", "Coordinator"]}>
      <CoordinatorDashboardContent />
    </RoleGuard>
  );
}
