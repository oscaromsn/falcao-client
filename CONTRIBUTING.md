# Contributing to Falcão API Client

First off, thank you for considering contributing to the Falcão API Client! We welcome any contributions that help us improve the library, whether it's reporting a bug, proposing a new feature, or writing code.

This document provides guidelines for contributing to the project. Please read it carefully to ensure a smooth and effective contribution process.

## Table of Contents

1.  [Code of Conduct](#code-of-conduct)
2.  [How Can I Contribute?](#how-can-i-contribute)
    -   [Reporting Bugs](#reporting-bugs)
    -   [Suggesting Enhancements](#suggesting-enhancements)
    -   [Pull Requests](#pull-requests)
3.  [Development Setup](#development-setup)
    -   [Prerequisites](#prerequisites)
    -   [Installation](#installation)
    -   [Running Key Scripts](#running-key-scripts)
4.  [Architectural & Coding Conventions](#architectural--coding-conventions)
    -   [Project Structure](#project-structure)
    -   [Schema-Driven Development with Zod](#schema-driven-development-with-zod)
    -   [TypeScript & Type Safety](#typescript--type-safety)
    -   [Code Formatting & Linting](#code-formatting--linting)
    -   [Error Handling](#error-handling)
    -   [Commit Messages](#commit-messages)
5.  [Testing Guidelines](#testing-guidelines)
6.  [Submitting a Pull Request](#submitting-a-pull-request)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please ensure it hasn't already been reported by searching the [GitHub Issues](https://github.com/your-org/falcao-api-client/issues).

If you're opening a new issue, please include the following:

-   **A clear and descriptive title:** e.g., "FalcaoNetworkError thrown for valid 200 response when searching with special characters."
-   **A detailed description of the problem:** Explain the issue and why you believe it's a bug.
-   **Steps to reproduce:** Provide a minimal code snippet that consistently reproduces the issue. Use the `examples/example.ts` file as a starting point.
-   **Expected vs. Actual Behavior:** What did you expect to happen? What happened instead?
-   **Environment Details:**
    -   `@falcao/api-client` version.
    -   Bun or Node.js version.
    -   Operating System.

### Suggesting Enhancements

If you have an idea for a new feature or an improvement to an existing one, please open an issue with the "enhancement" label. Provide:

-   **A clear and descriptive title.**
-   **A detailed description of the enhancement:** What is it? Why is it needed?
--   **A potential implementation plan (if you have one):** How would this feature fit into the existing architecture?
-   **Any relevant API documentation:** If you're proposing support for a new API endpoint, please link to its documentation in `docs/api-reference.md`.

### Pull Requests

We love pull requests! If you're ready to contribute code, please see the sections below on [Development Setup](#development-setup) and [Submitting a Pull Request](#submitting-a-pull-request).

## Development Setup

### Prerequisites

This project is built using the **Bun** runtime. While `npm` or `yarn` might work, all scripts and configurations are optimized for Bun.

-   [Bun](https://bun.sh/) (v1.0.0 or higher)

### Installation

1.  **Fork** the repository on GitHub.
2.  **Clone** your fork locally:
    ```bash
    git clone https://github.com/YOUR_USERNAME/falcao-api-client.git
    cd falcao-api-client
    ```
3.  **Install dependencies** using Bun:
    ```bash
    bun install
    ```
    This will install all necessary `dependencies` and `devDependencies`.

### Running Key Scripts

The `package.json` file contains several scripts for common development tasks:

-   **`bun check`**: Runs **Biome** to check for linting errors and format all files. **Run this before every commit.**
-   **`bun typecheck`**: Runs the TypeScript compiler (`tsc --noEmit`) to check for any type errors.
-   **`bun test`**: Runs the test suite using Bun's built-in test runner.
-   **`bun test:coverage`**: Runs the test suite and generates a coverage report.
-   **`bun example`**: A quick way to run the example file and see the client in action.

A complete validation sequence before pushing your code should be:
```bash
bun validate:complete # This runs typecheck, linting, and knip (dead code detection)
```

## Architectural & Coding Conventions

To maintain the quality and consistency of the codebase, please adhere to the following conventions.

### Project Structure

-   `src/core`: Foundational, cross-cutting concerns (HTTP, Session, Errors).
-   `src/schemas`: The single source of truth for all data structures, defined with **Zod**.
-   `src/services`: Business logic, mapping directly to API resource domains (e.g., `UserService`).
-   `src/types`: Centralized TypeScript type exports, mostly inferred from schemas.
-   `src/client.ts`: The main `FalcaoClient` facade.

### Schema-Driven Development with Zod

This project's reliability hinges on its use of Zod. When you add or modify a feature that interacts with the API, follow this pattern:

1.  **Define the Schema:** In the appropriate file under `src/schemas/`, define or update the Zod schema for the API request body or response. This is the **single source of truth**.
2.  **Infer the Type:** Export a TypeScript type inferred from the schema: `export type MyType = z.infer<typeof MyTypeSchema>;`.
3.  **Validate the Response:** In the corresponding service method (e.g., in `src/services/user.ts`), use the schema to validate the API response via the `this.validate()` method in `BaseService`.

This ensures that our compile-time types always match our runtime validation.

### TypeScript & Type Safety

-   The project uses a **strict** TypeScript configuration. Avoid using `any` unless absolutely necessary and provide a clear justification.
-   All exported types for consumers of the library should be defined or re-exported from `src/types/index.ts`. This provides a clean, single entry point for all types.
-   Use the custom utility and branded types from `src/types/index.ts` where appropriate for enhanced type safety (e.g., `SessionId`, `AuthToken`).

### Code Formatting & Linting

-   **Biome is the law.** All code is formatted and linted by Biome.
-   Do not use Prettier or ESLint.
-   Before committing, run `bun check` to automatically format your code and report any linting errors.
-   Configure your IDE to format on save using Biome for the best experience.

### Error Handling

-   Do not throw generic `Error` objects for API-related failures.
-   Use the custom error classes defined in `src/core/errors.ts` (`FalcaoAuthenticationError`, `FalcaoValidationError`, `FalcaoNetworkError`).
-   If a new type of exceptional situation arises, consider adding a new custom error class that extends `FalcaoApiError`.

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This helps us automate releases and makes the commit history easier to read.

Your commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Common types:**
-   `feat`: A new feature.
-   `fix`: A bug fix.
-   `docs`: Documentation only changes.
-   `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc).
-   `refactor`: A code change that neither fixes a bug nor adds a feature.
-   `test`: Adding missing tests or correcting existing tests.
-   `chore`: Changes to the build process or auxiliary tools.

**Example:**
```
feat(user): add support for updating favorite judges
```
```
fix(search): correctly encode array parameters with '#' separator
```

## Testing Guidelines

While the initial codebase has a testing gap, all new contributions **must include comprehensive tests**.

-   Tests are written using **`bun:test`**.
-   Place test files alongside the files they are testing, with a `.test.ts` extension (e.g., `src/core/session.test.ts`).
-   **Unit Tests:** Core utilities and helper functions should be unit-tested in isolation.
-   **Integration Tests:** Service methods should be tested by mocking the `HttpClient`. Use `vi.spyOn` or `vi.mock` from `bun:test` to assert that the correct HTTP requests (URL, method, params, headers) are being made.
-   **Coverage:** Aim for high test coverage for any new code you add. Run `bun test:coverage` to check your work.

## Submitting a Pull Request

1.  Ensure your code is fully tested and that all checks pass:
    ```bash
    bun check
    bun typecheck
    bun test
    ```
2.  Push your feature branch to your fork on GitHub.
3.  Open a Pull Request against the `main` branch of the original repository.
4.  Provide a clear title and a detailed description of your changes.
    -   Reference any issues that your PR resolves (e.g., `Closes #123`).
    -   Explain the "why" behind your changes, not just the "what."
5.  Be prepared to engage in a code review. The maintainers may request changes to ensure your PR meets the project's quality standards.

Thank you for your contribution
