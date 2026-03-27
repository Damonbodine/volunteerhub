"use client";
export const dynamic = 'force-dynamic';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { RoleGuard } from "@/components/role-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../../../../convex/_generated/dataModel";

type Role = "Admin" | "Coordinator" | "Volunteer";

function UsersContent() {
  const users = useQuery(api.users.list);
  const updateRole = useMutation(api.users.updateRole);
  const deactivate = useMutation(api.users.deactivate);

  const handleRoleChange = async (id: Id<"users">, role: Role) => {
    await updateRole({ id, role });
  };

  const handleDeactivate = async (id: Id<"users">) => {
    if (confirm("Deactivate this user? They will no longer be able to access the platform.")) {
      await deactivate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">Manage roles and access for all platform users.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {users === undefined ? (
            <Skeleton className="h-64 w-full" />
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(v) => handleRoleChange(user._id, v as Role)}
                      >
                        <SelectTrigger className="w-36 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Coordinator">Coordinator</SelectItem>
                          <SelectItem value="Volunteer">Volunteer</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.isActive ? "Active" : "Inactive"} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user._creationTime).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleDeactivate(user._id)}
                        >
                          Deactivate
                        </Button>
                      )}
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

export default function UsersPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <UsersContent />
    </RoleGuard>
  );
}
