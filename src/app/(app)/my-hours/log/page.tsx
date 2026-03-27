"use client";
export const dynamic = 'force-dynamic';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

function LogHoursForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledShiftId = searchParams.get("shiftId");

  const completedShifts = useQuery(api.signUps.listCompletedForVolunteer);
  const logHours = useMutation(api.hourLogs.create);

  const [form, setForm] = useState({
    shiftId: prefilledShiftId ?? "",
    hoursWorked: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shiftId) {
      setError("Please select a shift.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await logHours({
        shiftId: form.shiftId as Id<"shifts">,
        hoursWorked: parseFloat(form.hoursWorked),
        description: form.description || undefined,
      });
      router.push("/my-hours");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log hours");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/my-hours" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Log Hours</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hour Log Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Completed Shift *</Label>
              <Select value={form.shiftId} onValueChange={(v) => setForm({ ...form, shiftId: v ?? "" })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a completed shift..." />
                </SelectTrigger>
                <SelectContent>
                  {completedShifts?.map((shift: { shiftId: string; opportunityTitle: string | null; shiftDate: number | null }) => (
                    <SelectItem key={shift.shiftId} value={shift.shiftId}>
                      {shift.opportunityTitle} — {shift.shiftDate ? new Date(shift.shiftDate).toLocaleDateString() : "Unknown date"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoursWorked">Hours Worked *</Label>
              <Input
                id="hoursWorked"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={form.hoursWorked}
                onChange={(e) => setForm({ ...form, hoursWorked: e.target.value })}
                placeholder="e.g. 3.5"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What did you do during this shift?"
                rows={4}
              />
            </div>

            {error && <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90">
                {submitting ? "Submitting..." : "Submit Hours"}
              </Button>
              <Link href="/my-hours" className={cn(buttonVariants({ variant: "outline" }))}>Cancel</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LogHoursPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-muted rounded-xl" />}>
      <LogHoursForm />
    </Suspense>
  );
}
