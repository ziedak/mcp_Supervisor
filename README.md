# MCP Supervisor

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/bun-%E2%9C%94%EF%B8%8F-green)](https://bun.sh)

> **A robust, production-grade Model Context Protocol (MCP) Supervisor for advanced context/resource/tool management.**

---

## 🚀 Features

- 🧠 Type-safe, extensible, and observable MCP Supervisor
- 🔄 Real-time, actionable tools and resources
- 🧩 Modular, SOLID architecture (dependency injection, testable)
- 🧪 High test coverage (Jest)
- ⚡ Bun-powered for speed
- 🛠️ Easy integration with AI agents, VS Code Copilot Agent Mode, and automation

---

## What is MCP Supervisor?

MCP Supervisor is a backend server that manages workspace context, resources, and actionable tools using the [Model Context Protocol](https://github.com/modelcontextprotocol). It enables AI agents and developer tools to:

- Query workspace state, audit logs, config, and more
- Execute tools and automate tasks
- Integrate with VS Code Copilot Agent Mode and other MCP clients

---

## Quickstart

```bash
bun install
bun run dev
```

---

## Example Usage

Start the MCP Supervisor:

```bash
bun run dev
```

Run tests:

```bash
bun run test
```

Build for production:

```bash
bun run build
```

---

## Example `.supervisorrc.json`

Place this in your project root (see also `exemple/supervisorrc/.supervisorrc.json`):

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
    },
    "solid": {
      "id": "solid",
      "type": "ai",
      "agent": "copilot",
      "strategy": "analyze-and-instruct",
      "refactorAllowed": true,
      "target": "code",
      "enforcement": "soft",
      "instruction": "Inspect whether the code violates SOLID principles and suggest improvements."
    },
    "dep-scan": {
      "id": "dep-scan",
      "type": "plugin",
      "plugin": "./plugins/securityScanner.js",
      "enforcement": "hard"
    }
  },
  "ruleGroups": {
    "quality": ["coverage", "solid", "no-console"],
    "security": ["dep-scan"]
  },
  "extensions": {
    "plugins": [
      "./plugins/securityScanner.js",
      "./plugins/customRiskDetector.ts"
    ]
  },
  "defaults": { "enforcement": "soft" }
}
```

---

## 🧩 Integration: VS Code Copilot Agent Mode

You can use MCP Supervisor as a backend for [VS Code Copilot Agent Mode](https://github.com/modelcontextprotocol/typescript-sdk):

1. **Install and start MCP Supervisor:**
   ```bash
   bun install
   bun run dev
   ```
2. **Configure your `.supervisorrc.json` as above.**
3. **Connect the Copilot Agent to your running MCP Supervisor instance.**

This enables advanced context/resource/tool management for AI agents and developer workflows in VS Code.

---

## 🐳 Docker Support

You can run MCP Supervisor in a containerized environment and pass all required arguments for workspace path, transport, port, and host.

### Build the Docker image

```bash
docker build -t mcp-supervisor .
```

### Run the container

## STDIO (recommended)

```bash
docker run --rm -it \
  -v $(pwd)/your-workspace:/workspace \
  mcp-supervisor  --transport stdio
```

## http

```bash
docker run --rm -it \
  -p 3000:3000 \
  mcp-supervisor --transport http --port 3000 --host 0.0.0.0
```

- You can change the port, host, and transport as needed.
- All arguments supported by `start-server.ts` are available (see below).

### Supported Arguments

- `--transport <stdio|http>` (default: `stdio`)
- `--port <number>` (default: `3000`)
- `--host <host>` (default: `localhost`)

---

## 📚 API & Tools

- Exposes all MCP workspace resources: info, audit log, config, rule results, plugin info, user/task context, and more
- All tools/resources are actionable, filterable, and return real data
- Type-safe Zod schemas for validation
- See [`docs/summary.md`](./docs/summary.md) for full details

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or pull request.

- All code must be strictly typed and follow SOLID principles.
- Write comprehensive, isolated tests for all features.
- Use Bun for all scripts and dependency management.
- See `.github/` and `docs/` for more details.

---

## 📝 License

MIT — see [LICENSE](LICENSE)

---

For a detailed project summary, see [`docs/summary.md`](./docs/summary.md).
