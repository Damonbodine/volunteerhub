"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoleGuard } from "@/components/role-guard";
import { Id } from "../../../../../convex/_generated/dataModel";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

function NewOpportunityForm() {
  const router = useRouter();
  const createOpportunity = useMutation(api.opportunities.create);
  const coordinators = useQuery(api.users.listCoordinators);

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
    coordinatorId: "",
    isRecurring: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createOpportunity({
        title: form.title,
        description: form.description,
        category: form.category,
        location: form.location,
        address: form.address || undefined,
        startDate: new Date(form.startDate).getTime(),
        endDate: form.endDate ? new Date(form.endDate).getTime() : undefined,
        spotsTotal: parseInt(form.spotsTotal, 10),
        skillsNeeded: form.skillsNeeded ? form.skillsNeeded.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        coordinatorId: form.coordinatorId as Id<"users">,
        isRecurring: form.isRecurring,
      });
      router.push("/opportunities");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create opportunity");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/opportunities" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-foreground">New Opportunity</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Opportunity Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Opportunity title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the volunteer opportunity..."
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Input
                  id="spotsTotal"
                  type="number"
                  min="1"
                  value={form.spotsTotal}
                  onChange={(e) => setForm({ ...form, spotsTotal: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="City, State"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Full Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="123 Main St, City, State 12345"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Coordinator *</Label>
              <Select
                value={form.coordinatorId}
                onValueChange={(v) => setForm({ ...form, coordinatorId: v ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select coordinator..." />
                </SelectTrigger>
                <SelectContent>
                  {coordinators?.map((c: { _id: string; name: string }) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillsNeeded">Skills Needed</Label>
              <Input
                id="skillsNeeded"
                value={form.skillsNeeded}
                onChange={(e) => setForm({ ...form, skillsNeeded: e.target.value })}
                placeholder="Comma-separated: First Aid, Teaching, Driving"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90">
                {submitting ? "Creating..." : "Create Opportunity"}
              </Button>
              <Link href="/opportunities" className={cn(buttonVariants({ variant: "outline" }))}>Cancel</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewOpportunityPage() {
  return (
    <RoleGuard allowedRoles={["Admin", "Coordinator"]}>
      <NewOpportunityForm />
    </RoleGuard>
  );
}
