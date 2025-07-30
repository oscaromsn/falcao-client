import {
  FalcaoApiError,
  FalcaoAuthenticationError,
  FalcaoNetworkError,
  FalcaoValidationError,
} from "@core/errors";
import type { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { type ZodError, z } from "zod";

describe("FalcaoApiError", () => {
  it("should create error with message only", () => {
    const error = new FalcaoApiError("Test error");

    expect(error.message).toBe("Test error");
    expect(error.name).toBe("FalcaoApiError");
    expect(error.code).toBeUndefined();
    expect(error.status).toBeUndefined();
    expect(error.details).toBeUndefined();
    expect(error).toBeInstanceOf(Error);
  });

  it("should create error with all parameters", () => {
    const details = { field: "value" };
    const error = new FalcaoApiError("Test error", "TEST_CODE", 400, details);

    expect(error.message).toBe("Test error");
    expect(error.name).toBe("FalcaoApiError");
    expect(error.code).toBe("TEST_CODE");
    expect(error.status).toBe(400);
    expect(error.details).toBe(details);
  });

  it("should be throwable and catchable", () => {
    const error = new FalcaoApiError("Test error");

    expect(() => {
      throw error;
    }).toThrow(FalcaoApiError);

    expect(() => {
      throw error;
    }).toThrow("Test error");
  });
});

describe("FalcaoValidationError", () => {
  it("should create validation error with ZodError", () => {
    const schema = z.object({ name: z.string() });
    let zodError: ZodError;

    try {
      schema.parse({ name: 123 });
    } catch (error) {
      zodError = error as ZodError;
    }

    const validationError = new FalcaoValidationError(
      "Validation failed",
      zodError!
    );

    expect(validationError.message).toBe("Validation failed");
    expect(validationError.name).toBe("FalcaoValidationError");
    expect(validationError.code).toBe("VALIDATION_ERROR");
    expect(validationError.errors).toBe(zodError!);
    expect(validationError).toBeInstanceOf(FalcaoApiError);
    expect(validationError).toBeInstanceOf(Error);
  });

  it("should preserve ZodError details", () => {
    const schema = z.object({
      name: z.string().min(3),
      age: z.number().positive(),
    });

    let zodError: ZodError;
    try {
      schema.parse({ name: "ab", age: -1 });
    } catch (error) {
      zodError = error as ZodError;
    }

    const validationError = new FalcaoValidationError(
      "Validation failed",
      zodError!
    );

    expect(validationError.errors.issues).toHaveLength(2);
    expect(validationError.errors.issues[0]?.path).toEqual(["name"]);
    expect(validationError.errors.issues[1]?.path).toEqual(["age"]);
  });
});

describe("FalcaoNetworkError", () => {
  it("should create network error from AxiosError", () => {
    const axiosError = {
      message: "Network Error",
      name: "AxiosError",
      response: {
        status: 500,
        data: { error: "Internal Server Error" },
        statusText: "Internal Server Error",
        headers: {},
        config: {},
      },
      config: {},
      isAxiosError: true,
    } as AxiosError;

    const networkError = new FalcaoNetworkError("Request failed", axiosError);

    expect(networkError.message).toBe("Request failed");
    expect(networkError.name).toBe("FalcaoNetworkError");
    expect(networkError.code).toBe("NETWORK_ERROR");
    expect(networkError.status).toBe(500);
    expect(networkError.details).toEqual({ error: "Internal Server Error" });
    expect(networkError.axiosError).toBe(axiosError);
    expect(networkError).toBeInstanceOf(FalcaoApiError);
  });

  it("should handle AxiosError without response", () => {
    const axiosError = {
      message: "Network Error",
      name: "AxiosError",
      config: {},
      isAxiosError: true,
    } as AxiosError;

    const networkError = new FalcaoNetworkError("Request failed", axiosError);

    expect(networkError.message).toBe("Request failed");
    expect(networkError.status).toBeUndefined();
    expect(networkError.details).toBeUndefined();
    expect(networkError.axiosError).toBe(axiosError);
  });

  it("should handle timeout errors", () => {
    const axiosError = {
      message: "timeout of 5000ms exceeded",
      name: "AxiosError",
      code: "ECONNABORTED",
      config: {},
      isAxiosError: true,
    } as AxiosError;

    const networkError = new FalcaoNetworkError("Request timeout", axiosError);

    expect(networkError.message).toBe("Request timeout");
    expect(networkError.code).toBe("NETWORK_ERROR");
    expect(networkError.axiosError.code).toBe("ECONNABORTED");
  });
});

describe("FalcaoAuthenticationError", () => {
  it("should create authentication error with default message", () => {
    const authError = new FalcaoAuthenticationError();

    expect(authError.message).toBe("Authentication required");
    expect(authError.name).toBe("FalcaoAuthenticationError");
    expect(authError.code).toBe("AUTH_ERROR");
    expect(authError.status).toBe(401);
    expect(authError).toBeInstanceOf(FalcaoApiError);
  });

  it("should create authentication error with custom message", () => {
    const authError = new FalcaoAuthenticationError("Invalid token");

    expect(authError.message).toBe("Invalid token");
    expect(authError.name).toBe("FalcaoAuthenticationError");
    expect(authError.code).toBe("AUTH_ERROR");
    expect(authError.status).toBe(401);
  });

  it("should be catchable as specific error type", () => {
    const authError = new FalcaoAuthenticationError("Token expired");

    try {
      throw authError;
    } catch (error) {
      expect(error).toBeInstanceOf(FalcaoAuthenticationError);
      expect(error).toBeInstanceOf(FalcaoApiError);
      expect((error as FalcaoAuthenticationError).code).toBe("AUTH_ERROR");
    }
  });
});

describe("Error inheritance and polymorphism", () => {
  it("should handle all error types polymorphically", () => {
    const errors: FalcaoApiError[] = [
      new FalcaoApiError("Generic error"),
      new FalcaoValidationError("Validation error", {} as ZodError),
      new FalcaoNetworkError("Network error", {} as AxiosError),
      new FalcaoAuthenticationError("Auth error"),
    ];

    errors.forEach((error) => {
      expect(error).toBeInstanceOf(FalcaoApiError);
      expect(error).toBeInstanceOf(Error);
      expect(typeof error.message).toBe("string");
      expect(typeof error.name).toBe("string");
    });
  });

  it("should allow instanceof checks for error hierarchy", () => {
    const validationError = new FalcaoValidationError("test", {} as ZodError);
    const networkError = new FalcaoNetworkError("test", {} as AxiosError);
    const authError = new FalcaoAuthenticationError("test");
    const genericError = new FalcaoApiError("test");

    // All should be instances of base FalcaoApiError
    expect(validationError).toBeInstanceOf(FalcaoApiError);
    expect(networkError).toBeInstanceOf(FalcaoApiError);
    expect(authError).toBeInstanceOf(FalcaoApiError);
    expect(genericError).toBeInstanceOf(FalcaoApiError);

    // Specific type checks
    expect(validationError).toBeInstanceOf(FalcaoValidationError);
    expect(networkError).toBeInstanceOf(FalcaoNetworkError);
    expect(authError).toBeInstanceOf(FalcaoAuthenticationError);

    // Cross-type checks should fail
    expect(validationError).not.toBeInstanceOf(FalcaoNetworkError);
    expect(networkError).not.toBeInstanceOf(FalcaoAuthenticationError);
    expect(authError).not.toBeInstanceOf(FalcaoValidationError);
  });
});
