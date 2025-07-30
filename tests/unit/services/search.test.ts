import { HttpClient } from "@core/http";
import { SessionManager } from "@core/session";
import { SearchService } from "@services/search";
import { beforeEach, describe, expect, it } from "vitest";
import { createMockSearchResponse } from "../../utils/test-helpers";

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

describe("SearchService", () => {
  let sessionManager: SessionManager;
  let httpClient: HttpClient;
  let searchService: SearchService;

  beforeEach(() => {
    localStorage.clear();
    sessionManager = new SessionManager({ persistSession: false });
    httpClient = new HttpClient({
      baseURL: "https://api.test.com",
      sessionManager,
    });
    searchService = new SearchService(httpClient);
  });

  describe("search", () => {
    it("should perform search with filters and pagination", async () => {
      const mockResponse = createMockSearchResponse();

      httpClient.request = async (config) => {
        expect(config.method).toBe("GET");
        expect(config.url).toBe("/no-auth/pesquisa");
        return mockResponse;
      };

      const filters = {
        texto: "constitutional law",
        tribunais: ["STF", "STJ"],
        dataInicio: "2024-01-01",
        dataFim: "2024-12-31",
      };

      const pagination = {
        page: 1,
        size: 10,
      };

      const result = await searchService.search(filters, pagination);

      expect(result).toEqual(mockResponse);
      expect(result.documentos).toHaveLength(1);
      expect(result.documentos[0]?.tituloDecisao).toBe("Test Document Title");
    });

    it("should build array parameters correctly for search", async () => {
      let capturedParams: any;
      (httpClient.request as any) = async (config: any) => {
        capturedParams = config.params;
        return createMockSearchResponse();
      };

      const filters = {
        colecao: ["colecao1", "colecao2"],
        tribunais: ["STF", "STJ"],
        nomeRelator: ["Relator 1", "Relator 2"],
        orgaoJulgador: ["Orgao 1", "Orgao 2"],
        classeProcesso: ["ADI", "ADPF"],
      };

      const pagination = { page: 1, size: 10 };

      await searchService.search(filters, pagination);

      // Check that array fields are properly converted
      expect(capturedParams.colecao).toBe("colecao1,colecao2");
      expect(capturedParams.tribunais).toBe("STF,STJ");
      expect(capturedParams.nomeRelator).toBe("Relator 1#Relator 2");
      expect(capturedParams.orgaoJulgador).toBe("Orgao 1#Orgao 2");
      expect(capturedParams.classeProcesso).toBe("ADI#ADPF");

      // Check pagination params
      expect(capturedParams.page).toBe(1);
      expect(capturedParams.size).toBe(10);
    });

    it("should handle empty search results", async () => {
      const emptyResponse = createMockSearchResponse({
        documentos: [],
        quantidadeTotal: 0,
      });

      httpClient.request = async () => emptyResponse;

      const result = await searchService.search({}, { page: 1, size: 10 });

      expect(result.documentos).toHaveLength(0);
      expect(result.quantidadeTotal).toBe(0);
    });
  });

  describe("count", () => {
    it("should get search result count", async () => {
      const mockCountResponse = {
        filtrosDisponiveis: [
          {
            nomeDoFiltro: "tribunal",
            nomeWeb: "Tribunal",
            ordem: 1,
            valoresFiltro: [
              {
                valor: "STF",
                quantidade: 150,
                valorWeb: "Supremo Tribunal Federal",
                valorBalao: "STF",
              },
            ],
          },
        ],
      };

      (httpClient.request as any) = async (config: any) => {
        expect(config.method).toBe("GET");
        expect(config.url).toBe("/no-auth/pesquisa/count");
        return mockCountResponse;
      };

      const filters = { texto: "constitutional law" };

      const result = await searchService.count(filters);

      expect(result).toEqual(mockCountResponse);
      expect(result.filtrosDisponiveis).toHaveLength(1);
      expect(result.filtrosDisponiveis[0]?.valoresFiltro[0]?.quantidade).toBe(
        150
      );
    });

    it("should apply array parameter transformation for count", async () => {
      let capturedParams: any;
      (httpClient.request as any) = async (config: any) => {
        capturedParams = config.params;
        return {
          filtrosDisponiveis: [
            {
              nomeDoFiltro: "tribunal",
              nomeWeb: "Tribunal",
              ordem: 1,
              valoresFiltro: [
                {
                  valor: "STF",
                  quantidade: 100,
                  valorWeb: "Supremo Tribunal Federal",
                  valorBalao: "STF",
                },
              ],
            },
          ],
        };
      };

      const filters = {
        tribunais: ["STF", "STJ"],
        nomeRelator: ["Relator 1", "Relator 2"],
      };

      await searchService.count(filters);

      expect(capturedParams.tribunais).toBe("STF,STJ");
      expect(capturedParams.nomeRelator).toBe("Relator 1#Relator 2");
    });
  });

  describe("autocomplete", () => {
    it("should get autocomplete suggestions", async () => {
      const mockResponse = {
        sugestoes: [
          "constitutional law",
          "constitutional amendment",
          "constitutional court",
        ],
        queriesRelated: [],
      };

      (httpClient.request as any) = async (config: any) => {
        expect(config.method).toBe("GET");
        expect(config.url).toBe("/no-auth/autocompletar");
        expect(config.params.texto).toBe("constitutional");
        return mockResponse;
      };

      const result = await searchService.autocomplete("constitutional");

      expect(result).toEqual(mockResponse);
      expect(result.sugestoes).toHaveLength(3);
      expect(result.sugestoes[0]).toBe("constitutional law");
    });

    it("should handle empty autocomplete query", async () => {
      const mockResponse = { sugestoes: [], queriesRelated: [] };

      httpClient.request = async () => mockResponse as any;

      const result = await searchService.autocomplete("");

      expect(result.sugestoes).toHaveLength(0);
    });
  });

  describe("getTribunals", () => {
    it("should get list of available tribunals", async () => {
      const mockTribunals = [
        { sigla: "STF", nome: "Supremo Tribunal Federal" },
        { sigla: "STJ", nome: "Superior Tribunal de Justiça" },
        { sigla: "TST", nome: "Tribunal Superior do Trabalho" },
      ];

      (httpClient.request as any) = async (config: any) => {
        expect(config.method).toBe("GET");
        expect(config.url).toBe("/no-auth/informacao/tribunais");
        return mockTribunals;
      };

      const result = await searchService.getTribunals();

      expect(result).toEqual(mockTribunals);
      expect(result).toHaveLength(3);
      expect(result[0]?.sigla).toBe("STF");
    });
  });

  describe("getDataPublicationDate", () => {
    it("should get publication date information", async () => {
      const mockDataPub = {
        dataPublicacao: "2024-01-15",
        fonte: "Official Source",
      };

      (httpClient.request as any) = async (config: any) => {
        expect(config.method).toBe("GET");
        expect(config.url).toBe("/no-auth/informacao/dataPublicacaoDados");
        return mockDataPub;
      };

      const result = await searchService.getDataPublicationDate();

      expect(result).toEqual(mockDataPub);
      expect(result.dataPublicacao).toBe("2024-01-15");
    });
  });

  describe("getDataUpdateDate", () => {
    it("should get update date information", async () => {
      const mockDataUpdate = {
        dataIndexacao: "2024-01-15",
        ultimaAtualizacao: "2024-01-15T10:00:00Z",
      };

      (httpClient.request as any) = async (config: any) => {
        expect(config.method).toBe("GET");
        expect(config.url).toBe("/no-auth/informacao/dataIndexacaoDados");
        return mockDataUpdate;
      };

      const result = await searchService.getDataUpdateDate();

      expect(result).toEqual(mockDataUpdate);
      expect(result.dataIndexacao).toBe("2024-01-15");
    });
  });

  describe("getSystemVersions", () => {
    it("should get system version information", async () => {
      const mockVersions = {
        versoes: [
          {
            versao: "1.2.3",
            dataLancamento: "2024-01-15",
            descricao: "Falcão Client version 1.2.3",
          },
        ],
      };

      (httpClient.request as any) = async (config: any) => {
        expect(config.method).toBe("GET");
        expect(config.url).toBe("/no-auth/informacao/versao");
        return mockVersions;
      };

      const result = await searchService.getSystemVersions();

      expect(result).toEqual(mockVersions);
      expect(result.versoes).toHaveLength(1);
      expect(result.versoes[0]?.versao).toBe("1.2.3");
    });
  });

  describe("error handling", () => {
    it("should handle network errors", async () => {
      const networkError = new Error("Network connection failed");
      httpClient.request = async () => Promise.reject(networkError);

      await expect(
        searchService.search({}, { page: 1, size: 10 })
      ).rejects.toThrow("Network connection failed");
    });

    it("should handle validation errors", async () => {
      // Return invalid response that doesn't match schema
      httpClient.request = async () => ({ invalidField: "invalid" }) as any;

      await expect(
        searchService.search({}, { page: 1, size: 10 })
      ).rejects.toThrow(); // Should throw validation error
    });
  });

  describe("parameter handling", () => {
    it("should preserve non-array parameters", async () => {
      let capturedParams: any;
      (httpClient.request as any) = async (config: any) => {
        capturedParams = config.params;
        return createMockSearchResponse();
      };

      const filters = {
        texto: "search text",
        dataInicio: "2024-01-01",
        dataFim: "2024-12-31",
        tribunais: ["STF"], // This should be converted
      };

      await searchService.search(filters, { page: 2, size: 20 });

      expect(capturedParams.texto).toBe("search text");
      expect(capturedParams.dataInicio).toBe("2024-01-01");
      expect(capturedParams.dataFim).toBe("2024-12-31");
      expect(capturedParams.tribunais).toBe("STF");
      expect(capturedParams.page).toBe(2);
      expect(capturedParams.size).toBe(20);
    });
  });
});
