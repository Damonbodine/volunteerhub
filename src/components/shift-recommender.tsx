"use client";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";

export function ShiftRecommender() {
  const user = useQuery(api.users.getCurrentUser);
  const recommendShifts = useAction(api.ai.recommendShifts);

  const [recommendations, setRecommendations] = useState<
    { index: number; title: string; reason: string }[] | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.role !== "Volunteer") return null;

  const handleRecommend = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await recommendShifts({ volunteerId: user._id });
      if (result.recommendations.length > 0) {
        setRecommendations(result.recommendations);
      } else {
        setError(result.message ?? "No recommendations available.");
      }
    } catch (e) {
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Recommended for You
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRecommend}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : recommendations ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Refresh
              </>
            ) : (
              "Get Recommendations"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : recommendations ? (
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="rounded-lg border border-border p-3 space-y-1"
              >
                <p className="text-sm font-medium text-foreground">{rec.title}</p>
                <p className="text-xs text-muted-foreground">{rec.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click &quot;Get Recommendations&quot; to find shifts that match your skills and availability.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
