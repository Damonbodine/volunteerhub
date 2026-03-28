import type { BrownfieldArtifactKind } from "./artifact-kinds";
import type { StepType } from "./step-types";

export type BrownfieldExecutorType = "ai" | "gate";

export interface BrownfieldStepDefinition {
  id: number;
  phase: number;
  name: string;
  description: string;
  dependsOn: number[];
  producesArtifacts: BrownfieldArtifactKind[];
  consumesArtifacts: BrownfieldArtifactKind[];
  executorType: BrownfieldExecutorType;
  maxRetries: number;
}

export interface DynamicStepDefinition {
  id: number;
  name: string;
  description: string;
  stepType: StepType;
  dependsOn: number[];
  targetFiles: Array<{ path: string; action: "create" | "modify" | "delete" }>;
  verification: string;
}

export const DYNAMIC_STEP_ID_OFFSET = 100;

export const BROWNFIELD_DAG: BrownfieldStepDefinition[] = [
  // ═══ PHASE 1 — DISCOVERY (Steps 1-6) ═══
  { id: 1, phase: 1, name: "Stack Detection", description: "Identify frameworks, languages, package managers, DB, auth, UI library, test framework", dependsOn: [], producesArtifacts: [], consumesArtifacts: [], executorType: "ai", maxRetries: 2 },
  { id: 2, phase: 1, name: "Structure Mapping", description: "Map file tree, entry points, routes, components, API surface, data models", dependsOn: [1], producesArtifacts: [], consumesArtifacts: [], executorType: "ai", maxRetries: 2 },
  { id: 3, phase: 1, name: "Convention Extraction", description: "Identify naming patterns, file organization, code style, export conventions, test patterns", dependsOn: [1], producesArtifacts: [], consumesArtifacts: [], executorType: "ai", maxRetries: 2 },
  { id: 4, phase: 1, name: "Dependency Graph", description: "Map imports, shared modules, circular deps, external services, hot paths", dependsOn: [2], producesArtifacts: [], consumesArtifacts: [], executorType: "ai", maxRetries: 2 },
  { id: 5, phase: 1, name: "Environment Setup", description: "Install deps, get the app running, health check", dependsOn: [1], producesArtifacts: ["codebase_profile", "repo_docs"], consumesArtifacts: [], executorType: "ai", maxRetries: 3 },
  { id: 6, phase: 1, name: "Discovery Gate", description: "Validate: app runs, stack identified, structure mapped, no critical gaps", dependsOn: [1, 2, 3, 4, 5], producesArtifacts: [], consumesArtifacts: ["codebase_profile", "repo_docs"], executorType: "gate", maxRetries: 0 },

  // ═══ PHASE 2 — PLANNING (Steps 7-10) ═══
  { id: 7, phase: 2, name: "Request Analysis", description: "Parse user request against codebase profile, determine mode", dependsOn: [6], producesArtifacts: ["request_analysis"], consumesArtifacts: ["codebase_profile"], executorType: "ai", maxRetries: 2 },
  { id: 8, phase: 2, name: "Impact Analysis", description: "Identify affected files, modules, APIs, and tests", dependsOn: [7], producesArtifacts: ["impact_analysis"], consumesArtifacts: ["codebase_profile", "request_analysis"], executorType: "ai", maxRetries: 2 },
  { id: 9, phase: 2, name: "Generate Execution DAG", description: "Produce dynamic steps for Phase 3", dependsOn: [8], producesArtifacts: ["execution_dag"], consumesArtifacts: ["codebase_profile", "request_analysis", "impact_analysis"], executorType: "ai", maxRetries: 2 },
  { id: 10, phase: 2, name: "Planning Gate", description: "Validate DAG coherence, insert dynamic steps", dependsOn: [9], producesArtifacts: [], consumesArtifacts: ["execution_dag", "impact_analysis"], executorType: "gate", maxRetries: 0 },

  // ═══ PHASE 3 — EXECUTION (dynamic steps 100+ inserted at runtime) ═══

  // ═══ PHASE 4 — VALIDATION (Steps 50-54) ═══
  { id: 50, phase: 4, name: "Build Validation", description: "Compile, lint, type-check", dependsOn: [], producesArtifacts: [], consumesArtifacts: [], executorType: "ai", maxRetries: 3 },
  { id: 51, phase: 4, name: "Test Suite", description: "Run existing tests + any new tests", dependsOn: [50], producesArtifacts: [], consumesArtifacts: [], executorType: "ai", maxRetries: 3 },
  { id: 52, phase: 4, name: "Browser Verification", description: "agent-browser validates changes visually", dependsOn: [51], producesArtifacts: [], consumesArtifacts: [], executorType: "ai", maxRetries: 2 },
  { id: 53, phase: 4, name: "Regression Check", description: "Verify existing functionality still works", dependsOn: [52], producesArtifacts: [], consumesArtifacts: [], executorType: "ai", maxRetries: 2 },
  { id: 54, phase: 4, name: "Validation Gate", description: "All checks pass, no regressions", dependsOn: [50, 51, 52, 53], producesArtifacts: [], consumesArtifacts: [], executorType: "gate", maxRetries: 0 },

  // ═══ PHASE 5 — DELIVERY (Steps 60-61) ═══
  { id: 60, phase: 5, name: "Generate Report", description: "Changelog (feature) or findings+fixes report (audit)", dependsOn: [54], producesArtifacts: ["final_report"], consumesArtifacts: [], executorType: "ai", maxRetries: 2 },
  { id: 61, phase: 5, name: "Git Commit", description: "Atomic commit with descriptive message", dependsOn: [60], producesArtifacts: [], consumesArtifacts: ["final_report"], executorType: "ai", maxRetries: 1 },
];
