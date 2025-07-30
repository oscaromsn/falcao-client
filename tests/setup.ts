import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { server } from "./mocks/server";

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());

// Mock crypto for Node.js environment
Object.defineProperty(globalThis, "crypto", {
  value: {
    randomUUID: () => "mock-uuid-" + Math.random().toString(36).substr(2, 9),
    subtle: {},
  },
});

// Mock Bun.CryptoHasher for session manager
if (typeof Bun === "undefined") {
  (globalThis as any).Bun = {
    CryptoHasher: class {
      private data = "";
      update(data: string) {
        this.data += data;
      }
      digest(_encoding: string) {
        // Use underscore to indicate unused parameter
        // Simple mock hash - not cryptographically secure, just for testing
        let hash = 0;
        for (let i = 0; i < this.data.length; i++) {
          const char = this.data.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        const hexHash = Math.abs(hash).toString(16).padStart(8, "0");
        return hexHash + hexHash; // Double to make it longer like MD5
      }
    },
  };
}

// Setup global vi for tests
(globalThis as any).vi = vi;

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage for tests
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};
Object.defineProperty(globalThis, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
  configurable: true,
});

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset localStorage mock
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();

  // Reset sessionStorage mock
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();

  // Ensure storage is available globally
  if (!globalThis.localStorage) {
    globalThis.localStorage = localStorageMock;
  }
  if (!globalThis.sessionStorage) {
    globalThis.sessionStorage = sessionStorageMock;
  }
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
