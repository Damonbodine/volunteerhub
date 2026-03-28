import { z } from "zod";

// ═══ Phase 1 — Discovery ═══

export const StackSchema = z.object({
  language: z.string().min(1),
  framework: z.string().min(1),
  frameworkVersion: z.string().optional(),
  runtime: z.string().min(1),
  packageManager: z.string().min(1),
  database: z.object({
    type: z.string(),
    orm: z.string().optional(),
  }).optional(),
  auth: z.object({
    provider: z.string(),
    pattern: z.string().optional(),
  }).optional(),
  ui: z.object({
    library: z.string().optional(),
    styling: z.string().optional(),
  }).optional(),
  testing: z.object({
    unit: z.string().optional(),
    e2e: z.string().optional(),
  }).optional(),
  monorepo: z.boolean(),
});

export const RouteInfoSchema = z.object({
  path: z.string(),
  file: z.string(),
  type: z.enum(["page", "api", "layout", "middleware", "other"]),
});

export const ComponentInfoSchema = z.object({
  name: z.string(),
  file: z.string(),
  usedBy: z.array(z.string()),
});

export const ApiEndpointSchema = z.object({
  method: z.string(),
  path: z.string(),
  handler: z.string(),
});

export const DataModelInfoSchema = z.object({
  name: z.string(),
  file: z.string(),
  fields: z.array(z.string()),
});

export const StructureSchema = z.object({
  entryPoints: z.array(z.string()),
  routes: z.array(RouteInfoSchema),
  components: z.array(ComponentInfoSchema),
  apiSurface: z.array(ApiEndpointSchema),
  dataModels: z.array(DataModelInfoSchema),
});

export const ConventionsSchema = z.object({
  fileNaming: z.string(),
  componentNaming: z.string(),
  exportStyle: z.string(),
  stateManagement: z.string().optional(),
  errorHandling: z.string().optional(),
  testPattern: z.string().optional(),
  importAliases: z.record(z.string()).optional(),
});

export const DependenciesSchema = z.object({
  sharedModules: z.array(z.string()),
  externalServices: z.array(z.string()),
  circularDeps: z.array(z.string()),
  hotPaths: z.array(z.string()),
});

export const EnvironmentSchema = z.object({
  devCommand: z.string(),
  buildCommand: z.string(),
  testCommand: z.string().optional(),
  devUrl: z.string(),
  requiredEnvVars: z.array(z.string()),
  healthCheck: z.enum(["passed", "failed", "skipped"]),
});

export const DocumentationSchema = z.object({
  aiInstructions: z.string().nullable(),
  constraints: z.array(z.string()),
  setupInstructions: z.string().nullable(),
  contributingGuidelines: z.string().nullable(),
  architectureNotes: z.string().nullable(),
  docsFound: z.array(z.string()),
});

export const CodebaseProfileSchema = z.object({
  stack: StackSchema,
  structure: StructureSchema,
  conventions: ConventionsSchema,
  dependencies: DependenciesSchema,
  environment: EnvironmentSchema,
  documentation: DocumentationSchema,
});
export type CodebaseProfile = z.infer<typeof CodebaseProfileSchema>;

export const RepoDocsSchema = z.object({
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    type: z.enum(["ai_instructions", "readme", "contributing", "architecture", "config", "other"]),
  })),
});
export type RepoDocs = z.infer<typeof RepoDocsSchema>;

// ═══ Phase 2 — Planning ═══

export const RequestAnalysisSchema = z.object({
  mode: z.enum(["feature", "audit"]),
  summary: z.string().min(1),
  subFeatures: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).optional(),
  auditCategories: z.array(z.enum([
    "security", "performance", "accessibility", "code_quality", "test_coverage", "dependency_health",
  ])).optional(),
});
export type RequestAnalysis = z.infer<typeof RequestAnalysisSchema>;

export const ImpactAnalysisSchema = z.object({
  affectedFiles: z.array(z.object({
    path: z.string(),
    reason: z.string(),
    action: z.enum(["create", "modify", "delete"]),
  })),
  affectedModules: z.array(z.string()),
  affectedTests: z.array(z.string()),
  migrationNeeded: z.boolean(),
  riskAreas: z.array(z.object({
    area: z.string(),
    risk: z.enum(["low", "medium", "high"]),
    reason: z.string(),
  })),
});
export type ImpactAnalysis = z.infer<typeof ImpactAnalysisSchema>;

export const TargetFileSchema = z.object({
  path: z.string(),
  action: z.enum(["create", "modify", "delete"]),
});

export const ExecutionDagStepSchema = z.object({
  id: z.number().min(100),
  name: z.string().min(1),
  description: z.string().min(1),
  stepType: z.enum(["CREATE", "MODIFY", "MIGRATE", "WIRE", "TEST", "ANALYZE", "FIX", "VERIFY"]),
  dependsOn: z.array(z.number()),
  targetFiles: z.array(TargetFileSchema).min(1),
  verification: z.string().min(1),
});

export const ExecutionDagSchema = z.object({
  steps: z.array(ExecutionDagStepSchema).min(1),
});
export type ExecutionDag = z.infer<typeof ExecutionDagSchema>;

// ═══ Phase 5 — Delivery ═══

export const FinalReportSchema = z.object({
  mode: z.enum(["feature", "audit"]),
  summary: z.string().min(1),
  stepsCompleted: z.number(),
  stepsFailed: z.number(),
  filesCreated: z.array(z.string()),
  filesModified: z.array(z.string()),
  testsAdded: z.number(),
  findings: z.array(z.object({
    severity: z.enum(["critical", "high", "medium", "low", "info"]),
    category: z.string(),
    description: z.string(),
    file: z.string().optional(),
    fixed: z.boolean(),
  })).optional(),
});
export type FinalReport = z.infer<typeof FinalReportSchema>;

// ═══ Schema registry ═══

export const BROWNFIELD_ARTIFACT_SCHEMAS: Record<string, z.ZodType> = {
  codebase_profile: CodebaseProfileSchema,
  repo_docs: RepoDocsSchema,
  request_analysis: RequestAnalysisSchema,
  impact_analysis: ImpactAnalysisSchema,
  execution_dag: ExecutionDagSchema,
  final_report: FinalReportSchema,
  changelog: FinalReportSchema,
  audit_report: FinalReportSchema,
};
