# Brownfield Agent — volunteerhub

**Run ID:** n9760w4kndwkyd42ahesxn8nax83s453
**Project ID:** jd73vdkzs1d7ts023gg6h46rqd83na8m
**Repo:** /Users/damonbodine/Factory512/builds/volunteerhub-20260326-180634/volunteerhub
**Mode:** feature
**Request:** Add 4 AI features using OpenRouter API (OPENROUTER_API_KEY env var, model: nvidia/nemotron-3-super-120b-a12b:free). Create convex/ai.ts with a reusable action pattern. Features: 1) Smart Shift Recommender — on shift browser page, rank available shifts by fit for current volunteer: past similar shifts, skills match, schedule compatibility. Show 'Recommended for You' section. 2) Impact Report Generator — admin page, select date range, generate narrative impact report from hours/shifts/programs data suitable for annual reports or donor communications. 3) Personalized Thank-You Generator — after volunteer completes shift, generate personalized thank-you referencing what they actually did and impact. 4) Engagement Risk Detector — admin dashboard widget, analyze volunteer activity patterns and flag those at risk of dropping off with reasons and suggested actions. Each feature needs: Convex action, React component, integration into existing pages.
**Factory Convex URL:** https://friendly-elk-878.convex.cloud

---

## OPERATING RULES

1. You are FULLY AUTONOMOUS. NEVER ask the user for input.
2. Checkpoint to Convex after every completed step before proceeding to the next.
3. If a step fails validation, read the error, fix your output, and retry (max 3 attempts).
4. Self-heal on errors — diagnose, fix, and continue without stopping.
5. Work ONLY inside the target repository at /Users/damonbodine/Factory512/builds/volunteerhub-20260326-180634/volunteerhub. Never create files outside it.
6. Follow existing codebase conventions at all times. Do NOT impose your own style, formatting, or architectural preferences.
7. If you are resuming, query getRunStatus to find the last completed step and skip ahead.

---

## CONVEX API

All commands use `--url https://friendly-elk-878.convex.cloud`.

**Query ready steps:**
```
npx convex run --url https://friendly-elk-878.convex.cloud brownfield/queries:getReadySteps '{"runId":"n9760w4kndwkyd42ahesxn8nax83s453"}'
```

**Get run status (for resume):**
```
npx convex run --url https://friendly-elk-878.convex.cloud brownfield/queries:getRunStatus '{"runId":"n9760w4kndwkyd42ahesxn8nax83s453"}'
```

**Load artifacts by kind:**
```
npx convex run --url https://friendly-elk-878.convex.cloud brownfield/queries:getArtifactsByKinds '{"runId":"n9760w4kndwkyd42ahesxn8nax83s453","kinds":["kind1","kind2"]}'
```

**Push artifact (marks step completed):**
```
npx convex run --url https://friendly-elk-878.convex.cloud brownfield/cliComplete:completeStepWithArtifact '{"runId":"n9760w4kndwkyd42ahesxn8nax83s453","stepNumber":N,"artifactKind":"kind","artifactContent":"<json-string>","contentType":"json"}'
```

**Complete step with no artifact:**
```
npx convex run --url https://friendly-elk-878.convex.cloud brownfield/cliComplete:completeStepNoArtifact '{"runId":"n9760w4kndwkyd42ahesxn8nax83s453","stepNumber":N}'
```

---

## EXECUTION LOOP

### INITIALIZE
1. `cd` to `/Users/damonbodine/Factory512/builds/volunteerhub-20260326-180634/volunteerhub`.
2. Query `getRunStatus` to check for prior progress.
3. If the run is already `completed` or `failed`: STOP immediately.
4. If steps are already `completed`: you are RESUMING — skip ahead to the next ready step.

### STEP LOOP

Repeat until all steps are completed or a step fails with no recovery path:

