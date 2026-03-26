import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

function getStatusVariant(status: string): string {
  const normalized = status.toLowerCase();

  if (["active", "confirmed", "approved", "open"].includes(normalized)) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (["pending", "waitlisted", "draft"].includes(normalized)) {
    return "bg-amber-100 text-amber-700";
  }
  if (["cancelled", "rejected", "noshow", "no show"].includes(normalized)) {
    return "bg-red-100 text-red-700";
  }
  if (["completed", "full", "inactive"].includes(normalized)) {
    return "bg-gray-100 text-gray-700";
  }

  return "bg-gray-100 text-gray-700";
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        getStatusVariant(status),
        className
      )}
    >
      {status}
    </span>
  );
}
