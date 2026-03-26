"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

type Role = "Admin" | "Coordinator" | "Volunteer";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const user = useQuery(api.users.getCurrentUser);

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-pulse h-8 w-32 bg-muted rounded" />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role as Role)) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center p-8">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground mt-1">
            You don&apos;t have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
