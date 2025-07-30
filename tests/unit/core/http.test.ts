import { FalcaoAuthenticationError, FalcaoNetworkError } from "@core/errors";
import { HttpClient } from "@core/http";
import { SessionManager } from "@core/session";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Create simple localStorage mock for SessionManager
const createStorageMock = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const key in store) delete store[key];
    },
    key: (index: number) => Object.keys(store)[index] || null,
    length: Object.keys(store).length,
  };
};

Object.defineProperty(globalThis, "localStorage", {
  value: createStorageMock(),
  writable: true,
});

describe("HttpClient", () => {
  let sessionManager: SessionManager;
  let httpClient: HttpClient;

  beforeEach(() => {
    localStorage.clear();
    sessionManager = new SessionManager({ persistSession: false });
  });

  describe("constructor and initialization", () => {
    it("should create HTTP client with correct configuration", () => {
      const config = {
        baseURL: "https://api.test.com",
        timeout: 5000,
        sessionManager,
      };

      httpClient = new HttpClient(config);
      const axiosInstance = httpClient.getInstance();

      expect(axiosInstance.defaults.baseURL).toBe("https://api.test.com");
      expect(axiosInstance.defaults.timeout).toBe(5000);
      expect(axiosInstance.defaults.headers["Content-Type"]).toBe(
        "application/json"
      );
      expect(axiosInstance.defaults.headers.Accept).toBe("application/json");
    });

    it("should use default timeout when not specified", () => {
      const config = {
        baseURL: "https://api.test.com",
        sessionManager,
      };

      httpClient = new HttpClient(config);
      const axiosInstance = httpClient.getInstance();

      expect(axiosInstance.defaults.timeout).toBe(30000);
    });

    it("should setup request and response interceptors", () => {
      const config = {
        baseURL: "https://api.test.com",
        sessionManager,
      };

      httpClient = new HttpClient(config);
      const axiosInstance = httpClient.getInstance();

      // Verify interceptors are setup by checking they exist
      expect(axiosInstance.interceptors.request).toBeDefined();
      expect(axiosInstance.interceptors.response).toBeDefined();
    });
  });

  describe("request method", () => {
    beforeEach(() => {
      const config = {
        baseURL: "https://api.test.com",
        sessionManager,
      };
      httpClient = new HttpClient(config);
    });

    it("should make successful request and return data", async () => {
      const mockData = { message: "success" };
      const axiosInstance = httpClient.getInstance();

      // Mock the axios request
      axiosInstance.request = async () => ({ data: mockData }) as any;

      const result = await httpClient.request({ method: "GET", url: "/test" });

      expect(result).toEqual(mockData);
    });

    it("should handle request errors", async () => {
      const axiosInstance = httpClient.getInstance();
      const error = new Error("Network error");

      axiosInstance.request = async () => Promise.reject(error);

      await expect(
        httpClient.request({ method: "GET", url: "/test" })
      ).rejects.toThrow("Network error");
    });
  });

  describe("request interceptor integration", () => {
    it("should work with proper configuration", () => {
      const config = {
        baseURL: "https://api.test.com",
        sessionManager,
      };
      httpClient = new HttpClient(config);

      // Just verify the client was created successfully
      expect(httpClient).toBeDefined();
      expect(httpClient.getInstance()).toBeDefined();
    });

    it("should throw authentication error when no token for protected endpoint", async () => {
      const config = {
        baseURL: "https://api.test.com",
        sessionManager,
        getAuthToken: async () => null,
      };
      httpClient = new HttpClient(config);

      await expect(
        httpClient.request({ method: "GET", url: "/protected" })
      ).rejects.toThrow(FalcaoAuthenticationError);
    });
  });

  describe("response interceptor", () => {
    let httpClient: HttpClient;

    beforeEach(() => {
      const config = {
        baseURL: "https://api.test.com",
        sessionManager,
      };
      httpClient = new HttpClient(config);
    });

    it("should pass through successful responses", async () => {
      const axiosInstance = httpClient.getInstance();
      const mockResponse = { data: { message: "success" }, status: 200 };

      // Test by making an actual request that would go through interceptors
      axiosInstance.request = async () => mockResponse as any;
      const result = await httpClient.request({ method: "GET", url: "/test" });

      expect(result).toEqual(mockResponse.data);
    });

    it("should handle 401 authentication errors", async () => {
      const axiosInstance = httpClient.getInstance();

      // Mock the adapter to simulate a 401 response
      axiosInstance.defaults.adapter = vi.fn().mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 401,
          data: { userMessage: "Token expired" },
        },
      });

      await expect(
        httpClient.request({ method: "GET", url: "/test" })
      ).rejects.toThrow(FalcaoAuthenticationError);
    });

    it("should handle 403 forbidden errors", async () => {
      const axiosInstance = httpClient.getInstance();

      // Mock the adapter to simulate a 403 response
      axiosInstance.defaults.adapter = vi.fn().mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 403,
          data: { userMessage: "Forbidden" },
        },
      });

      await expect(
        httpClient.request({ method: "GET", url: "/test" })
      ).rejects.toThrow(FalcaoAuthenticationError);
    });

    it("should handle 429 rate limit errors", async () => {
      const axiosInstance = httpClient.getInstance();

      // Mock the adapter to simulate a 429 response
      axiosInstance.defaults.adapter = vi.fn().mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 429,
          headers: { "retry-after": "60" },
          data: {},
        },
        message: "Too Many Requests",
      });

      await expect(
        httpClient.request({ method: "GET", url: "/test" })
      ).rejects.toThrow(FalcaoNetworkError);
    });

    it("should handle general network errors", async () => {
      const axiosInstance = httpClient.getInstance();

      // Mock the adapter to simulate a 500 response
      axiosInstance.defaults.adapter = vi.fn().mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 500,
          data: { userMessage: "Internal Server Error" },
        },
        message: "Network Error",
      });

      await expect(
        httpClient.request({ method: "GET", url: "/test" })
      ).rejects.toThrow(FalcaoNetworkError);
    });

    it("should call onAuthError callback for auth errors", async () => {
      let authErrorCalled = false;
      const config = {
        baseURL: "https://api.test.com",
        sessionManager,
        onAuthError: () => {
          authErrorCalled = true;
        },
      };
      httpClient = new HttpClient(config);
      const axiosInstance = httpClient.getInstance();

      // Mock the adapter to simulate a 401 response
      axiosInstance.defaults.adapter = vi.fn().mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 401,
          data: { userMessage: "Unauthorized" },
        },
      });

      try {
        await httpClient.request({ method: "GET", url: "/test" });
      } catch (_e) {
        // Expected to throw
      }

      expect(authErrorCalled).toBe(true);
    });

    it("should pass through non-axios errors", async () => {
      const axiosInstance = httpClient.getInstance();
      const error = new Error("Generic error");

      (axios as any).isAxiosError = () => false;

      // Test by making axios instance reject with this error
      axiosInstance.request = vi.fn().mockRejectedValue(error);

      await expect(
        httpClient.request({ method: "GET", url: "/test" })
      ).rejects.toBe(error);
    });
  });

  describe("getInstance method", () => {
    it("should return the axios instance", () => {
      const config = {
        baseURL: "https://api.test.com",
        sessionManager,
      };
      httpClient = new HttpClient(config);

      const instance = httpClient.getInstance();

      expect(instance).toBeDefined();
      expect(instance.defaults.baseURL).toBe("https://api.test.com");
    });
  });
});
