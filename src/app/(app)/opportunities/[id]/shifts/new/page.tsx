"use client";
export const dynamic = 'force-dynamic';
import { useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RoleGuard } from "@/components/role-guard";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

function NewShiftForm({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const createShift = useMutation(api.shifts.create);

  const [form, setForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    spotsAvailable: "10",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createShift({
        opportunityId: opportunityId as Id<"opportunities">,
        date: new Date(form.date).getTime(),
        startTime: form.startTime,
        endTime: form.endTime,
        spotsAvailable: parseInt(form.spotsAvailable, 10),
        notes: form.notes || undefined,
      });
      router.push(`/opportunities/${opportunityId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create shift");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href={`/opportunities/${opportunityId}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-foreground">New Shift</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shift Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input id="startTime" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input id="endTime" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spotsAvailable">Spots Available *</Label>
              <Input id="spotsAvailable" type="number" min="1" value={form.spotsAvailable} onChange={(e) => setForm({ ...form, spotsAvailable: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special instructions..." rows={3} />
            </div>

            {error && <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90">
                {submitting ? "Creating..." : "Create Shift"}
              </Button>
              <Link href={`/opportunities/${opportunityId}`} className={cn(buttonVariants({ variant: "outline" }))}>Cancel</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewShiftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RoleGuard allowedRoles={["Admin", "Coordinator"]}>
      <NewShiftForm opportunityId={id} />
    </RoleGuard>
  );
}
