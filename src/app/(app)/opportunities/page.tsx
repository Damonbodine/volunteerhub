"use client";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Users, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function OpportunitiesPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const user = useQuery(api.users.getCurrentUser);
  const opportunities = useQuery(api.opportunities.list, {
    category: categoryFilter === "all" ? undefined : (categoryFilter as "Event" | "Ongoing" | "OneTime" | "Seasonal"),
    status: statusFilter === "all" ? undefined : (statusFilter as "Draft" | "Active" | "Full" | "Completed" | "Cancelled"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Opportunities</h1>
          <p className="text-muted-foreground mt-1">Find and sign up for volunteer opportunities.</p>
        </div>
        {(user?.role === "Admin" || user?.role === "Coordinator") && (
          <Link href="/opportunities/new" className={cn(buttonVariants({ variant: "default" }), "bg-primary hover:bg-primary/90")}>
            <Plus className="h-4 w-4 mr-2" />
            New Opportunity
          </Link>
        )}
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Event">Event</SelectItem>
            <SelectItem value="Ongoing">Ongoing</SelectItem>
            <SelectItem value="OneTime">One Time</SelectItem>
            <SelectItem value="Seasonal">Seasonal</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Full">Full</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {opportunities === undefined ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No opportunities found.</p>
          <p className="text-sm mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opp) => {
            const spotsPercent = opp.spotsTotal > 0 ? (opp.spotsFilled / opp.spotsTotal) * 100 : 0;
            return (
              <Link key={opp._id} href={`/opportunities/${opp._id}`} className="block group">
                <Card className="h-full transition-shadow hover:shadow-md border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {opp.title}
                      </CardTitle>
                      <StatusBadge status={opp.status} />
                    </div>
                    <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-700 px-2.5 py-0.5 text-xs font-medium w-fit">
                      {opp.category}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{opp.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{new Date(opp.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          Spots
                        </span>
                        <span className="font-medium">
                          {opp.spotsFilled}/{opp.spotsTotal}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(spotsPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