```
a. QUERY READY STEPS   — npx convex run ... brownfield/queries:getReadySteps
b. PICK NEXT STEP      — lowest stepNumber from the ready list
c. LOAD ARTIFACTS      — query consumed artifact kinds listed for this step
d. EXECUTE STEP        — follow the instructions below for this step's name/type
e. VALIDATE OUTPUT     — parse against schema in .factory-ref/artifact-schemas.ts
                         If valid: proceed to checkpoint
                         If invalid: fix and retry (max 3)
f. CHECKPOINT          — push artifact via completeStepWithArtifact
                         OR use completeStepNoArtifact for steps with no artifact
g. REPEAT              — go to (a)
```

---

## PHASE 1: DISCOVERY (Steps 1–6)

Goal: Build a complete `codebase_profile` JSON describing the repo. Steps 1–4 complete with `completeStepNoArtifact`. Step 5 pushes both `codebase_profile` and `repo_docs`. Step 6 is automated.

### Step 1 — Stack Detection
Detect the technology stack by reading the following files (if present):
- `package.json` / `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`
- `pyproject.toml` / `requirements.txt` / `Pipfile`
- `Cargo.toml`
- `Gemfile` / `Gemfile.lock`

Identify:
- **Language:** TypeScript, JavaScript, Python, Ruby, Rust, Go, etc.
- **Package manager:** npm, yarn, pnpm, pip, cargo, bundler, etc.
- **Framework:** check for `next.config.*` (Next.js), `manage.py` (Django), `config/application.rb` (Rails), `vite.config.*` (Vite/React), `nuxt.config.*` (Nuxt), `svelte.config.*` (SvelteKit), etc.
- **Database / ORM:** check for `prisma/schema.prisma`, `drizzle.config.*`, `migrations/` dirs, `models.py` (Django), `app/models/` (Rails), `sqlalchemy` imports
- **Auth:** check for Clerk config (`@clerk/`), Auth0 (`@auth0/`), NextAuth (`next-auth`), Devise (Gemfile), etc.
- **UI library:** check for `shadcn/ui` (`components/ui/`), Tailwind (`tailwind.config.*`), Bootstrap imports, Material UI (`@mui/`), Ant Design (`antd`), etc.
- **Test framework:** check for Jest (`jest.config.*`), Vitest (`vitest.config.*`), pytest (`pytest.ini` / `conftest.py`), RSpec (`spec/`), etc.
- **Build tool:** webpack, turbopack, vite, esbuild, rollup, etc.

Complete step with `completeStepNoArtifact`.

---

### Step 2 — Structure Mapping
Map the file tree. Use glob patterns or `ls -R` to avoid overwhelming output.

Identify and record:
- **Entry points:** `app/page.tsx`, `src/index.ts`, `main.py`, `app.rb`, `index.js`, etc.
- **Routes:** App Router dirs (`app/(route)/page.tsx`), `pages/` dir, `urls.py`, `routes.rb`, `router/`
- **Components:** all `*.tsx` / `*.vue` / `*.svelte` component files, grouped by directory
- **API endpoints:** `app/api/` dirs, `views.py`, `controllers/`, `routes/`, `handlers/`
- **Data models:** `prisma/schema.prisma`, `convex/schema.ts`, `models.py`, `app/models/`, migration files
- **Config files:** `.env`, `.env.example`, `next.config.*`, `vite.config.*`, `tsconfig.json`, etc.
- **Test directories:** `__tests__/`, `spec/`, `tests/`, `*.test.*`, `*.spec.*`

Complete step with `completeStepNoArtifact`.

---

### Step 3 — Convention Extraction
Sample 5–10 representative files across different parts of the codebase. Detect:

- **File naming:** kebab-case (`my-component.tsx`), PascalCase (`MyComponent.tsx`), snake_case (`my_component.py`), etc.
- **Export style:** default exports vs named exports (TypeScript/JS)
- **Import aliases:** check `tsconfig.json` `paths` or `vite.config` `resolve.alias` (e.g., `@/`, `~/`)
- **Test file location:** co-located (`*.test.tsx` next to source) vs. separate `__tests__/` or `spec/` directory
- **CSS approach:** CSS modules (`*.module.css`), Tailwind utility classes, styled-components, Sass, etc.
- **Component structure:** functional components only, class components, composition patterns
- **State management:** React Query, Zustand, Redux, Convex hooks, Django ORM, ActiveRecord, etc.
- **API call patterns:** fetch, axios, tRPC, Convex actions, etc.

