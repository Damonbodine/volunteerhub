"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  PlayCircle,
  RotateCcw,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoStep = {
  id: string;
  title: string;
  body: string;
  whyItMatters: string;
  routePrefix: string;
  target?: string;
  actionTarget?: string;
  actionLabel?: string;
};

type DemoScenario = {
  id: string;
  title: string;
  estimatedMinutes: number;
  description: string;
  steps: DemoStep[];
};

const VOLUNTEERHUB_SCENARIO: DemoScenario = {
  id: "volunteer-operations-review",
  title: "Volunteer Operations Review",
  estimatedMinutes: 2,
  description:
    "Show how VolunteerHub helps a nonprofit monitor volunteer activity, inspect open opportunities, and keep hour approvals moving.",
  steps: [
    {
      id: "dashboard-overview",
      title: "Start with the volunteer operations overview",
      body:
        "The admin dashboard shows active volunteers, approved hours, open opportunities, and upcoming shifts in one place.",
      whyItMatters:
        "A nonprofit leader needs to see program activity quickly before trusting the system for real staffing decisions.",
      routePrefix: "/dashboard",
      target: "[data-demo='dashboard-overview']",
      actionLabel: "Open dashboard",
    },
    {
      id: "dashboard-stats",
      title: "Review the top-line volunteer metrics",
      body:
        "These cards summarize the program at a glance so staff can tell whether volunteer engagement and opportunity volume are healthy.",
      whyItMatters:
        "This proves the app helps manage operations, not just store volunteer records.",
      routePrefix: "/dashboard",
      target: "[data-demo='dashboard-stats']",
    },
    {
      id: "engagement-risk",
      title: "Check for volunteer drop-off risk",
      body:
        "The engagement risk detector highlights volunteers who may be disengaging so coordinators can intervene before people churn out.",
      whyItMatters:
        "Retention is a real nonprofit staffing problem, and this shows the app can support that operational follow-through.",
      routePrefix: "/dashboard",
      target: "[data-demo='engagement-risk']",
    },
    {
      id: "opportunities-list",
      title: "Open the active opportunities workspace",
      body:
        "The opportunities page is where teams can scan live roles, locations, dates, and capacity before deciding what needs staffing attention.",
      whyItMatters:
        "This is the bridge between high-level oversight and actual volunteer scheduling work.",
      routePrefix: "/opportunities",
      target: "[data-demo='opportunities-list']",
      actionLabel: "Open opportunities",
    },
    {
      id: "opportunity-detail",
      title: "Inspect one opportunity in detail",
      body:
        "Each opportunity record shows the mission context, required skills, open shifts, and current fill level for the role.",
      whyItMatters:
        "This shows the system can support concrete staffing and sign-up decisions, not just a list of events.",
      routePrefix: "/opportunities/",
      target: "[data-demo='opportunity-detail']",
      actionTarget: "[data-demo='primary-opportunity-link']",
    },
    {
      id: "review-hours",
      title: "Finish with hour approval",
      body:
        "The review-hours screen lets staff approve or reject submitted volunteer time so reporting and recognition stay accurate.",
      whyItMatters:
        "For many nonprofits, volunteer hour verification is one of the highest-friction admin tasks, so this is a strong proof point.",
      routePrefix: "/review-hours",
      target: "[data-demo='review-hours']",
      actionLabel: "Open review hours",
    },
  ],
};

function getScenarioById(id: string | null): DemoScenario | null {
  if (id === VOLUNTEERHUB_SCENARIO.id) return VOLUNTEERHUB_SCENARIO;
  return null;
}

function routeMatches(pathname: string, routePrefix: string) {
  if (routePrefix.endsWith("/")) {
    return pathname.startsWith(routePrefix);
  }

  return pathname === routePrefix || pathname.startsWith(`${routePrefix}/`);
}

