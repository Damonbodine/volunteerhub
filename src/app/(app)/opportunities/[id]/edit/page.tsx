"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleGuard } from "@/components/role-guard";
import { Id } from "../../../../../../convex/_generated/dataModel";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

function EditOpportunityForm({ id }: { id: string }) {
  const router = useRouter();
  const opportunityId = id as Id<"opportunities">;
  const opportunity = useQuery(api.opportunities.getById, { id: opportunityId });
  const updateOpportunity = useMutation(api.opportunities.update);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Event" as "Event" | "Ongoing" | "OneTime" | "Seasonal",
    location: "",
    address: "",
    startDate: "",
    endDate: "",
    spotsTotal: "10",
    skillsNeeded: "",
    isRecurring: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (opportunity && !initialized) {
      setForm({
        title: opportunity.title,
        description: opportunity.description,
        category: opportunity.category,
        location: opportunity.location,
        address: opportunity.address ?? "",
        startDate: new Date(opportunity.startDate).toISOString().split("T")[0],
        endDate: opportunity.endDate ? new Date(opportunity.endDate).toISOString().split("T")[0] : "",
        spotsTotal: String(opportunity.spotsTotal),
        skillsNeeded: opportunity.skillsNeeded?.join(", ") ?? "",
        isRecurring: opportunity.isRecurring,
      });
      setInitialized(true);
    }
  }, [opportunity, initialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateOpportunity({
        id: opportunityId,
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location,
        address: form.address || undefined,
        startDate: new Date(form.startDate).getTime(),
        endDate: form.endDate ? new Date(form.endDate).getTime() : undefined,
        spotsTotal: parseInt(form.spotsTotal, 10),
        skillsNeeded: form.skillsNeeded ? form.skillsNeeded.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        isRecurring: form.isRecurring,
      });
      router.push(`/opportunities/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update opportunity");
    } finally {
      setSubmitting(false);
    }
  };

  if (opportunity === undefined) return <Skeleton className="h-96 rounded-xl" />;
  if (opportunity === null) return <p className="text-muted-foreground">Opportunity not found.</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/opportunities/${id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Edit Opportunity</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opportunity Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="OneTime">One Time</SelectItem>
                    <SelectItem value="Seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="spotsTotal">Total Spots *</Label>
                <Input id="spotsTotal" type="number" min="1" value={form.spotsTotal} onChange={(e) => setForm({ ...form, spotsTotal: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input id="startDate" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillsNeeded">Skills Needed</Label>
              <Input id="skillsNeeded" value={form.skillsNeeded} onChange={(e) => setForm({ ...form, skillsNeeded: e.target.value })} placeholder="Comma-separated" />
            </div>

            {error && <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90">
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
              <Link href={`/opportunities/${id}`} className={cn(buttonVariants({ variant: "outline" }))}>Cancel</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RoleGuard allowedRoles={["Admin", "Coordinator"]}>
      <EditOpportunityForm id={id} />
    </RoleGuard>
  );
}