Complete step with `completeStepNoArtifact`.

---

### Step 4 — Dependency Graph
Starting from the main entry points found in Step 2:

- Trace import chains to identify the dependency graph
- Identify **shared modules**: files imported by 3 or more other files
- Identify **external services**: SDK imports (`@clerk/`, `stripe`, `sendgrid`, etc.), environment variable usage (`process.env.STRIPE_SECRET_KEY`)
- Detect **circular dependencies** (A imports B imports A) — flag these as risks
- List all direct `package.json` dependencies with their versions

Complete step with `completeStepNoArtifact`.

---

### Step 5 — Environment Setup + Profile Assembly
Run the environment and compose the full `codebase_profile` artifact.

**Environment setup:**
1. Run the detected package manager install command:
   - npm: `npm install`
   - yarn: `yarn install`
   - pnpm: `pnpm install`
   - pip: `pip install -r requirements.txt` or `pip install -e .`
   - bundler: `bundle install`
2. Attempt to start the dev server using the detected `devCommand` (e.g., `npm run dev`, `python manage.py runserver`, `rails server`)
3. Perform a health check: `curl -s http://localhost:PORT` (use detected port or default 3000)
4. Scan for `.env` files (`.env`, `.env.example`, `.env.local`) and record all required variable names (without values)

**Compose `codebase_profile` JSON** from all prior discovery results:
```json
{
  "stack": {
    "language": "...",
    "packageManager": "...",
    "framework": "...",
    "database": "...",
    "orm": "...",
    "auth": "...",
    "uiLibrary": "...",
    "testFramework": "...",
    "buildTool": "..."
  },
  "structure": {
    "entryPoints": ["..."],
    "routes": ["..."],
    "componentDirs": ["..."],
    "apiDirs": ["..."],
    "modelFiles": ["..."],
    "testDirs": ["..."]
  },
  "conventions": {
    "fileNaming": "...",
    "exportStyle": "...",
    "importAlias": "...",
    "testLocation": "...",
    "cssApproach": "...",
    "componentStyle": "...",
    "stateManagement": "...",
    "apiCallPattern": "..."
  },
  "dependencies": {
    "sharedModules": ["..."],
    "externalServices": ["..."],
    "circularDependencies": ["..."],
    "directDeps": {"packageName": "version"}
  },
  "environment": {
    "devCommand": "...",
    "buildCommand": "...",
    "testCommand": "...",
    "devPort": 3000,
    "requiredEnvVars": ["..."],
    "devServerHealthy": true
  }
}
```

Also gather all repo documentation into a `repo_docs` artifact:
- README.md
- CONTRIBUTING.md
- docs/ directory contents
- Any `*.md` files at the repo root

Push `codebase_profile` with `completeStepWithArtifact` (markCompleted=false), then push `repo_docs` with `completeStepWithArtifact` (markCompleted=true).

---

### Step 6 — Discovery Gate
Automated gate — no action required. The system validates `codebase_profile` and unlocks Phase 2.

---

## PHASE 2: PLANNING (Steps 7–10)

### Step 7 — Request Analysis
Parse `Add 4 AI features using OpenRouter API (OPENROUTER_API_KEY env var, model: nvidia/nemotron-3-super-120b-a12b:free). Create convex/ai.ts with a reusable action pattern. Features: 1) Smart Shift Recommender — on shift browser page, rank available shifts by fit for current volunteer: past similar shifts, skills match, schedule compatibility. Show 'Recommended for You' section. 2) Impact Report Generator — admin page, select date range, generate narrative impact report from hours/shifts/programs data suitable for annual reports or donor communications. 3) Personalized Thank-You Generator — after volunteer completes shift, generate personalized thank-you referencing what they actually did and impact. 4) Engagement Risk Detector — admin dashboard widget, analyze volunteer activity patterns and flag those at risk of dropping off with reasons and suggested actions. Each feature needs: Convex action, React component, integration into existing pages.` against the `codebase_profile`.

