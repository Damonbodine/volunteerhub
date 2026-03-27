"use client";
export const dynamic = 'force-dynamic';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { RoleGuard } from "@/components/role-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../../../../convex/_generated/dataModel";

function ReviewHoursContent() {
  const user = useQuery(api.users.getCurrentUser);
  const pendingLogs = useQuery(api.hourLogs.listPending);
  const approveHours = useMutation(api.hourLogs.approve);
  const rejectHours = useMutation(api.hourLogs.reject);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<Id<"hourLogs"> | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async (id: Id<"hourLogs">) => {
    await approveHours({ id });
  };

  const openRejectDialog = (id: Id<"hourLogs">) => {
    setSelectedLogId(id);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedLogId) return;
    await rejectHours({ id: selectedLogId, reason: rejectionReason });
    setRejectDialogOpen(false);
    setSelectedLogId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Review Hours</h1>
        <p className="text-muted-foreground mt-1">Approve or reject volunteer hour submissions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Hour Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingLogs === undefined ? (
            <Skeleton className="h-48 w-full" />
          ) : pendingLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending hour logs. You&apos;re all caught up!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Volunteer</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="font-medium">{log.volunteerName ?? "Unknown"}</TableCell>
                    <TableCell>{log.opportunityTitle ?? "Unknown"}</TableCell>
                    <TableCell>{log.hoursWorked}h</TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">
                      {log.description ?? "—"}
                    </TableCell>
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
                          onClick={() => openRejectDialog(log._id)}
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

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Hour Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="reason">Rejection Reason (optional)</Label>
            <Input
              id="reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why these hours are being rejected..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button
              className="border-red-200 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReject}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ReviewHoursPage() {
  return (
    <RoleGuard allowedRoles={["Admin", "Coordinator"]}>
      <ReviewHoursContent />
    </RoleGuard>
  );
}
