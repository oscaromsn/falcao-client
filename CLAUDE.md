# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Falcão API Client** - a TypeScript client library for the Falcão Jurisprudence Search API (PUJ - Pesquisa Unificada de Jurisprudência), providing programmatic access to Brazilian judicial jurisprudence data.

## Code Standards

**Core philosophy**: Analyze problems, break them down, plan, and implement iteratively using Test-Driven Development (TDD). Use "ultrathink" for complex issues or finding optimal architecture approaches when not specified or clearly determinable. When implementing features, heavily rely on static validation (biome check, typechecking, test coverage) to continuously validate you are on the right path and catch bugs as early as possible.

- **Test-First Development**: Write tests before implementation. Tests define the contract and expected behavior.
- **Clean, Readable, Maintainable**: Write self-explanatory, documented code with clear intent
- **SOLID Principles**: Follow Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion
- **DRY (Don't Repeat Yourself)**: Abstract common patterns into reusable functions/components preferring patterns, modularization, and composition.
- **Functional & Declarative**: Prefer immutability, pure functions, and declarative patterns
- **Type Safety**: **No `any` types**. Define explicit interfaces/types. Leverage BAML-generated types and Zod for non-LLM related. `unknown` with proper type guards when necessary.
- **Simplified Service Architecture**: XState v5 with output configuration manages orchestration and service invocation, services are plain functions in central module, no dependency injection complexity.
- **Iterative Refinement**: Prefer fixing errors by rewriting/refining current abstractions over creating new ones unless necessary.
- **Cleanup**: Remove temporary files or scripts created during development.
- **Error Resolution**: When tasked with diagnostics and fixing errors, persist until all identified issues are resolved.

## Commands

### Development
- **Run in watch mode**: `bun run --watch src/index.ts`
- **Run examples**: `bun run examples/example.ts`

### Testing
- **Run tests**: `bun test`
- **Run tests in watch mode**: `bun test --watch`
- **Run tests with coverage**: `bun test --coverage`
- **Run a single test**: `bun test <test-file-path>`

### Code Quality
- **Type checking**: `bun typecheck` (runs `tsc --noEmit`)
- **Type checking (strict mode)**: `bun typecheck:strict`
- **Lint and format**: `bun check` (runs Biome)
- **Quick validation**: `bun validate:quick` (typecheck + biome)
- **Complete validation**: `bun validate:complete` (strict typecheck + biome + knip)

### Build & Release
- **Build types only**: `bun build:types` (emits declarations)
- **Clean build artifacts**: `bun clean`
- **Release**: `bun run release` (runs checks, tests, then publishes)

## Architecture

### Core Client Structure
The library follows a service-oriented architecture with a central `FalcaoClient` that provides access to specialized service modules:

Always check the `@docs/api-reference.md` or `debug_artifacts` when more information about the Falcao API is needed - specially when writing tests.

```
FalcaoClient
├── search: SearchService      # Public search operations
├── documents: DocumentService # Document retrieval and actions
├── user: UserService         # Authenticated user operations
├── admin: AdminService       # Administrative functions
└── ai: AIService            # AI "Robusto" conversational search
```

### Core Structure
- **`src/client.ts`**: Main `FalcaoClient` class that orchestrates all services
- **`src/index.ts`**: Public API exports, carefully organized to export types and runtime values separately
- **`src/core/`**: Core functionality including session management, error handling, and base HTTP client
- **`src/services/`**: Service classes organized by API domain (search, documents, user, AI, admin)
- **`src/schemas/`**: Zod schemas for runtime validation and TypeScript type inference
- **`src/types/`**: TypeScript type definitions and branded types

### Key Architectural Patterns

1. **Service Layer Pattern**: Each API domain has its own service class extending `BaseService`
   - Services handle HTTP requests and response validation
   - All responses are validated using Zod schemas

2. **Session Management**: Automatic handling of `sessionId` and `juristkn` security tokens
   - SessionManager persists session data in localStorage by default
   - Geolocation data is automatically included in requests once set

3. **Type Safety**: End-to-end type safety using TypeScript + Zod
   - All API responses are validated at runtime
   - Types are inferred from Zod schemas
   - Branded types for IDs (DocumentId, SessionId, etc.)

4. **Error Handling**: Typed error classes for different failure scenarios
   - `FalcaoValidationError`: Schema validation failures
   - `FalcaoAuthenticationError`: Auth token issues
   - `FalcaoNetworkError`: Network/HTTP errors
   - `FalcaoApiError`: Base error class

### Service Dependencies
- All services extend `BaseService` which provides common HTTP functionality
- Services receive configuration through dependency injection from the main client
- Session management and authentication are handled transparently by the base service

### Type System
- Uses branded types (e.g., `SessionId`, `DocumentId`) for additional type safety
- All API types are inferred from Zod schemas to ensure runtime and compile-time consistency
- Exports are carefully organized to separate types from runtime values

### Path Mappings
The project uses TypeScript path mappings for cleaner imports:
- `@/*` → `src/*`
- `@schemas/*` → `src/schemas/*`
- `@services/*` → `src/services/*`
- `@core/*` → `src/core/*`
- `@types/*` → `src/types/*`

## Development Notes

- This project uses **Bun** as both runtime and package manager
- Code formatting and linting is handled by **Biome** (configured in `biome.json`)
- TypeScript is configured with path mappings for clean imports (see `tsconfig.json`)
- The library is designed to work in both Node.js and browser environments
- All external API calls include proper session management and geolocation headers
- All API responses validated with Zod schemas
- Special handling for certain fields (uses `#` separator for nomeRelator, orgaoJulgador, classeProcesso)
