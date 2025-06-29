# MCP Supervisor Project Documentation

## Introduction

The **MCP Supervisor** is a robust, production-grade backend server for managing workspace context, resources, and actionable tools using the Model Context Protocol (MCP). It is designed to serve as a governance and orchestration layer for AI assistants (such as Copilot), enforcing discipline, structure, and quality in AI-assisted development workflows. The system is built for extensibility, observability, and strict adherence to modern software engineering best practices (SOLID, dependency injection, testability).

---

## Key Features & System Goals

- **Per-Workspace Context & Config Management:** Only one workspace is active at a time, with in-memory caching and persistent storage in the workspace directory. Automatic detection and handling of workspace switches.
- **Strict Planning & Rule Enforcement:** Requires detailed implementation plans, validates structure, and enforces rules before code is generated or reviewed.
- **Audit & History Tracking:** Maintains a full history of decisions, validates commit messages, and tracks deviations from prior tasks.
- **Prompt Enrichment & MCP Compliance:** Intercepts AI prompts, enforces plan submission, and appends instructions if missing.
- **Extensible, Modular, and Testable:** Built for long-term resilience, with high test coverage, modularity, and clear separation of concerns.
- **Multi-Transport Support:** Runs over HTTP or stdio, with full Docker support for containerized deployments.

---

## Architecture Overview

| Component              | Responsibility                                                     |
| ---------------------- | ------------------------------------------------------------------ |
| `WorkspaceManager`     | Tracks active workspace, manages context/config switching, caching |
| `ContextStore`         | Loads and persists project history, context, and config            |
| `ConfigurationManager` | Loads, validates, and manages supervisor configuration             |
| `PlanValidator`        | Validates required sections of the submitted plan                  |
| `RuleEngine`           | Applies static, dynamic, and AI-driven rule sets                   |
| `PromptEnricher`       | Enhances prompt with missing instructions or corrections           |
| `MCPHandler`           | Formats output in MCP-compliant response format                    |
| `PluginLoader`         | Loads external rule validation logic dynamically                   |

All business logic is abstracted from platform specifics and is independently testable and replaceable. Dependency injection (DI) is used throughout, ensuring modularity and testability.

---

## Workspace & Context Management

- **Single Active Workspace:** Only one workspace is active in memory at a time. All context/config is tied to the active workspace.
- **In-Memory Caching:** Context and config are cached for the active workspace. Switching workspaces flushes and reloads state.
- **Persistent Storage:** All context/config changes are persisted to disk in the workspace directory using a pluggable persistence layer (`IContextPersistence`, `FileContextPersistence`).
- **Automatic Workspace Switching:** On each request, the system checks if the workspace path has changed and switches if needed, flushing and reloading state as appropriate.
- **Graceful Shutdown:** On shutdown, the current workspace state is flushed to disk to prevent data loss.
- **No use of `process.cwd()`:** Workspace detection is explicit and robust, avoiding accidental context leakage.

---

## Dependency Injection & Extensibility

- **DI Everywhere:** All services, including logger-dependent classes, are injected via DI (see `container.ts`). No direct instantiation with `new` in production code.
- **Factory Support:** Factories are used for per-workspace instantiation of services like `ConfigurationManager`.
- **Plugin Architecture:** Rule validation and enrichment logic can be extended via plugins, loaded dynamically at runtime.

---

## Configuration & Rule Enforcement

- **Config File:** `.supervisorrc.json` in the workspace root defines required plan sections, project phases, rules, rule groups, and plugins.
- **Rule Engine:** Applies static, dynamic, and AI-powered rules, associating rule groups with project phases (e.g., draft, coded, audited).
- **Plan Validation:** Requires AI to submit a detailed implementation plan (problem, steps, tests, risks) before code is generated.
- **Audit & Enforcement:** Tracks and surfaces deviations, validates commit messages, and enforces security and quality standards.

---

## Transports & Deployment

- **HTTP & STDIO:** Supports both HTTP and stdio transports for flexible integration (see `start-server.ts`).
- **Docker Support:** Fully containerized, with support for passing workspace path, transport, port, and host as arguments.
- **Supported Arguments:**
  - `--transport <stdio|http>` (default: `stdio`)
  - `--port <number>` (default: `3000`)
  - `--host <host>` (default: `localhost`)

---

## Development, Testing, and Linting

- **TypeScript (strict mode):** All code is strictly typed.
- **Testing:** Jest with ts-jest for high coverage and robust test suites (`tests/`).
- **Linting:** ESLint with TypeScript support.
- **Formatting:** Prettier for consistent code style.
- **Scripts:**
  - `bun run dev` — Development mode with watch
  - `bun run build` — Build for production
  - `bun run test` — Run tests
  - `bun run lint` — Lint code
  - `bun run format` — Format code

---

## Quickstart

```bash
bun install
bun run dev
```

---

## Example Usage

- Start the MCP Supervisor: `bun run dev`
- Run tests: `bun run test`
- Build for production: `bun run build`

---

## Example `.supervisorrc.json`

```json
{
  "plan": {
    "requiredSections": ["problem", "steps", "tests", "risks"]
  },
  "phases": {
    "draft": { "enforce": [] },
    "planned": { "requirePlan": true },
    "coded": { "enforce": ["rule:coverage", "rule:test-structure"] },
    "audited": { "enforce": ["group:quality", "group:security"] },
    "final": { "requireHumanApproval": true }
  },
  "rules": {
    "coverage": {
      "id": "coverage",
      "type": "threshold",
      "target": "test.coverage",
      "value": 0.75,
      "enforcement": "hard",
      "message": "Test coverage must be at least 75%."
    },
    "no-console": {
      "id": "no-console",
      "type": "pattern",
      "pattern": "console\\.log",
      "target": "code",
      "enforcement": "soft"
    }
  },
  "ruleGroups": {
    "quality": ["coverage", "no-console"]
  },
  "extensions": {
    "plugins": ["./plugins/securityScanner.js"]
  },
  "defaults": { "enforcement": "soft" }
}
```

---

## Docker Usage

Build the Docker image:

```bash
docker build -t mcp-supervisor .
```

Run with STDIO (recommended):

```bash
docker run --rm -it \
  -v $(pwd)/your-workspace:/workspace \
  mcp-supervisor --transport stdio
```

Run with HTTP:

```bash
docker run --rm -it \
  -p 3000:3000 \
  mcp-supervisor --transport http --port 3000 --host 0.0.0.0
```

---

## References

- See `docs/` for detailed plans, architecture, and specifications.
- See `README.md` for up-to-date usage and feature list.
