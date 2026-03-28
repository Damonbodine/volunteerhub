export const BROWNFIELD_ARTIFACT_KINDS = [
  // Phase 1 — Discovery
  "codebase_profile",
  "repo_docs",
  // Phase 2 — Planning
  "request_analysis",
  "impact_analysis",
  "execution_dag",
  // Phase 3 — Execution (dynamic, no fixed kinds)
  // Phase 5 — Delivery
  "changelog",
  "audit_report",
  "final_report",
] as const;

export type BrownfieldArtifactKind = (typeof BROWNFIELD_ARTIFACT_KINDS)[number];

export function isValidBrownfieldArtifactKind(kind: string): kind is BrownfieldArtifactKind {
  return (BROWNFIELD_ARTIFACT_KINDS as readonly string[]).includes(kind);
}
