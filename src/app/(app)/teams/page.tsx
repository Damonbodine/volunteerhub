"use client";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function TeamsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const teams = useQuery(api.teams.list);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teams</h1>
          <p className="text-muted-foreground mt-1">Manage volunteer teams and their coordinators.</p>
        </div>
        {(user?.role === "Admin" || user?.role === "Coordinator") && (
          <Link href="/teams/new" className={cn(buttonVariants({ variant: "default" }), "bg-primary hover:bg-primary/90")}>
            <Plus className="h-4 w-4 mr-2" />
            New Team
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Teams</CardTitle>
        </CardHeader>
        <CardContent>
          {teams === undefined ? (
            <Skeleton className="h-48 w-full" />
          ) : teams.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No teams yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Coordinator</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team._id}>
                    <TableCell className="font-medium">
                      <Link href={`/teams/${team._id}`} className="hover:text-primary transition-colors">
                        {team.name}
                      </Link>
                    </TableCell>
                    <TableCell>{team.coordinatorName ?? "—"}</TableCell>
                    <TableCell>{team.memberCount ?? 0}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${team.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                        {team.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/teams/${team._id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>View</Link>
                    </TableCell>
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
