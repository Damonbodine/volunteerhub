"use client";
export const dynamic = 'force-dynamic';
import { RoleGuard } from "@/components/role-guard";
import { ImpactReportGenerator } from "@/components/impact-report-generator";

export default function ImpactReportPage() {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <ImpactReportGenerator />
    </RoleGuard>
  );
}
