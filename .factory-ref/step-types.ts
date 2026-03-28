export const FEATURE_STEP_TYPES = [
  "CREATE",
  "MODIFY",
  "MIGRATE",
  "WIRE",
  "TEST",
] as const;

export const AUDIT_STEP_TYPES = [
  "ANALYZE",
  "FIX",
  "VERIFY",
] as const;

export const ALL_STEP_TYPES = [
  ...FEATURE_STEP_TYPES,
  ...AUDIT_STEP_TYPES,
] as const;

export type FeatureStepType = (typeof FEATURE_STEP_TYPES)[number];
export type AuditStepType = (typeof AUDIT_STEP_TYPES)[number];
export type StepType = (typeof ALL_STEP_TYPES)[number];

export function isValidStepType(type: string): type is StepType {
  return (ALL_STEP_TYPES as readonly string[]).includes(type);
}
