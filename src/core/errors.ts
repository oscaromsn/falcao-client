import type { AxiosError } from "axios";
import type { ZodError } from "zod";

export class FalcaoApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "FalcaoApiError";
  }
}

export class FalcaoValidationError extends FalcaoApiError {
  constructor(
    message: string,
    public readonly errors: ZodError
  ) {
    super(message, "VALIDATION_ERROR");
    this.name = "FalcaoValidationError";
  }
}

export class FalcaoNetworkError extends FalcaoApiError {
  constructor(
    message: string,
    public readonly axiosError: AxiosError
  ) {
    super(
      message,
      "NETWORK_ERROR",
      axiosError.response?.status,
      axiosError.response?.data
    );
    this.name = "FalcaoNetworkError";
  }
}

export class FalcaoAuthenticationError extends FalcaoApiError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTH_ERROR", 401);
    this.name = "FalcaoAuthenticationError";
  }
}
