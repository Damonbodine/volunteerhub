"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { Check } from "lucide-react";

export default function ProfileSettingsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const updateUser = useMutation(api.users.update);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    bio: "",
    skills: "",
    availabilityNotes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (user && !initialized) {
      setForm({
        name: user.name,
        phone: user.phone ?? "",
        bio: user.bio ?? "",
        skills: user.skills?.join(", ") ?? "",
        availabilityNotes: user.availabilityNotes ?? "",
      });
      setInitialized(true);
    }
  }, [user, initialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (!user) return;
      await updateUser({
        id: user._id,
        name: form.name,
        phone: form.phone || undefined,
        bio: form.bio || undefined,
        skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        availabilityNotes: form.availabilityNotes || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (user === undefined) return <Skeleton className="h-96 rounded-xl max-w-2xl" />;
  if (!user) return <p className="text-muted-foreground">User not found.</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Update your personal information.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Personal Information</CardTitle>
            <StatusBadge status={user.role} />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">Email is managed by your account provider.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us a bit about yourself and why you volunteer..." rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <Input id="skills" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Comma-separated: First Aid, Teaching, Driving" />
              <p className="text-xs text-muted-foreground">Helps coordinators match you with suitable opportunities.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availabilityNotes">Availability Notes</Label>
              <Textarea id="availabilityNotes" value={form.availabilityNotes} onChange={(e) => setForm({ ...form, availabilityNotes: e.target.value })} placeholder="e.g. Available weekends only, not available in December..." rows={2} />
            </div>

            {error && <p className="text-sm text-destructive bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90">
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <Check className="h-4 w-4" />
                  Saved!
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