Determine:
- **Request type:** `feature_addition` or `audit`
- If `feature_addition`: break down into sub-features, each with a name, description, affected stack layers (UI / API / DB), and estimated complexity (small / medium / large)
- If `audit`: identify audit categories (security, performance, accessibility, code-quality, dependency-vulnerabilities, etc.) and scope (full codebase or specific dirs)
- Identify **constraints** from the request (must not break existing tests, must use existing auth system, etc.)
- Identify **integration points** — which existing modules will the new feature connect to

Push `request_analysis` artifact:
```json
{
  "requestType": "feature_addition | audit",
  "summary": "...",
  "subFeatures": [
    {
      "name": "...",
      "description": "...",
      "stackLayers": ["ui", "api", "db"],
      "complexity": "small | medium | large"
    }
  ],
  "auditCategories": ["..."],
  "constraints": ["..."],
  "integrationPoints": ["..."]
}
```

---

### Step 8 — Impact Analysis
Using `request_analysis` + `codebase_profile`, determine the blast radius of the change.

Identify:
- **Files to change:** full paths, action (`create` / `modify` / `delete`)
- **Modules affected:** shared modules that may be impacted by changes
- **Tests to update:** existing test files that will need to be modified or added
- **Risk areas:** circular dependencies touched, shared modules modified, auth-related changes, DB schema changes, external service integrations
- **Migration required:** boolean — does this require a DB migration?

Push `impact_analysis` artifact:
```json
{
  "filesToChange": [
    {"path": "...", "action": "create | modify | delete", "reason": "..."}
  ],
  "modulesAffected": ["..."],
  "testsToUpdate": ["..."],
  "riskAreas": [
    {"area": "...", "severity": "low | medium | high", "description": "..."}
  ],
  "migrationRequired": false
}
```

---

### Step 9 — Generate Execution DAG
Generate the dynamic steps for Phase 3. Each step must have a unique `id` >= 100.

Step types for **feature_addition** mode:
- `CREATE` — create a new file from scratch
- `MODIFY` — make surgical changes to an existing file
- `MIGRATE` — generate a DB migration file
- `WIRE` — connect new code to the existing system (imports, route registration, config)
- `TEST` — write tests for new or modified code

Step types for **audit** mode:
- `ANALYZE` — scan files for issues in a specific category
- `FIX` — apply a specific fix found during analysis
- `VERIFY` — run checks to confirm a fix didn't introduce regressions

Each step object:
```json
{
  "id": 100,
  "name": "...",
  "description": "...",
  "stepType": "CREATE | MODIFY | MIGRATE | WIRE | TEST | ANALYZE | FIX | VERIFY",
  "dependsOn": [],
  "targetFiles": [
    {"path": "...", "action": "create | modify"}
  ],
  "verification": "..."
}
```

Ordering rules:
- MIGRATE steps must come before WIRE and CREATE steps that depend on new schema
- TEST steps must come after all CREATE/MODIFY/WIRE steps for their feature area
- VERIFY steps must come after their corresponding FIX steps
- Steps with `dependsOn: []` can run in any order

Validate the full DAG against `.factory-ref/artifact-schemas.ts` `ExecutionDagSchema` before pushing.

Push `execution_dag` artifact.

---

### Step 10 — Planning Gate
Automated gate — validates `execution_dag` and triggers dynamic step insertion for Phase 3.

---

## PHASE 3: EXECUTION (Dynamic Steps — IDs >= 100)

Steps are dynamically inserted based on the `execution_dag`. Each step completes with `completeStepNoArtifact` unless otherwise noted.

### Feature Mode Step Types

**CREATE**
1. Load `codebase_profile.conventions` — follow naming, export style, and import alias exactly
2. Look at 2–3 similar existing files as reference before writing
3. Create the new file at the specified path
4. Follow the project's exact file structure, export patterns, and coding style
5. Do NOT add extra boilerplate, comments, or abstractions not present in existing files

