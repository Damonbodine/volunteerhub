"use client";
export const dynamic = 'force-dynamic';
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function MyHoursPage() {
  const hourLogs = useQuery(api.hourLogs.myHourLogs);

  const totalApproved = hourLogs
    ?.filter((l: { status: string }) => l.status === "Approved")
    .reduce((sum: number, l: { hoursWorked: number }) => sum + l.hoursWorked, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Hours</h1>
          <p className="text-muted-foreground mt-1">Track your volunteer hour submissions.</p>
        </div>
        <Link href="/my-hours/log" className={cn(buttonVariants({ variant: "default" }), "bg-primary hover:bg-primary/90")}>
          <Plus className="h-4 w-4 mr-2" />
          Log Hours
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Approved Hours"
          value={totalApproved}
          icon={Clock}
          tintColor="coral"
        />
        <StatCard
          label="Pending"
          value={hourLogs?.filter((l) => l.status === "Pending").length ?? 0}
          tintColor="default"
        />
        <StatCard
          label="Submissions"
          value={hourLogs?.length ?? 0}
          tintColor="teal"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hour Log History</CardTitle>
        </CardHeader>
        <CardContent>
          {hourLogs === undefined ? (
            <Skeleton className="h-48 w-full" />
          ) : hourLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hour logs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hourLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="font-medium">{log.opportunityTitle ?? "Unknown"}</TableCell>
                    <TableCell>{new Date(log.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{log.hoursWorked}h</TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">
                      {log.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={log.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.rejectedReason ?? "—"}
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
