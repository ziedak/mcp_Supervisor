# `.supervisorrc.json` – Configuration Guide

The `.supervisorrc.json` file defines the behavior and enforcement policies of the **MCP Supervisor**, acting as the governance layer over AI-assisted coding. It controls planning validation, rule enforcement, auditing, and plugin extensibility.

---

## 🧱 Top-Level Structure

```jsonc
{
  "plan": { ... },
  "phases": { ... },
  "rules": { ... },
  "ruleGroups": { ... },
  "extensions": { ... },
  "defaults": { ... }
}
```

---

## 🔍 plan

```json
"plan": {
  "requiredSections": ["problem", "steps", "tests", "risks"]
}
```

Defines which sections must be present in every submitted task plan.

---

## 🔄 phases

Each lifecycle phase defines its validation rules.

```json
"phases": {
  "draft": { "enforce": [] },
  "planned": { "requirePlan": true },
  "coded": { "enforce": ["rule:coverage", "rule:test-structure"] },
  "audited": { "enforce": ["group:quality", "group:security"] },
  "final": { "requireHumanApproval": true }
}
```

### Key

- `enforce`: applies rules or groups
- `requirePlan`: ensures plan validation was performed
- `requireHumanApproval`: AI cannot finalize without user gatekeeping

---

## 📜 rules

Defines reusable, named rules. Types:

- `threshold`: numeric limits (e.g. test coverage)
- `pattern`: regex match against code
- `plugin`: custom JS/TS enforcement module
- `ai`: evaluated via AI agent like Copilot

Example:

```json
"solid": {
  "type": "ai",
  "agent": "copilot",
  "strategy": "analyze-and-instruct",
  "refactorAllowed": true,
  "target": "code",
  "enforcement": "soft",
  "instruction": "Inspect whether the code violates SOLID principles and suggest improvements."
}
```

---

## 🎯 ruleGroups

Groups of rules for easy phase targeting.

```json
"ruleGroups": {
  "quality": ["coverage", "solid", "no-console"],
  "security": ["dep-scan"]
}
```

---

## 🧩 extensions

List of plugin paths to load external rule logic.

```json
"extensions": {
  "plugins": [
    "./plugins/securityScanner.js",
    "./plugins/customRiskDetector.ts"
  ]
}
```

---

## ⚙️ defaults

Fallback configuration.

```json
"defaults": {
  "enforcement": "soft"
}
```

Used if rule doesn’t specify its enforcement level.

---

## ✅ Example Use Case

In `audited` phase, the following apply:

- `quality`: ensures SOLID principles, no console logs, 75% test coverage
- `security`: applies `dep-scan` plugin
- If `solid` rule fails, Copilot AI is used to suggest refactors

---

## 💡 Best Practices

- Keep rules modular and focused
- Use AI rules for contextual patterns (e.g., SOLID, readability)
- Use `ruleGroups` to reduce repetition
- Treat this file as a project-level contract for AI collaboration

---

For deeper automation, pair this file with a RuleEngine service that loads, parses, and applies this structure to enforce development policies in CI or live IDE integration.