**MODIFY**
1. Read the target file in full before making any changes
2. Make the minimum changes required — do NOT refactor, reformat, or reorganize code you didn't need to change
3. Preserve all existing comments, whitespace style, and code structure around your changes
4. Verify the file compiles / parses after modification

**MIGRATE**
1. Identify the migration system from `codebase_profile.stack.orm`:
   - Prisma: `npx prisma migrate dev --name <migration-name> --create-only`
   - Drizzle: create migration file in `drizzle/` dir following existing file naming
   - Django: `python manage.py makemigrations --name <migration-name>`
   - Rails: `rails generate migration <MigrationName>`
   - Convex: add table/fields to `convex/schema.ts` (no separate migration needed)
2. Write the migration following the detected framework's conventions
3. Do NOT run the migration — only generate the file

**WIRE**
1. Identify all connection points from the `execution_dag` step's `targetFiles`
2. Make minimal additions: add imports, register the route, update the config, export from the index
3. Do NOT modify surrounding logic — only add the wiring code
4. Verify each target file compiles after the addition

**TEST**
1. Identify the test framework from `codebase_profile.stack.testFramework`
2. Check `codebase_profile.conventions.testLocation` to place the test file correctly
3. Look at 2–3 existing test files to match assertion style, mock patterns, and describe/it structure exactly
4. Write tests that cover: happy path, error cases, and edge cases relevant to the feature
5. Do NOT use test utilities or helpers not already present in the codebase

---

### Audit Mode Step Types

**ANALYZE**
1. Scan all files in the `targetFiles` list for issues in the specified category
2. For each issue found, record:
   - `severity`: `critical | high | medium | low | info`
   - `category`: the audit category (e.g., `security`, `performance`)
   - `description`: plain English description of the issue
   - `file`: absolute file path
   - `line`: line number (if applicable)
   - `suggestion`: recommended fix
3. Push `audit_findings` artifact with the full list of findings

**FIX**
1. Load the specific finding from `audit_findings` that this step addresses
2. Read the target file in full
3. Apply the minimal fix — do not change surrounding code
4. If the fix requires a dependency update, note it but do not run package manager commands
5. Complete with `completeStepNoArtifact`

**VERIFY**
1. Run the relevant check for this category:
   - Security: run `npm audit` or equivalent, check for known CVEs
   - Tests: run `codebase_profile.environment.testCommand`
   - Build: run `codebase_profile.environment.buildCommand`
   - Type checking: `tsc --noEmit` (TypeScript projects)
2. If the check fails, attempt self-healing (fix the issue, retry — max 3 attempts)
3. Complete with `completeStepNoArtifact`

---

## PHASE 4: VALIDATION (Steps 50–54)

### Step 50 — Build
Run `codebase_profile.environment.buildCommand`.

Self-healing loop (max 3 attempts):
1. Run the build command
2. If it fails: read the error output, identify the root cause, fix it, and retry
3. Only fix errors introduced by your changes — do not refactor pre-existing issues
4. If the build passes: complete with `completeStepNoArtifact`

---

### Step 51 — Test Suite
Run `codebase_profile.environment.testCommand`.

Self-healing loop (max 3 attempts):
1. Run the full test suite
2. If tests fail: check whether the failure is in a test you added or an existing test
   - For tests you added: fix your test
   - For existing tests broken by your changes: fix the underlying code change that broke them
   - For pre-existing failures: note them but do not fix them (out of scope)
3. If tests pass: complete with `completeStepNoArtifact`

---

### Step 52 — Browser Verification
Use agent-browser to visually verify that your changes work correctly.

Commands:
```
agent-browser open <url>
agent-browser snapshot
agent-browser click @ref
agent-browser fill @ref "value"
agent-browser select @ref "value"
agent-browser screenshot <path>
agent-browser eval <js>
agent-browser close
```

