"use client";
import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tintColor?: "coral" | "teal" | "default";
  description?: string;
}

export function StatCard({ label, value, icon: Icon, tintColor = "default", description }: StatCardProps) {
  const tintClasses = {
    coral: "bg-orange-50 border-orange-100",
    teal: "bg-teal-50 border-teal-100",
    default: "bg-card border-border",
  };

  const iconClasses = {
    coral: "text-orange-500",
    teal: "text-teal-600",
    default: "text-muted-foreground",
  };

  return (
    <Card className={cn("border", tintClasses[tintColor])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={cn("flex-shrink-0 p-2 rounded-lg", tintColor === "coral" ? "bg-orange-100" : tintColor === "teal" ? "bg-teal-100" : "bg-muted")}>
              <Icon className={cn("h-5 w-5", iconClasses[tintColor])} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
