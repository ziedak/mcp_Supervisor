# MCP Supervisor – System Overview

The **MCP Supervisor** is a governance and orchestration layer that ensures AI assistants (e.g., Copilot) follow structured, high-quality development workflows without modifying code directly. It validates plans, enforces rules, analyzes code quality, and ensures readiness for production.

---

## 🎯 Purpose

- Enforce discipline in AI-assisted coding
- Reduce tech debt from AI-generated code
- Maintain context, scope, and planning alignment
- Assist but not obstruct creativity

---

## 🧠 Core Responsibilities

1. **Planning Enforcement**
   - Requires AI to submit a detailed implementation plan
   - Enforces presence of required sections (e.g., `problem`, `steps`, `tests`, `risks`)
   - Validates structure before any code is reviewed or generated

2. **Rule Enforcement Engine**
   - Applies rules from `.supervisorrc.json`
   - Supports static (`pattern`, `threshold`), dynamic (`plugin`), and AI-powered (`ai`) rules
   - Associates rule groups with project phases (draft, coded, audited, etc.)

3. **Audit & Context Management**
   - Maintains history of decisions
   - Validates commit messages, security posture, and structure
   - Tracks and surfaces deviations from prior tasks

4. **Prompt Enrichment & MCP Compliance**
   - Intercepts AI prompts and enforces plan submission
   - Appends instruction to AI prompt if plan is missing or incomplete
   - Rejects hallucinated or incomplete work before it reaches the user

---

## 🏗 Architecture Components

| Component            | Responsibility                                                     |
|---------------------|----------------------------------------------------------------------|
| `PlanValidator`     | Validates required sections of the submitted plan                   |
| `RuleEngine`        | Applies static, dynamic, and AI-driven rule sets                    |
| `PromptEnricher`    | Enhances prompt with missing instructions or corrections            |
| `ContextStore`      | Loads project history, task context, and config                     |
| `MCPHandler`        | Formats output in MCP-compliant response format                     |
| `PluginLoader`      | Loads external rule validation logic dynamically                    |

---

## ⚙ Workflow Summary

1. **AI proposes task** → MCP Supervisor creates task ID
2. **Plan required** → Must contain `problem`, `steps`, `tests`, `risks`
3. **Validation phase** → `PlanValidator` checks the plan
4. **Rule application** → `RuleEngine` enforces applicable rules per phase
5. **AI Review or Assist** → For `type: ai` rules, Copilot is used to analyze/refactor
6. **Final Gatekeeping** → MCP enforces human approval or quality barriers

---

## 📦 Config Driven: `.supervisorrc.json`

All enforcement behavior is driven by a config file. See the [`.supervisorrc.json` guide](./Supervisorrc-doc.md) for a full breakdown.

Supports:
- Rule types: `threshold`, `pattern`, `plugin`, `ai`
- Lifecycle phases
- Plugin extensions
- Rule grouping and reuse

---

## 🚫 What MCP Supervisor Does Not Do

- It does **not modify code**
- It does **not replace developers**
- It does **not punish AI**, only **guides and audits**

---

## ✅ Why Use MCP Supervisor

- Prevents scope creep and hallucinated features
- Raises baseline for code quality
- Boosts productivity without sacrificing correctness
- Maintains control while enabling AI creativity

---

This document is the foundation for implementing and extending the MCP Supervisor across teams and projects.

