"use client";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, RefreshCw } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

export function ThankYouGenerator({ shiftId }: { shiftId: Id<"shifts"> }) {
  const user = useQuery(api.users.getCurrentUser);
  const generateThankYou = useAction(api.ai.generateThankYou);

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateThankYou({
        volunteerId: user._id,
        shiftId,
      });
      setMessage(result.message);
    } catch (e) {
      setError("Failed to generate thank-you. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (message) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-2">
            <Heart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">{message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleGenerate}
      disabled={loading}
      className="border-primary/20 text-primary hover:bg-primary/5"
    >
      {loading ? (
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <>
          <Heart className="h-3.5 w-3.5 mr-1" />
          Thank You
        </>
      )}
    </Button>
  );
}
