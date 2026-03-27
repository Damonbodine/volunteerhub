"use client";
export const dynamic = 'force-dynamic';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Users, Edit, Plus, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const opportunityId = id as Id<"opportunities">;

  const user = useQuery(api.users.getCurrentUser);
  const opportunity = useQuery(api.opportunities.getById, { id: opportunityId });
  const shifts = useQuery(api.shifts.listByOpportunity, { opportunityId });
  const signUp = useMutation(api.signUps.create);
  const cancelOpportunity = useMutation(api.opportunities.cancel);

  const handleSignUp = async (shiftId: Id<"shifts">) => {
    await signUp({ shiftId });
  };

  const handleCancel = async () => {
    if (confirm("Are you sure you want to cancel this opportunity?")) {
      await cancelOpportunity({ id: opportunityId });
    }
  };

  if (opportunity === undefined) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  if (opportunity === null) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Opportunity not found.</p>
      </div>
    );
  }

  const isAdminOrCoordinator = user?.role === "Admin" || user?.role === "Coordinator";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{opportunity.title}</h1>
            <StatusBadge status={opportunity.status} />
          </div>
          <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-2.5 py-0.5 text-xs font-medium mt-2">
            {opportunity.category}
          </span>
        </div>
        {isAdminOrCoordinator && (
          <div className="flex gap-2">
            <Link href={`/opportunities/${id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <Link href={`/opportunities/${id}/shifts/new`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              <Plus className="h-4 w-4 mr-2" />
              Add Shift
            </Link>
            {opportunity.status !== "Cancelled" && (
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <p className="text-muted-foreground leading-relaxed">{opportunity.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">{opportunity.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium">Start Date</p>
                <p className="text-muted-foreground">{new Date(opportunity.startDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium">Spots</p>
                <p className="text-muted-foreground">{opportunity.spotsFilled}/{opportunity.spotsTotal} filled</p>
              </div>
            </div>
          </div>
          {opportunity.skillsNeeded && opportunity.skillsNeeded.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Skills Needed</p>
              <div className="flex flex-wrap gap-2">
                {opportunity.skillsNeeded.map((skill) => (
                  <span key={skill} className="inline-flex items-center rounded-full bg-teal-100 text-teal-700 px-2.5 py-0.5 text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          {shifts === undefined ? (
            <Skeleton className="h-32 w-full" />
          ) : shifts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No shifts scheduled yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Spots</TableHead>
                  <TableHead>Status</TableHead>
                  {user?.role === "Volunteer" && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift._id}>
                    <TableCell>{new Date(shift.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {shift.startTime} – {shift.endTime}
                      </span>
                    </TableCell>
                    <TableCell>{shift.spotsFilled}/{shift.spotsAvailable}</TableCell>
                    <TableCell>
                      <StatusBadge status={shift.status} />
                    </TableCell>
                    {user?.role === "Volunteer" && (
                      <TableCell className="text-right">
                        {shift.status === "Open" && shift.spotsFilled < shift.spotsAvailable && (
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => handleSignUp(shift._id)}
                          >
                            Sign Up
                          </Button>
                        )}
                      </TableCell>
                    )}
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
