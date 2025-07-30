import { DEFAULT_BASE_URL, DEFAULT_TIMEOUT } from "@core/constants";
import { FalcaoAuthenticationError, FalcaoNetworkError } from "@core/errors";
import type { SessionManager } from "@core/session";
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

export interface HttpClientConfig {
  baseURL?: string;
  timeout?: number;
  getAuthToken?: () => string | null | Promise<string | null>;
  sessionManager: SessionManager;
  onAuthError?: () => void;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private hasLoggedAuthError = false;
  private hasLoggedRequest = false;

  constructor(private config: HttpClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL ?? DEFAULT_BASE_URL,
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer:
          "https://jurisprudencia.jt.jus.br/jurisprudencia-nacional/home",
        "sec-ch-ua": '"Chromium";v="120", "Not;A=Brand";v="99"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
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

        // Debug: log first request params
        if (
          config.url?.includes("/no-auth/pesquisa") &&
          !this.hasLoggedRequest
        ) {
          this.hasLoggedRequest = true;
          console.log("DEBUG: First request params:", config.params);
        }

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
            // Debug: log first failure details
            if (
              error.config?.url?.includes("/no-auth/pesquisa") &&
              !this.hasLoggedAuthError
            ) {
              this.hasLoggedAuthError = true;
              console.log("DEBUG: First auth error details:");
              console.log("URL:", error.config?.url);
              console.log("Status:", error.response?.status);
              console.log("Response type:", typeof error.response?.data);
              console.log("Response data:", error.response?.data);
            }

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
