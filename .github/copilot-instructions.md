<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# AI Supervisor Project - Copilot Instructions

This is a TypeScript project configured in strict mode with the following setup:

## Project Structure

- **Package Manager**: Bun (not npm or yarn)
- **Language**: TypeScript with strict mode enabled
- **Testing**: Jest with ts-jest
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Source Code**: Located in `src/` directory
- **Tests**: Located in `tests/` directory

### 🧠 Planning & Strategy

- Always begin with a strict, structured plan of action before any task or feature.
- No implementation begins until the plan is explicitly approved for complex tasks.
- Features must be broken into small, testable, logically isolated units.
- Every step must be estimated for time and complexity.
- Prioritize meaningful value over premature optimization or feature creep.

## Development Guidelines

- All TypeScript code should be strictly typed
- Use explicit return types for functions when possible
- Follow the existing ESLint and Prettier configuration
- Write comprehensive tests for new features
- Use Bun commands for package management and script execution

### 🛡️ Architecture & Design

- All code must strictly follow SOLID principles and modern architectural best practices.
- Code must be modular, composable, and built for dependency injection.
- Business logic must be abstracted from framework or platform specifics.
- Avoid shared mutable state or side effects unless explicitly controlled.
- No unused exports, unreachable code, or dead functions allowed.
- Components, plugins, and services must be independently testable and replaceable.

## Available Scripts

- `bun run dev` - Development mode with watch
- `bun run build` - Build for production
- `bun run test` - Run tests
- `bun run lint` - Lint code
- `bun run format` - Format code

## Code Style

- Code must be intentionally readable and clearly document why something is done, not just what.
- Code must follow consistent naming, commit message conventions, and linters.
- Use single quotes for strings
- Use semicolons
- 2-space indentation
- 80 character line limit
- Arrow functions without parentheses when possible

### 🤔 Mindset & Culture

- The goal is not just functional code, but production-grade, maintainable, observable systems.
- You are expected to check everything before moving on.
- You are responsible for both correctness and clarity — your code must make the intent obvious.
- Tech debt must be acknowledged, tracked, and addressed — not postponed.
- Think like a systems owner, not just a developer — optimize for long-term resilience, not short-term velocity.
