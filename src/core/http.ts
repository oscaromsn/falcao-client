import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { FalcaoAuthenticationError, FalcaoNetworkError } from "./errors";
import type { SessionManager } from "./session";

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  getAuthToken?: () => string | null | Promise<string | null>;
  sessionManager: SessionManager;
  onAuthError?: () => void;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;

  constructor(private config: HttpClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Add common parameters
        const commonParams = this.config.sessionManager.getCommonParams();
        config.params = {
          ...commonParams,
          ...config.params,
        };

        // Add auth token for protected endpoints
        if (!config.url?.includes("/no-auth/") && this.config.getAuthToken) {
          try {
            const token = await this.config.getAuthToken();
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            } else if (!config.url?.includes("public")) {
              // No token for protected endpoint
              throw new FalcaoAuthenticationError();
            }
          } catch (error) {
            if (error instanceof FalcaoAuthenticationError) throw error;
            console.error("Failed to get auth token:", error);
          }
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (axios.isAxiosError(error)) {
          // Handle 401/403
          if (
            error.response?.status === 401 ||
            error.response?.status === 403
          ) {
            this.config.onAuthError?.();
            throw new FalcaoAuthenticationError(
              error.response?.data?.userMessage || "Authentication failed"
            );
          }

          // Handle rate limiting
          if (error.response?.status === 429) {
            const retryAfter = error.response.headers["retry-after"];
            throw new FalcaoNetworkError(
              `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
              error
            );
          }

          // Other network errors
          throw new FalcaoNetworkError(
            error.response?.data?.userMessage || error.message,
            error
          );
        }

        throw error;
      }
    );
  }

  public getInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.request<T>(config);
    return response.data;
  }
}
