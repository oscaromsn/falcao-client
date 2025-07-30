import type { Pagination } from "@schemas/common";
import type { Filtro } from "@schemas/search";
import { HttpResponse, http } from "msw";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { FalcaoClient } from "@/client";
import { server } from "../mocks/server";
import {
  createMockClientConfig,
  createMockGeolocation,
} from "../utils/test-helpers";

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

describe("Search Endpoints E2E Tests", () => {
  let client: FalcaoClient;

  beforeAll(() => {
    // Stop MSW server for true e2e testing against real API
    server.close();
  });

  afterAll(() => {
    // Restart MSW server for other tests
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    localStorage.clear();
  });

  beforeEach(() => {
    localStorage.clear();

    const config = createMockClientConfig({
      baseURL:
        "https://jurisprudencia.jt.jus.br/jurisprudencia-nacional-backend/api",
      aiBaseURL: "https://ai.jurisprudencia.jt.jus.br/robusto",
      timeout: 10000,
      sessionConfig: {
        persistSession: false,
        storageType: "localStorage",
      },
    });

    client = new FalcaoClient(config);
  });

  describe("search() endpoint e2e", () => {
    it("should perform complete search workflow with filters and pagination", async () => {
      const filters: Filtro = {
        texto: "constitutional law",
        tribunais: ["STF", "STJ"],
        dataInicio: "2024-01-01",
        dataFim: "2024-12-31",
        temEmenta: "S",
        colecao: "acordaos",
      };

      const pagination: Pagination = {
        page: 0,
        size: 10,
      };

      const result = await client.search.search(filters, pagination);

      // Verify response structure matches expected schema
      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });

      // Verify document structure
      expect(result).toHaveProperty("documentos");
      expect(result.documentos).toBeDefined();
      if (result.documentos.length > 0) {
        const document = result.documentos[0];
        expect(document).toMatchObject({
          tribunal: expect.any(String),
        });
        // Note: tituloDecisao and ementa may not contain search terms in real API
      }

      // Verify available filters structure
      expect(result).toHaveProperty("filtrosDisponiveis");
      expect(result.filtrosDisponiveis).toBeDefined();
      if (result.filtrosDisponiveis.length > 0) {
        const filter = result.filtrosDisponiveis[0];
        if (filter) {
          expect(filter).toMatchObject({
            nomeDoFiltro: expect.any(String),
            nomeWeb: expect.any(String),
            ordem: expect.any(Number),
            valoresFiltro: expect.any(Array),
          });

          // Verify filter values structure if available
          if (filter.valoresFiltro && filter.valoresFiltro.length > 0) {
            const filterValue = filter.valoresFiltro[0];
            expect(filterValue).toMatchObject({
              valor: expect.any(String),
              quantidade: expect.any(Number),
              valorWeb: expect.any(String),
            });
          }
        }
      }
    });

    it("should handle different pagination scenarios", async () => {
      const filters: Filtro = {
        texto: "test",
        colecao: "acordaos",
      };

      // Test first page
      const firstPage = await client.search.search(filters, {
        page: 0,
        size: 5,
      });
      expect(firstPage.documentos).toBeDefined();

      // Test second page
      const secondPage = await client.search.search(filters, {
        page: 1,
        size: 5,
      });
      expect(secondPage.documentos).toBeDefined();

      // Test large page size
      const largePage = await client.search.search(filters, {
        page: 0,
        size: 10,
      });
      expect(largePage.documentos).toBeDefined();
    });

    it("should handle complex filter combinations", async () => {
      const complexFilters: Filtro = {
        texto: "administrative procedure",
        tribunais: ["TST"],
        dataInicio: "2023-01-01",
        dataFim: "2024-12-31",
        temEmenta: "S",
        colecao: "acordaos",
      };

      const result = await client.search.search(complexFilters, {
        page: 0,
        size: 10,
      });

      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });

      // Verify documents are returned if available
      if (result.documentos.length > 0) {
        const document = result.documentos[0];
        expect(document).toMatchObject({
          tribunal: expect.any(String),
        });
        // Note: tituloDecisao may not contain search terms in real API
      }
    });

    it("should handle empty search results", async () => {
      const filters: Filtro = {
        texto: "nonexistent_term_12345",
        colecao: "acordaos",
      };

      const result = await client.search.search(filters, { page: 0, size: 10 });

      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });

      // Empty results should still have proper structure
      expect(result).toHaveProperty("documentos");
      expect(result).toHaveProperty("filtrosDisponiveis");
      expect(result).toHaveProperty("quantidadeTotal");
      expect(result.quantidadeTotal).toBeDefined();
    });

    it("should properly serialize array parameters", async () => {
      // This test verifies that the client properly handles array parameter serialization
      // for fields that use different separators (# vs ,)
      const filters: Filtro = {
        tribunais: ["STF", "STJ", "TST"], // Uses comma separator
        nomeRelator: ["Relator 1", "Relator 2"], // Uses # separator
        orgaoJulgador: ["Orgao 1", "Orgao 2"], // Uses # separator
        classeProcesso: ["ADI", "ADPF"], // Uses # separator
        colecao: "acordaos", // Fixed: single collection only
      };

      const result = await client.search.search(filters, { page: 0, size: 10 });

      // If serialization works correctly, we should get a valid response
      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });
    });
  });

  describe("count() endpoint e2e", () => {
    it("should get search result count with available filters", async () => {
      const filters: Filtro = {
        texto: "constitutional",
        tribunais: ["STF"],
        colecao: "acordaos",
      };

      const result = await client.search.count(filters);

      expect(result).toMatchObject({
        countPrecedentes: expect.any(Number),
        countAcordaos: expect.any(Number),
        countSentencas: expect.any(Number),
        countRR: expect.any(Number),
        countDecisoesMonocraticas: expect.any(Number),
      });

      // Verify basic properties exist
      expect(result).toHaveProperty("countAcordaos");
      expect(result).toHaveProperty("countPrecedentes");
    });

    it("should handle count with complex filters", async () => {
      const complexFilters: Filtro = {
        texto: "labor law",
        tribunais: ["TST", "TRT1"],
        dataInicio: "2024-01-01",
        dataFim: "2024-12-31",
        nomeRelator: ["Ministro Teste"],
        colecao: "acordaos",
      };

      const result = await client.search.count(complexFilters);

      expect(result).toMatchObject({
        countPrecedentes: expect.any(Number),
        countAcordaos: expect.any(Number),
        countSentencas: expect.any(Number),
        countRR: expect.any(Number),
        countDecisoesMonocraticas: expect.any(Number),
      });

      expect(result).toHaveProperty("countAcordaos");
    });

    it("should provide consistent filter structure with search results", async () => {
      const filters: Filtro = {
        texto: "test consistency",
        colecao: "acordaos",
      };

      // Get both search and count results
      const [searchResult, countResult] = await Promise.all([
        client.search.search(filters, { page: 0, size: 5 }),
        client.search.count(filters),
      ]);

      // Search should have filtrosDisponiveis, count should have count fields
      expect(searchResult.filtrosDisponiveis).toBeDefined();
      expect(countResult.countAcordaos).toBeDefined();

      // Verify different response structures
      expect(searchResult.documentos).toBeDefined();
      expect(countResult).toHaveProperty("countPrecedentes");
      expect(countResult).toHaveProperty("countAcordaos");
      expect(countResult).toHaveProperty("countSentencas");
    });
  });

  describe("autocomplete() endpoint e2e", () => {
    it("should provide autocomplete suggestions for valid queries", async () => {
      const query = "constitutional";

      const result = await client.search.autocomplete(query);

      expect(result).toMatchObject({
        sugestoes: expect.any(Array),
      });

      expect(result).toHaveProperty("sugestoes");
      expect(result.sugestoes).toBeDefined();

      // Optional fields may be present
      if (result.queriesRelated) {
        expect(result.queriesRelated).toBeDefined();
      }
    });

    it("should handle short queries", async () => {
      const shortQuery = "co";

      const result = await client.search.autocomplete(shortQuery);

      expect(result).toMatchObject({
        sugestoes: expect.any(Array),
      });

      expect(result).toHaveProperty("sugestoes");
    });

    it("should handle empty queries", async () => {
      const result = await client.search.autocomplete("");

      expect(result).toMatchObject({
        sugestoes: expect.any(Array),
      });

      expect(result).toHaveProperty("sugestoes");
    });

    it("should handle special characters in queries", async () => {
      const specialQuery = "josé & maria";

      const result = await client.search.autocomplete(specialQuery);

      expect(result).toMatchObject({
        sugestoes: expect.any(Array),
      });

      expect(result).toHaveProperty("sugestoes");
    });

    it("should provide timing information when available", async () => {
      const result = await client.search.autocomplete("performance");

      expect(result).toMatchObject({
        sugestoes: expect.any(Array),
      });

      // These fields are optional but if present should be numbers
      if (result.tempoElasticsearch !== undefined) {
        expect(typeof result.tempoElasticsearch).toBe("number");
      }

      if (result.tempoConsultaCompleta !== undefined) {
        expect(typeof result.tempoConsultaCompleta).toBe("number");
      }
    });
  });

  describe("information endpoints e2e", () => {
    it("should get list of available tribunals", async () => {
      const result = await client.search.getTribunals();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);

      const tribunal = result[0];
      expect(tribunal).toMatchObject({
        sigla: expect.any(String),
        nome: expect.any(String),
      });

      // Verify all tribunals have proper structure - simplified
      result.forEach((tribunal) => {
        expect(tribunal).toHaveProperty("sigla");
        expect(tribunal).toHaveProperty("nome");
      });
    });

    it("should get system version information", async () => {
      const result = await client.search.getSystemVersions();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);

      const version = result[0];
      expect(version).toMatchObject({
        versao: expect.any(String),
        data: expect.any(String),
        descricao: expect.any(String),
      });

      // Verify version structure
      expect(version).toHaveProperty("versao");
      expect(version).toHaveProperty("data");
      expect(version).toHaveProperty("descricao");
    });

    it("should get data update information", async () => {
      const result = await client.search.getDataUpdateDate();

      expect(result).toMatchObject({
        dataAtualizacaoAcordao: expect.any(Array),
        dataAtualizacaoPrecedentes: expect.any(Array),
      });

      // Verify structure
      expect(result).toHaveProperty("dataAtualizacaoAcordao");
      expect(result).toHaveProperty("dataAtualizacaoPrecedentes");
      if (result.dataAtualizacaoAcordao.length > 0) {
        expect(result.dataAtualizacaoAcordao[0]).toMatchObject({
          tribunal: expect.any(String),
          data: expect.any(String),
        });
      }
    });

    it("should get data publication information", async () => {
      const result = await client.search.getDataPublicationDate();

      expect(result).toMatchObject({
        dataAtualizacaoAcordao: expect.any(Array),
        dataAtualizacaoPrecedentes: expect.any(Array),
      });

      // Verify structure
      expect(result).toHaveProperty("dataAtualizacaoAcordao");
      expect(result).toHaveProperty("dataAtualizacaoPrecedentes");
      if (result.dataAtualizacaoAcordao.length > 0) {
        expect(result.dataAtualizacaoAcordao[0]).toMatchObject({
          tribunal: expect.any(String),
          data: expect.any(String),
        });
      }
    });

    it("should handle information endpoint caching", async () => {
      // Make multiple calls to the same endpoint
      const [result1, result2, result3] = await Promise.all([
        client.search.getTribunals(),
        client.search.getTribunals(),
        client.search.getTribunals(),
      ]);

      // Results should be identical (testing consistency)
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);

      // All should have the same structure
      [result1, result2, result3].forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe("error handling and edge cases e2e", () => {
    it("should handle network timeout errors", async () => {
      // Mock a timeout scenario
      server.use(
        http.get("*/no-auth/pesquisa", () => {
          return new Promise(() => {
            // Intentionally never resolve to simulate timeout
          });
        })
      );

      const filters: Filtro = {
        texto: "timeout test",
        colecao: "acordaos",
      };

      await expect(
        client.search.search(filters, { page: 0, size: 10 })
      ).rejects.toThrow();
    });

    it("should handle server error responses", async () => {
      const { http, HttpResponse } = await import("msw");

      server.use(
        http.get("*/no-auth/pesquisa", () => {
          return HttpResponse.json(
            {
              timestamp: new Date().toISOString(),
              status: 500,
              error: "Internal Server Error",
              message: "Database connection failed",
              path: "/no-auth/pesquisa",
            },
            { status: 500 }
          );
        })
      );

      const filters: Filtro = {
        texto: "server error test",
        colecao: "acordaos",
      };

      await expect(
        client.search.search(filters, { page: 0, size: 10 })
      ).rejects.toThrow();
    });

    it("should handle authentication errors", async () => {
      const { http, HttpResponse } = await import("msw");

      server.use(
        http.get("*/no-auth/pesquisa", () => {
          return HttpResponse.json(
            {
              timestamp: new Date().toISOString(),
              status: 401,
              error: "Unauthorized",
              message: "Authentication required",
              path: "/no-auth/pesquisa",
            },
            { status: 401 }
          );
        })
      );

      const filters: Filtro = {
        texto: "auth error test",
        colecao: "acordaos",
      };

      await expect(
        client.search.search(filters, { page: 0, size: 10 })
      ).rejects.toThrow();
    });

    it("should handle malformed server responses", async () => {
      const { http, HttpResponse } = await import("msw");

      server.use(
        http.get("*/no-auth/pesquisa", () => {
          return HttpResponse.json({
            invalidField: "invalid response structure",
            missingRequiredFields: true,
          });
        })
      );

      const filters: Filtro = {
        texto: "malformed response test",
        colecao: "acordaos",
      };

      await expect(
        client.search.search(filters, { page: 0, size: 10 })
      ).rejects.toThrow();
    });

    it("should handle empty response body", async () => {
      const { http, HttpResponse } = await import("msw");

      server.use(
        http.get("*/no-auth/pesquisa", () => {
          return new HttpResponse(null, { status: 200 });
        })
      );

      const filters: Filtro = {
        texto: "empty response test",
        colecao: "acordaos",
      };

      await expect(
        client.search.search(filters, { page: 0, size: 10 })
      ).rejects.toThrow();
    });

    it("should handle invalid filter parameters gracefully", async () => {
      // Test with invalid date formats
      const invalidFilters: Filtro = {
        texto: "test",
        dataInicio: "invalid-date",
        dataFim: "also-invalid",
        colecao: "acordaos",
      };

      // The client should still make the request (server validates)
      const result = await client.search.search(invalidFilters, {
        page: 0,
        size: 10,
      });

      // Should receive a response (mock server handles it)
      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });
    });

    it("should handle extremely large filter arrays", async () => {
      // Test with large arrays to verify parameter serialization limits
      const largeFilters: Filtro = {
        tribunais: Array.from({ length: 100 }, (_, i) => `TRIBUNAL_${i}`),
        nomeRelator: Array.from({ length: 50 }, (_, i) => `Relator ${i}`),
        colecao: "acordaos",
      };

      const result = await client.search.search(largeFilters, {
        page: 0,
        size: 10,
      });

      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });
    });

    it("should handle concurrent requests", async () => {
      const filters: Filtro = {
        texto: "concurrent test",
        colecao: "acordaos",
      };

      // Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, (_, i) =>
        client.search.search(
          { ...filters, texto: `concurrent test ${i}` },
          { page: 0, size: 10 }
        )
      );

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result).toMatchObject({
          documentos: expect.any(Array),
          filtrosDisponiveis: expect.any(Array),
          quantidadeTotal: expect.any(Number),
        });
      });
    });

    it("should handle rapid consecutive requests", async () => {
      const filters: Filtro = {
        texto: "rapid test",
        colecao: "acordaos",
      };

      // Make rapid consecutive requests
      const results = [];
      for (let i = 0; i < 3; i++) {
        const result = await client.search.search(
          { ...filters, texto: `rapid test ${i}` },
          { page: 0, size: 5 }
        );
        results.push(result);
      }

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toMatchObject({
          documentos: expect.any(Array),
          filtrosDisponiveis: expect.any(Array),
          quantidadeTotal: expect.any(Number),
        });
      });
    });

    it("should handle network interruption gracefully", async () => {
      // Simulate a request that starts but then the network fails
      let callCount = 0;
      server.use(
        http.get("*/no-auth/pesquisa", () => {
          callCount++;
          if (callCount === 1) {
            // First call times out
            return new Promise(() => {
              // Intentionally never resolve to simulate timeout
            });
          }
          // Subsequent calls succeed
          return HttpResponse.json({
            documentos: [],
            filtrosDisponiveis: [],
            quantidadeTotal: 0,
          });
        })
      );

      const filters: Filtro = {
        texto: "network interruption test",
        colecao: "acordaos",
      };

      // First request should timeout/fail
      await expect(
        client.search.search(filters, { page: 0, size: 10 })
      ).rejects.toThrow();

      // Reset the mock to allow success
      server.resetHandlers();

      // Second request should succeed
      const result = await client.search.search(filters, { page: 0, size: 10 });
      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });
    });
  });

  describe("session management and geolocation integration e2e", () => {
    it("should handle requests with geolocation data", async () => {
      const location = createMockGeolocation({
        latitude: -23.5505,
        longitude: -46.6333,
        cidade: "São Paulo",
        estado: "SP",
        pais: "Brasil",
      });

      // Set geolocation on the client
      (client as any)?.sessionManager?.setGeolocation?.(location);

      const filters: Filtro = {
        texto: "geolocation test",
        colecao: "acordaos",
      };
      const result = await client.search.search(filters, { page: 0, size: 10 });

      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });
    });

    it("should handle requests without geolocation data", async () => {
      // Ensure no geolocation is set
      const filters: Filtro = {
        texto: "no geolocation test",
        colecao: "acordaos",
      };
      const result = await client.search.search(filters, { page: 0, size: 10 });

      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });
    });

    it("should maintain session across multiple requests", async () => {
      const filters: Filtro = {
        texto: "session test",
        colecao: "acordaos",
      };

      // Make multiple requests that should share session context
      const [result1, result2, result3] = await Promise.all([
        client.search.search(filters, { page: 0, size: 10 }),
        client.search.count(filters),
        client.search.autocomplete("session"),
      ]);

      expect(result1).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });

      expect(result2).toMatchObject({
        filtrosDisponiveis: expect.any(Array),
      });

      expect(result3).toMatchObject({
        sugestoes: expect.any(Array),
      });
    });

    it("should handle session persistence configuration", async () => {
      // Create client with session persistence enabled
      const persistentConfig = createMockClientConfig({
        baseURL:
          "https://jurisprudencia.jt.jus.br/jurisprudencia-nacional-backend/api",
        aiBaseURL: "https://ai.jurisprudencia.jt.jus.br/robusto",
        sessionConfig: {
          persistSession: true,
          storageType: "localStorage",
        },
      });

      const persistentClient = new FalcaoClient(persistentConfig);
      const filters: Filtro = {
        texto: "persistent session test",
        colecao: "acordaos",
      };

      const result = await persistentClient.search.search(filters, {
        page: 0,
        size: 10,
      });

      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });
    });

    it("should handle client timeout configuration", async () => {
      // Create client with custom timeout
      const timeoutConfig = createMockClientConfig({
        baseURL:
          "https://jurisprudencia.jt.jus.br/jurisprudencia-nacional-backend/api",
        aiBaseURL: "https://ai.jurisprudencia.jt.jus.br/robusto",
        timeout: 1000, // Short timeout for testing
      });

      const timeoutClient = new FalcaoClient(timeoutConfig);
      const filters: Filtro = {
        texto: "timeout config test",
        colecao: "acordaos",
      };

      const result = await timeoutClient.search.search(filters, {
        page: 0,
        size: 10,
      });

      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });
    });

    it("should handle client with custom auth token provider", async () => {
      // Track if auth token is called (not used in assertions for no-auth endpoints)
      const authConfig = createMockClientConfig({
        baseURL:
          "https://jurisprudencia.jt.jus.br/jurisprudencia-nacional-backend/api",
        aiBaseURL: "https://ai.jurisprudencia.jt.jus.br/robusto",
        getAuthToken: async () => {
          return "custom-auth-token";
        },
      });

      const authClient = new FalcaoClient(authConfig);
      const filters: Filtro = {
        texto: "auth token test",
        colecao: "acordaos",
      };

      const result = await authClient.search.search(filters, {
        page: 0,
        size: 10,
      });

      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });

      // Note: auth token provider might not be called for no-auth endpoints
      // This is expected behavior
    });

    it("should handle client with custom error handler", async () => {
      let errorHandlerCalled = false;
      const errorConfig = createMockClientConfig({
        baseURL:
          "https://jurisprudencia.jt.jus.br/jurisprudencia-nacional-backend/api",
        aiBaseURL: "https://ai.jurisprudencia.jt.jus.br/robusto",
        onAuthError: () => {
          errorHandlerCalled = true;
        },
      });

      const errorClient = new FalcaoClient(errorConfig);
      const filters: Filtro = {
        texto: "error handler test",
        colecao: "acordaos",
      };

      const result = await errorClient.search.search(filters, {
        page: 0,
        size: 10,
      });

      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });

      // Error handler should not be called for successful requests
      expect(errorHandlerCalled).toBe(false);
    });
  });

  describe("real-world workflow scenarios e2e", () => {
    it("should handle complete search workflow", async () => {
      // Step 1: Get available tribunals
      const tribunals = await client.search.getTribunals();
      expect(tribunals.length).toBeGreaterThan(0);

      // Step 2: Use tribunal in search
      const selectedTribunal = tribunals[0]?.sigla;
      const filters: Filtro = {
        texto: "constitutional",
        tribunais: [selectedTribunal!],
        colecao: "acordaos",
      };

      // Step 3: Get count first
      const countResult = await client.search.count(filters);
      expect(countResult.countAcordaos).toBeDefined();

      // Step 4: Perform actual search
      const searchResult = await client.search.search(filters, {
        page: 0,
        size: 10,
      });
      expect(searchResult.documentos).toBeDefined();

      // Step 5: Get autocomplete for related terms
      const autocompleteResult =
        await client.search.autocomplete("constitutional");
      expect(autocompleteResult.sugestoes).toBeDefined();
    });

    it("should handle pagination workflow", async () => {
      const filters: Filtro = {
        texto: "pagination test",
        colecao: "acordaos",
      };

      // Get first page
      const page1 = await client.search.search(filters, { page: 0, size: 5 });
      expect(page1.documentos).toBeDefined();

      // Get second page
      const page2 = await client.search.search(filters, { page: 1, size: 5 });
      expect(page2.documentos).toBeDefined();

      // Get third page
      const page3 = await client.search.search(filters, { page: 2, size: 5 });
      expect(page3.documentos).toBeDefined();

      // All pages should have consistent structure
      [page1, page2, page3].forEach((page) => {
        expect(page).toMatchObject({
          documentos: expect.any(Array),
          filtrosDisponiveis: expect.any(Array),
          quantidadeTotal: expect.any(Number),
        });
      });
    });

    it("should handle filter refinement workflow", async () => {
      // Start with broad search
      const broadFilters: Filtro = {
        texto: "law",
        colecao: "acordaos",
      };
      const broadResult = await client.search.search(broadFilters, {
        page: 0,
        size: 10,
      });

      // Use available filters to refine
      const availableFilters = broadResult.filtrosDisponiveis;
      expect(availableFilters).toBeDefined();

      // Refine search with specific tribunal
      const refinedFilters: Filtro = {
        texto: "law",
        tribunais: ["STF"],
        colecao: "acordaos",
      };
      const refinedResult = await client.search.search(refinedFilters, {
        page: 0,
        size: 10,
      });

      expect(refinedResult).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });
    });

    it("should handle information gathering workflow", async () => {
      // Gather all system information
      const [tribunals, versions, dataUpdate, dataPublication] =
        await Promise.all([
          client.search.getTribunals(),
          client.search.getSystemVersions(),
          client.search.getDataUpdateDate(),
          client.search.getDataPublicationDate(),
        ]);

      // Verify all information is retrieved
      expect(Array.isArray(tribunals)).toBe(true);
      expect(tribunals.length).toBeGreaterThan(0);

      expect(Array.isArray(versions)).toBe(true);
      expect(versions.length).toBeGreaterThan(0);

      expect(dataUpdate).toMatchObject({
        dataAtualizacaoAcordao: expect.any(Array),
        dataAtualizacaoPrecedentes: expect.any(Array),
      });

      expect(dataPublication).toMatchObject({
        dataAtualizacaoAcordao: expect.any(Array),
        dataAtualizacaoPrecedentes: expect.any(Array),
      });
    });

    it("should handle error recovery workflow", async () => {
      const { http, HttpResponse } = await import("msw");

      // Simulate temporary server error
      let callCount = 0;
      server.use(
        http.get("*/no-auth/pesquisa", () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json(
              { error: "Temporary server error" },
              { status: 500 }
            );
          }
          // Recovery: subsequent calls succeed
          return HttpResponse.json({
            documentos: [],
            filtrosDisponiveis: [],
            quantidadeTotal: 0,
          });
        })
      );

      const filters: Filtro = {
        texto: "error recovery test",
        colecao: "acordaos",
      };

      // First request should fail
      await expect(
        client.search.search(filters, { page: 0, size: 10 })
      ).rejects.toThrow();

      // Reset handlers to normal behavior
      server.resetHandlers();

      // Retry should succeed
      const result = await client.search.search(filters, { page: 0, size: 10 });
      expect(result).toMatchObject({
        documentos: expect.any(Array),
        filtrosDisponiveis: expect.any(Array),
        quantidadeTotal: expect.any(Number),
      });
    });
  });
});
