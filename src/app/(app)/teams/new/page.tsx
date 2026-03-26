"use client";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RoleGuard } from "@/components/role-guard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function NewTeamForm() {
  const router = useRouter();
  const createTeam = useMutation(api.teams.create);

  const [form, setForm] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createTeam({ name: form.name, description: form.description || undefined });
      router.push("/teams");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Link href="/teams" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-foreground">New Team</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Weekend Warriors" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this team focus on?" rows={3} />
            </div>
            {error && <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90">
                {submitting ? "Creating..." : "Create Team"}
              </Button>
              <Link href="/teams" className={cn(buttonVariants({ variant: "outline" }))}>Cancel</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewTeamPage() {
  return (
    <RoleGuard allowedRoles={["Admin", "Coordinator"]}>
      <NewTeamForm />
    </RoleGuard>
  );
}
