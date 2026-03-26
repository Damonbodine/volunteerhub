"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { use, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../../../../../convex/_generated/dataModel";
import Link from "next/link";
import { ArrowLeft, UserMinus, UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const teamId = id as Id<"teams">;

  const user = useQuery(api.users.getCurrentUser);
  const team = useQuery(api.teams.getById, { id: teamId });
  const members = useQuery(api.teams.getMembers, { teamId });
  const addMember = useMutation(api.teams.addMember);
  const removeMember = useMutation(api.teams.removeMember);

  const [searchEmail, setSearchEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const isAdminOrCoordinator = user?.role === "Admin" || user?.role === "Coordinator";

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    try {
      await addMember({ teamId, volunteerEmail: searchEmail });
      setSearchEmail("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (volunteerId: Id<"users">) => {
    if (confirm("Remove this member from the team?")) {
      await removeMember({ teamId, volunteerId });
    }
  };

  if (team === undefined) return <Skeleton className="h-64 rounded-xl" />;
  if (team === null) return <p className="text-muted-foreground">Team not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/teams" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
          {team.description && (
            <p className="text-muted-foreground text-sm mt-0.5">{team.description}</p>
          )}
        </div>
      </div>

      {isAdminOrCoordinator && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Member
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="searchEmail" className="sr-only">Volunteer Email</Label>
                <Input
                  id="searchEmail"
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="volunteer@example.com"
                  required
                />
              </div>
              <Button type="submit" disabled={adding} className="bg-secondary hover:bg-secondary/90">
                {adding ? "Adding..." : "Add"}
              </Button>
            </form>
            {addError && <p className="text-sm text-destructive mt-2">{addError}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members ({members?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {members === undefined ? (
            <Skeleton className="h-32 w-full" />
          ) : members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No members yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  {isAdminOrCoordinator && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.volunteerId}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>{new Date(member.joinedAt).toLocaleDateString()}</TableCell>
                    {isAdminOrCoordinator && (
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemove(member.volunteerId as Id<"users">)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
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
