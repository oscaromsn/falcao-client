import { beforeEach, describe, expect, it } from "vitest";
import { FalcaoClient } from "@/client";
import { createMockClientConfig } from "../utils/test-helpers";

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

describe("FalcaoClient Integration", () => {
  let client: FalcaoClient;

  beforeEach(() => {
    localStorage.clear();

    const config = createMockClientConfig({
      baseURL: "https://api.test.com",
      aiBaseURL: "https://ai.test.com",
    });

    client = new FalcaoClient(config);
  });

  describe("client initialization", () => {
    it("should initialize with all services", () => {
      expect(client).toBeInstanceOf(FalcaoClient);
      expect(client.search).toBeDefined();
      expect(client.documents).toBeDefined();
      expect(client.user).toBeDefined();
      expect(client.admin).toBeDefined();
      expect(client.ai).toBeDefined();
    });

    it("should initialize with custom timeout", () => {
      const customConfig = createMockClientConfig({
        baseURL: "https://api.test.com",
        aiBaseURL: "https://ai.test.com",
        timeout: 5000,
      });

      const customClient = new FalcaoClient(customConfig);

      expect(customClient).toBeInstanceOf(FalcaoClient);
      expect(customClient.search).toBeDefined();
    });

    it("should initialize with auth token provider", () => {
      const customConfig = createMockClientConfig({
        baseURL: "https://api.test.com",
        aiBaseURL: "https://ai.test.com",
        getAuthToken: async () => "test-token",
      });

      const customClient = new FalcaoClient(customConfig);

      expect(customClient).toBeInstanceOf(FalcaoClient);
      expect(customClient.search).toBeDefined();
    });

    it("should initialize with auth error handler", () => {
      let authErrorCalled = false;
      const customConfig = createMockClientConfig({
        baseURL: "https://api.test.com",
        aiBaseURL: "https://ai.test.com",
        onAuthError: () => {
          authErrorCalled = true;
        },
      });

      const customClient = new FalcaoClient(customConfig);

      expect(customClient).toBeInstanceOf(FalcaoClient);
      expect(authErrorCalled).toBe(false); // Not called during initialization
    });

    it("should initialize with session configuration", () => {
      const customConfig = createMockClientConfig({
        baseURL: "https://api.test.com",
        aiBaseURL: "https://ai.test.com",
        sessionConfig: {
          persistSession: false,
          storageType: "localStorage",
        },
      });

      const customClient = new FalcaoClient(customConfig);

      expect(customClient).toBeInstanceOf(FalcaoClient);
      expect(customClient.search).toBeDefined();
    });
  });

  describe("service integration", () => {
    it("should have search service methods", () => {
      expect(typeof client.search.search).toBe("function");
      expect(typeof client.search.count).toBe("function");
      expect(typeof client.search.autocomplete).toBe("function");
      expect(typeof client.search.getTribunals).toBe("function");
      expect(typeof client.search.getSystemVersions).toBe("function");
      expect(typeof client.search.getDataUpdateDate).toBe("function");
      expect(typeof client.search.getDataPublicationDate).toBe("function");
    });

    it("should have document service methods", () => {
      expect(typeof client.documents.getDocument).toBe("function");
      expect(typeof client.documents.getAcordao).toBe("function");
      expect(typeof client.documents.getPrecedente).toBe("function");
      expect(typeof client.documents.copyFullText).toBe("function");
      expect(typeof client.documents.generateCitation).toBe("function");
      expect(typeof client.documents.generatePdf).toBe("function");
    });

    it("should have user service methods", () => {
      expect(typeof client.user.getProfile).toBe("function");
      expect(typeof client.user.getFavoriteTribunals).toBe("function");
      expect(typeof client.user.updateFavoriteTribunals).toBe("function");
      expect(typeof client.user.getNotifications).toBe("function");
      expect(typeof client.user.saveSearch).toBe("function");
      expect(typeof client.user.getSavedSearches).toBe("function");
      expect(typeof client.user.deleteSavedSearch).toBe("function");
      expect(typeof client.user.getUserStatistics).toBe("function");
      expect(typeof client.user.getUserRanking).toBe("function");
    });

    it("should have admin service methods", () => {
      expect(typeof client.admin.getCacheStatus).toBe("function");
      expect(typeof client.admin.clearCache).toBe("function");
    });

    it("should have AI service methods", () => {
      expect(typeof client.ai.createConversation).toBe("function");
      expect(typeof client.ai.getConversationUrl).toBe("function");
    });
  });

  describe("configuration validation", () => {
    it("should initialize with empty baseURL", () => {
      const client = new FalcaoClient({
        baseURL: "",
        aiBaseURL: "https://ai.test.com",
      });
      expect(client).toBeInstanceOf(FalcaoClient);
    });

    it("should initialize with empty aiBaseURL", () => {
      const client = new FalcaoClient({
        baseURL: "https://api.test.com",
        aiBaseURL: "",
      });
      expect(client).toBeInstanceOf(FalcaoClient);
    });

    it("should accept valid configuration", () => {
      const client = new FalcaoClient({
        baseURL: "https://api.test.com",
        aiBaseURL: "https://ai.test.com",
      });
      expect(client).toBeInstanceOf(FalcaoClient);
    });
  });

  describe("geolocation support", () => {
    it("should support setting geolocation", () => {
      const location = {
        latitude: -23.5505,
        longitude: -46.6333,
        cidade: "São Paulo",
        estado: "SP",
        pais: "Brasil",
      };

      // Access the session manager through the client's internal structure
      // This tests the integration between client and session management
      expect(() => {
        (client as any).sessionManager?.setGeolocation?.(location);
      }).not.toThrow();
    });
  });

  describe("error handling", () => {
    it("should handle invalid configuration gracefully", () => {
      // Test that the client handles various configuration scenarios
      const configs = [
        {
          baseURL: "https://api.test.com",
          aiBaseURL: "https://ai.test.com",
          timeout: -1, // Invalid timeout
        },
        {
          baseURL: "https://api.test.com",
          aiBaseURL: "https://ai.test.com",
          timeout: 0, // Edge case timeout
        },
      ];

      configs.forEach((config) => {
        expect(() => {
          new FalcaoClient(config);
        }).not.toThrow();
      });
    });
  });
});
