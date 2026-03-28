"use client";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";

type RiskEntry = {
  name: string;
  id: string;
  riskLevel: "high" | "medium" | "low";
  reason: string;
  suggestedAction: string;
};

const riskColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

export function EngagementRiskDetector() {
  const detectRisk = useAction(api.ai.detectEngagementRisk);

  const [results, setResults] = useState<RiskEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await detectRisk({});
      if (result.atRiskVolunteers.length > 0) {
        setResults(result.atRiskVolunteers);
      } else {
        setResults([]);
        if (result.message) setError(result.message);
      }
    } catch (e) {
      setError("Failed to analyze engagement risk. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-primary" />
            Engagement Risk Detector
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : results !== null ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Re-analyze
              </>
            ) : (
              "Analyze Risk"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : error && results === null ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : results !== null && results.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No volunteers currently at risk of disengagement. Great job keeping everyone engaged!
          </p>
        ) : results ? (
          <div className="space-y-3">
            {results.map((entry, i) => (
              <div
                key={i}
                className="rounded-lg border border-border p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{entry.name}</span>
                  <Badge variant="outline" className={riskColors[entry.riskLevel] ?? ""}>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {entry.riskLevel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{entry.reason}</p>
                <p className="text-xs text-primary">
                  <span className="font-medium">Suggested:</span> {entry.suggestedAction}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click &quot;Analyze Risk&quot; to identify volunteers who may be at risk of dropping off.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
