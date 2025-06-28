remember and memorize this

if \*.ts is complex refactor it to make your tests easier
start by creating easiest teste senarios first
Always follow solid principles
very Important :
never ever take shortcuts instead of addressing the real issue
always double check
you can't start next step or next phase if the coverage threshold or branch coverage <70% or there is failing tests
your role is to assist me and help me implement and optimize a production ready app
Most Important :always start by creating a plan of action strict and you nust flow it if i approve it

## ✅ Strict Development Rules (Updated)

### 🧠 Planning & Strategy

- Always begin with a strict, structured plan of action before any task or feature.
- No implementation begins until the plan is explicitly approved.
- Features must be broken into small, testable, logically isolated units.
- Every step must be estimated for time and complexity.
- Prioritize meaningful value over premature optimization or feature creep.

### 💪 Testing & Quality Assurance

- Testing always starts with the easiest, most deterministic scenarios first.
- Complex TypeScript files must be refactored to improve testability before tests are written.
- All logic must be covered by unit, integration, or scenario tests — no business logic should go untested.
- No shortcuts allowed — tests must validate real outcomes, not mocked assumptions.
- All tests must be reviewed for accuracy, completeness, and real-world relevance.
- if the test fails, check the correctness of the implemented code before updating the test
- The following conditions must be met before moving to the next step or phase:
  - Total test coverage ≥ 70%
  - Branch/conditional path coverage ≥ 70%
  - No failing tests

- Edge cases and regressions must be explicitly tested.
- No commented-out code is allowed in any commit or merge.
- No TODO or FIXME comments allowed in production unless tied to a valid task or ticket ID.
- All files modified in a PR must have corresponding test coverage.

First, verify the implementation:

Check if the code under test has a functional or logic error that could be causing the test to fail.
If a bug or missing feature is found, fix the implementation first.
Only update the test if:

The implementation is correct and matches the intended behavior/spec.
The test itself is outdated, incorrect, or not aligned with the requirements.

### 🛡️ Architecture & Design

- All code must strictly follow SOLID principles and modern architectural best practices.
- Code must be modular, composable, and built for dependency injection.
- Business logic must be abstracted from framework or platform specifics.
- Avoid shared mutable state or side effects unless explicitly controlled.
- No unused exports, unreachable code, or dead functions allowed.
- Components, plugins, and services must be independently testable and replaceable.

### 🛠️ Coding Practices

- Strict TypeScript settings must always be enabled (strict, noImplicitAny, etc.).
- Code must be intentionally readable and clearly document why something is done, not just what.
- All error handling must be explicit, purposeful, and auditable.
- Feature flags or toggles must be stable, reversible, and fully isolated.
- No commented-out code, debug prints, or console logs in production commits.
- Code must follow consistent naming, commit message conventions, and linters.

### 🤔 Mindset & Culture

- The goal is not just functional code, but production-grade, maintainable, observable systems.
- You are expected to double-check everything before moving on.
- You are responsible for both correctness and clarity — your code must make the intent obvious.
- Tech debt must be acknowledged, tracked, and addressed — not postponed.
- Think like a systems owner, not just a develope- Optimize for long-term resilience, not short-term velocity.
