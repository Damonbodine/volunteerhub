"use client";
export const dynamic = 'force-dynamic';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, Check, CheckCheck } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

const notificationTypeColors: Record<string, string> = {
  ShiftReminder: "bg-blue-100 text-blue-700",
  SignUpConfirmed: "bg-emerald-100 text-emerald-700",
  HoursApproved: "bg-emerald-100 text-emerald-700",
  HoursRejected: "bg-red-100 text-red-700",
  NewOpportunity: "bg-orange-100 text-orange-700",
  ShiftCancelled: "bg-red-100 text-red-700",
  SystemAlert: "bg-amber-100 text-amber-700",
};

export default function NotificationsPage() {
  const notifications = useQuery(api.notifications.listForUser);
  const markRead = useMutation(api.notifications.markAsRead);
  const markAllRead = useMutation(api.notifications.markAllAsRead);

  const handleMarkRead = async (id: Id<"notifications">) => {
    await markRead({ id });
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead({})}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {notifications === undefined ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <BellOff className="h-10 w-10" />
            <p className="text-base font-medium">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n._id}
              className={cn(
                "border transition-colors",
                !n.isRead ? "bg-orange-50/50 border-orange-100" : "border-border"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {!n.isRead && (
                      <span className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", notificationTypeColors[n.type] ?? "bg-gray-100 text-gray-700")}>
                          {n.type.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(n._creationTime).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-semibold text-sm text-foreground">{n.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    </div>
                  </div>
                  {!n.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => handleMarkRead(n._id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
