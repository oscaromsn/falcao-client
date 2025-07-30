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

## Testing Patterns & Guidelines

### Testing Philosophy
Follow **Test-Driven Development (TDD)** - write tests before implementation. Tests define the contract and expected behavior, serving as living documentation.

### Test Organization
```
tests/
├── unit/           # Isolated unit tests for individual functions/classes
├── integration/    # Service integration tests with mocked HTTP
├── e2e/           # End-to-end tests (minimal, for critical user flows)
├── fixtures/      # Test data and mock responses
├── mocks/         # MSW handlers and test server setup
├── setup.ts       # Global test configuration
└── utils/         # Test utilities and helpers
```

### Test Categories & Patterns

#### 1. Unit Tests (`tests/unit/`)
Test individual functions, classes, and modules in isolation.

**Pattern**: `describe` → `describe` → `it`
```typescript
// tests/unit/core/session.test.ts
describe("SessionManager", () => {
  describe("constructor", () => {
    it("should initialize with default storage", () => {
      // Test setup and assertions
    });
  });
  
  describe("setSession", () => {
    it("should store session data correctly", () => {
      // Test implementation
    });
  });
});
```

**Key Principles**:
- Mock external dependencies using `vi.mock()`
- Test both happy path and error scenarios
- Verify type guards and branded types work correctly
- Use `beforeEach` for test isolation

#### 2. Integration Tests (`tests/integration/`)
Test service interactions with mocked HTTP responses using MSW.

**Pattern**: Test entire service workflows
```typescript
// tests/integration/search.test.ts
describe("SearchService Integration", () => {
  beforeEach(() => {
    // Setup MSW handlers
    server.use(
      http.post("/api/search", ({ request }) => {
        return HttpResponse.json(mockSearchResponse);
      })
    );
  });

  it("should perform search with filters", async () => {
    const result = await client.search.search({
      query: "test",
      filtros: { tribunal: ["STF"] }
    });
    
    expect(result).toMatchObject({
      totalElements: expect.any(Number),
      content: expect.any(Array)
    });
  });
});
```

#### 3. Schema Validation Tests
Test Zod schemas thoroughly since they're critical for runtime safety.

```typescript
describe("SearchResponse Schema", () => {
  it("should validate correct search response", () => {
    const validData = createMockSearchResponse();
    expect(() => searchResponseSchema.parse(validData)).not.toThrow();
  });

  it("should reject invalid data", () => {
    const invalidData = { invalid: "data" };
    expect(() => searchResponseSchema.parse(invalidData)).toThrow();
  });
});
```

#### 4. Error Handling Tests
Test all error scenarios and typed error classes.

```typescript
describe("Error Handling", () => {
  it("should throw FalcaoAuthenticationError for 401 responses", async () => {
    server.use(
      http.get("/api/protected", () => {
        return new HttpResponse(null, { status: 401 });
      })
    );

    await expect(client.user.getProfile()).rejects.toThrow(
      FalcaoAuthenticationError
    );
  });
});
```

### Test Utilities & Helpers

#### Mock Data Creation (`tests/utils/test-helpers.ts`)
```typescript
// Create realistic mock data that matches actual API responses
export const createMockDocumento = (overrides?: Partial<Documento>): Documento => ({
  id: "doc-123",
  tribunal: "STF",
  numeroProcesso: "12345",
  ...overrides
});

// MANDATORY: Wrap all API responses with consistent format
export const createMockApiResponse = <T>(
  data: T,
  overrides: Partial<ApiResponse<T>> = {}
): ApiResponse<T> => ({
  data,
  status: 200,
  timestamp: new Date().toISOString(),
  ...overrides,
});

// For error responses, use proper ErrorResponse schema
export const createMockErrorResponse = (
  overrides: Partial<ErrorResponse> = {}
): ErrorResponse => ({
  timestamp: new Date().toISOString(),
  status: 500,
  error: "Internal Server Error",
  message: "An error occurred while processing the request",
  path: "/api/test",
  ...overrides,
});
```

#### MSW Handlers (`tests/mocks/handlers.ts`)
**CRITICAL**: All mock handlers must use consistent `ApiResponse<T>` wrapping via `createMockApiResponse()`:

```typescript
// ✅ CORRECT: Mirror actual API endpoints with consistent response format
export const handlers = [
  http.post("/api/search", ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("consulta");
    
    const mockResponse = createMockApiResponse(createMockSearchResponse({
      totalElements: query === "empty" ? 0 : 10
    }));
    return HttpResponse.json(mockResponse);
  }),

  // Error responses must also use consistent wrapping
  http.get("/error/500", () => {
    const mockError = createMockErrorResponse({
      status: 500,
      error: "Internal Server Error",
      path: "/error/500",
    });
    const mockResponse = createMockApiResponse(mockError, { status: 500 });
    return HttpResponse.json(mockResponse, { status: 500 });
  })
];
```

**❌ NEVER do this** - raw responses without ApiResponse wrapper:
```typescript
// This breaks consistency with real API format
return HttpResponse.json({ error: "Server Error" });
```

### Coverage Requirements
- **Target**: 80% overall coverage
- **Core modules**: 85% coverage minimum
- **Services**: 80% coverage minimum  
- **Schemas**: 75% coverage minimum

### Testing Commands Integration
- Run tests: `bun test`
- Watch mode: `bun test --watch`
- Coverage: `bun test --coverage`
- Single file: `bun test path/to/test.ts`

### Mock Strategy
1. **HTTP Requests**: Use MSW (Mock Service Worker) for API mocking
   - **MANDATORY**: All HTTP responses must use `createMockApiResponse()` wrapper
   - **Error responses**: Use `createMockErrorResponse()` + `createMockApiResponse()` pattern
   - **Consistency**: Real API format is `{ data: T, status?, timestamp? }` - mocks must match
2. **External Dependencies**: Use Vitest's `vi.mock()` for modules
3. **Browser APIs**: Mock localStorage, fetch, etc. in test setup
4. **Time/Dates**: Use `vi.useFakeTimers()` for deterministic testing

### Test Data Management
- Store mock responses in `tests/fixtures/`
- Use factory functions for creating test data variants
- Keep mock data realistic and based on actual API responses
- Version control all test fixtures for consistency

### Test Naming Conventions
- **Files**: `*.test.ts` or `*.spec.ts`
- **Describe blocks**: Use the class/function name being tested
- **Test cases**: Use "should [expected behavior] when [condition]"

### Validation Protocol
Always run this sequence after test changes:
1. `bun test` - Ensure all tests pass
2. `bun test --coverage` - Verify coverage thresholds
3. `bun typecheck` - Check TypeScript compilation
4. `bun check` - Run Biome linting

### Test Output Organization
All test artifacts are consolidated in `test-output/`:
- Coverage reports: `test-output/coverage/`
- Test results: `test-output/reports/`
- Debug assets: `test-output/debug/`
- Generated assets: `test-output/assets/`

## Development Notes

- This project uses **Bun** as both runtime and package manager
- Code formatting and linting is handled by **Biome** (configured in `biome.json`)
- TypeScript is configured with path mappings for clean imports (see `tsconfig.json`)
- The library is designed to work in both Node.js and browser environments
- All external API calls include proper session management and geolocation headers
- All API responses validated with Zod schemas
- Special handling for certain fields (uses `#` separator for nomeRelator, orgaoJulgador, classeProcesso)