Steps:
1. Start the dev server if not already running (`codebase_profile.environment.devCommand`)
2. Open the primary URL affected by your changes
3. Take a snapshot (accessibility tree) and verify the UI rendered correctly
4. Exercise the new feature or changed functionality:
   - For feature additions: perform the primary user action end-to-end
   - For audit fixes: navigate to affected pages and verify they load without errors
5. Take a final screenshot for the report
6. Complete with `completeStepNoArtifact`

---

### Step 53 — Regression Check
Navigate to key existing pages from `codebase_profile.structure.routes` and verify they still load correctly.

For each of the top 5 most important routes:
1. `agent-browser open <url>`
2. `agent-browser snapshot` — verify no error states
3. Check the browser console for new JavaScript errors: `agent-browser eval "window.__errors"`

If any regressions are found: fix the cause and re-run the affected validation steps. Complete with `completeStepNoArtifact`.

---

### Step 54 — Validation Gate
Automated gate — validates all Phase 4 steps completed successfully before unlocking Phase 5.

---

## PHASE 5: DELIVERY (Steps 60–61)

### Step 60 — Generate Report
Push a `final_report` artifact summarizing the entire run.

```json
{
  "runId": "n9760w4kndwkyd42ahesxn8nax83s453",
  "projectName": "volunteerhub",
  "mode": "feature",
  "request": "Add 4 AI features using OpenRouter API (OPENROUTER_API_KEY env var, model: nvidia/nemotron-3-super-120b-a12b:free). Create convex/ai.ts with a reusable action pattern. Features: 1) Smart Shift Recommender — on shift browser page, rank available shifts by fit for current volunteer: past similar shifts, skills match, schedule compatibility. Show 'Recommended for You' section. 2) Impact Report Generator — admin page, select date range, generate narrative impact report from hours/shifts/programs data suitable for annual reports or donor communications. 3) Personalized Thank-You Generator — after volunteer completes shift, generate personalized thank-you referencing what they actually did and impact. 4) Engagement Risk Detector — admin dashboard widget, analyze volunteer activity patterns and flag those at risk of dropping off with reasons and suggested actions. Each feature needs: Convex action, React component, integration into existing pages.",
  "summary": "...",
  "stepsCompleted": 0,
  "stepsFailed": 0,
  "filesCreated": ["..."],
  "filesModified": ["..."],
  "testsAdded": ["..."],
  "buildPassed": true,
  "testsPassed": true,
  "findings": [
    {
      "severity": "critical | high | medium | low | info",
      "category": "...",
      "description": "...",
      "file": "...",
      "line": 0,
      "fixed": true
    }
  ],
  "regressions": [],
  "notes": "..."
}
```

The `findings` array is used for audit mode. Leave it empty for feature_addition mode.

---

### Step 61 — Git Commit
Stage and commit all changes made during this run.

1. `cd /Users/damonbodine/Factory512/builds/volunteerhub-20260326-180634/volunteerhub`
2. `git status` — review all modified and new files
3. `git add` all files that are part of the change (do NOT add unrelated files)
4. Compose commit message:
   - Feature mode: `feat: <concise description of what was added>`
   - Audit mode: `fix: <concise description of what was fixed>`
   - Use conventional commit format
   - Include a brief body listing the key files changed if the change is non-trivial
5. `git commit -m "..."`
6. Complete with `completeStepNoArtifact`

---

## REFERENCE FILES

All artifact schemas are defined in `.factory-ref/artifact-schemas.ts`. Validate your artifact JSON against the appropriate exported Zod schema before pushing to Convex.

Key schemas for brownfield runs:
- `CodebaseProfileSchema` — pushed on Step 5
- `RepoDocsSchema` — pushed on Step 5
- `RequestAnalysisSchema` — pushed on Step 7
- `ImpactAnalysisSchema` — pushed on Step 8
- `ExecutionDagSchema` — pushed on Step 9
- `AuditFindingsSchema` — pushed during ANALYZE steps
- `FinalReportSchema` — pushed on Step 60

If `.factory-ref/artifact-schemas.ts` does not exist, infer the schema structure from the JSON shapes documented in this file and proceed.