export function DemoMode() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const demoId = searchParams.get("demo");
  const stepParam = searchParams.get("step");
  const scenario = useMemo(() => getScenarioById(demoId), [demoId]);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!scenario) {
      setStepIndex(0);
      return;
    }

    const parsedStep = Number(stepParam ?? "1");
    const nextStepIndex =
      Number.isFinite(parsedStep) && parsedStep > 0
        ? Math.min(parsedStep - 1, scenario.steps.length - 1)
        : 0;

    setStepIndex((prev) => (prev === nextStepIndex ? prev : nextStepIndex));
  }, [demoId, scenario, stepParam]);

  const currentStep = scenario?.steps[stepIndex];

  useEffect(() => {
    if (!scenario) return;

    const nextStepParam = String(stepIndex + 1);
    if (stepParam === nextStepParam) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("demo", scenario.id);
    params.set("step", nextStepParam);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, scenario, searchParams, stepIndex, stepParam]);

  useEffect(() => {
    if (!currentStep?.target) return;

    const element = document.querySelector(currentStep.target);
    if (!element) return;

    element.setAttribute("data-demo-active", "true");
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    return () => {
      element.removeAttribute("data-demo-active");
    };
  }, [currentStep, pathname]);

  if (!scenario || !currentStep) {
    return null;
  }

  const activeScenario = scenario;
  const activeStep = currentStep;
  const onExpectedRoute = routeMatches(pathname, activeStep.routePrefix);
  const isLastStep = stepIndex === activeScenario.steps.length - 1;

  function updateSearch(nextDemo: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextDemo) {
      params.set("demo", nextDemo);
      params.set("step", String(stepIndex + 1));
    } else {
      params.delete("demo");
      params.delete("step");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function nextStep() {
    if (!onExpectedRoute) {
      const actionElement = activeStep.actionTarget
        ? document.querySelector<HTMLElement>(activeStep.actionTarget)
        : null;
      if (actionElement) {
        actionElement.click();
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("demo", activeScenario.id);
      params.set("step", String(stepIndex + 1));
      const route = activeStep.routePrefix.endsWith("/")
        ? activeStep.routePrefix.slice(0, -1)
        : activeStep.routePrefix;
      router.push(`${route}?${params.toString()}`);
      return;
    }

    if (isLastStep) {
      exitDemo();
      return;
    }

    setStepIndex((prev) => prev + 1);
  }

  function previousStep() {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  }

  function restartScenario() {
    setStepIndex(0);
    router.push("/dashboard?demo=volunteer-operations-review&step=1");
  }

  function exitDemo() {
    updateSearch(null);
  }

  return (
    <div className="pointer-events-none fixed right-6 bottom-6 z-50 w-full max-w-md">
      <div className="pointer-events-auto rounded-2xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary"
              >
                Guided Demo
              </Badge>
              <span className="text-xs text-muted-foreground">
                Step {stepIndex + 1} of {activeScenario.steps.length}
              </span>
            </div>
            <h2 className="text-xl font-semibold">{activeScenario.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeScenario.description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={exitDemo}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((stepIndex + 1) / activeScenario.steps.length) * 100}%` }}
          />
        </div>

        <div className="space-y-3">
          <div data-demo-panel-step={activeStep.id}>
            <h3 className="text-base font-semibold">{activeStep.title}</h3>
            <p className="mt-1 text-sm text-foreground/90">{activeStep.body}</p>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Why this matters
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {activeStep.whyItMatters}
            </p>
          </div>

          {!onExpectedRoute && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
              Go to the next screen to continue this walkthrough.
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousStep}
              disabled={stepIndex === 0}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <Button variant="ghost" size="sm" onClick={restartScenario}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Restart
            </Button>
          </div>
          <Button size="sm" onClick={nextStep}>
            {!onExpectedRoute ? (
              <>
                <Compass className="mr-1.5 h-4 w-4" />
                {activeStep.actionLabel ?? "Go there"}
              </>
            ) : isLastStep ? (
              "Finish"
            ) : (
              <>
                Next
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {isLastStep && onExpectedRoute && (
          <div className="mt-3 rounded-xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700">
            You&apos;ve completed the guided demo. Keep exploring, or restart the
            scenario any time.
          </div>
        )}
      </div>
    </div>
  );
}

export function DemoModeStartButton({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className={cn("gap-2", className)}
      onClick={() => router.push("/dashboard?demo=volunteer-operations-review&step=1")}
    >
      <PlayCircle className="h-4 w-4" />
      Start guided demo
    </Button>
  );
}
