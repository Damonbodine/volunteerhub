"use client";
export const dynamic = 'force-dynamic';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { ThankYouGenerator } from "@/components/thank-you-generator";

export default function MyShiftsPage() {
  const signUps = useQuery(api.signUps.mySignUps);
  const cancelSignUp = useMutation(api.signUps.cancel);

  const handleCancel = async (signUpId: Id<"signUps">) => {
    if (confirm("Cancel your sign-up for this shift?")) {
      await cancelSignUp({ id: signUpId });
    }
  };

  const now = Date.now();
  const upcoming = signUps?.filter((s) => s.shiftDate && s.shiftDate >= now && s.status !== "Cancelled") ?? [];
  const past = signUps?.filter((s) => s.shiftDate && s.shiftDate < now) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Shifts</h1>
        <p className="text-muted-foreground mt-1">View and manage your volunteer shift sign-ups.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Upcoming</h2>
        {signUps === undefined ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : upcoming.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground">
              <p>No upcoming shifts.</p>
              <Link href="/opportunities" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}>Browse Opportunities</Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => (
              <Card key={s._id} className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/opportunities/${s.opportunityId}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                          {s.opportunityTitle ?? "Opportunity"}
                        </Link>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {s.shiftDate ? new Date(s.shiftDate).toLocaleDateString() : "TBD"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {s.startTime} – {s.endTime}
                        </span>
                        {s.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {s.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {s.status === "Confirmed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => handleCancel(s._id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Past Shifts</h2>
          <div className="space-y-3">
            {past.map((s) => (
              <Card key={s._id} className="border-border opacity-80">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{s.opportunityTitle ?? "Opportunity"}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {s.shiftDate ? new Date(s.shiftDate).toLocaleDateString() : "TBD"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {s.startTime} – {s.endTime}
                        </span>
                      </div>
                    </div>
                    {s.status === "Completed" && (
                      <div className="flex items-center gap-2">
                        <ThankYouGenerator shiftId={s.shiftId} />
                        <Link href={`/my-hours/log?shiftId=${s.shiftId}`} className={cn(buttonVariants({ size: "sm" }), "bg-secondary hover:bg-secondary/90")}>Log Hours</Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
