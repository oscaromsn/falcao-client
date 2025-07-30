import { HttpClient, type HttpClientConfig } from "@core/http";
import { type SessionConfig, SessionManager } from "@core/session";
import type { Geolocation } from "@schemas/common";
import { AdminService } from "@services/admin";
import { AIService } from "@services/ai";
import { DocumentService } from "@services/documents";
import { SearchService } from "@services/search";
import { UserService } from "@services/user";

export interface FalcaoClientConfig {
  baseURL: string;
  aiBaseURL: string;
  timeout?: number;
  sessionConfig?: SessionConfig;
  getAuthToken?: () => string | null | Promise<string | null>;
  onAuthError?: () => void;
}

export class FalcaoClient {
  private sessionManager: SessionManager;
  private httpClient: HttpClient;

  public readonly search: SearchService;
  public readonly documents: DocumentService;
  public readonly user: UserService;
  public readonly admin: AdminService;
  public readonly ai: AIService;

  constructor(config: FalcaoClientConfig) {
    // Initialize session manager
    this.sessionManager = new SessionManager(config.sessionConfig);

    // Initialize HTTP client
    const httpConfig: HttpClientConfig = {
      baseURL: config.baseURL,
      timeout: config.timeout ?? 30000,
      sessionManager: this.sessionManager,
      ...(config.getAuthToken && { getAuthToken: config.getAuthToken }),
      ...(config.onAuthError && { onAuthError: config.onAuthError }),
    };
    this.httpClient = new HttpClient(httpConfig);

    // Initialize services
    this.search = new SearchService(this.httpClient);
    this.documents = new DocumentService(this.httpClient);
    this.user = new UserService(this.httpClient);
    this.admin = new AdminService(this.httpClient);
    this.ai = new AIService(this.httpClient, config.aiBaseURL);
  }

  // Session management
  setGeolocation(location: Geolocation): void {
    this.sessionManager.setGeolocation(location);
  }

  getSessionId(): string {
    return this.sessionManager.getSessionId();
  }

  clearSession(): void {
    this.sessionManager.clearSession();
  }

  // Utility method to build search context for AI
  buildAISearchContext(filters: any, size: number = 100): string {
    const params = new URLSearchParams();

    // Build query string from filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          params.append(key, value.join(","));
        } else {
          params.append(key, String(value));
        }
      }
    });

    params.append("size", String(size));

    return `/no-auth/pesquisa?${params.toString()}`;
  }
}
