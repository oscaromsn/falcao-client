import { FalcaoValidationError } from "@core/errors";
import { HttpClient } from "@core/http";
import { SessionManager } from "@core/session";
import { BaseService } from "@services/base";
import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

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

// Test implementation of BaseService
class TestService extends BaseService {
  // Expose protected methods for testing
  public async testGet<T>(
    url: string,
    schema: z.ZodType<T>,
    params?: Record<string, any>
  ) {
    return this.get(url, schema, params);
  }

  public async testPost<T>(
    url: string,
    schema: z.ZodType<T>,
    data?: any,
    config?: { params?: Record<string, any> }
  ) {
    return this.post(url, schema, data, config);
  }

  public async testPut<T>(
    url: string,
    schema: z.ZodType<T>,
    data?: any,
    config?: { params?: Record<string, any> }
  ) {
    return this.put(url, schema, data, config);
  }

  public async testDelete<T>(url: string, schema: z.ZodType<T>) {
    return this.delete(url, schema);
  }

  public testValidate<T>(data: unknown, schema: z.ZodType<T>): T {
    return this.validate(data, schema);
  }

  public testBuildArrayParams(
    params: Record<string, any>,
    arrayFields: string[]
  ): Record<string, any> {
    return this.buildArrayParams(params, arrayFields);
  }
}

describe("BaseService", () => {
  let sessionManager: SessionManager;
  let httpClient: HttpClient;
  let testService: TestService;

  beforeEach(() => {
    localStorage.clear();
    sessionManager = new SessionManager({ persistSession: false });
    httpClient = new HttpClient({
      baseURL: "https://api.test.com",
      sessionManager,
    });
    testService = new TestService(httpClient);
  });

  describe("HTTP method wrappers", () => {
    it("should make GET request with validation", async () => {
      const mockData = { message: "success" };
      const schema = z.object({ message: z.string() });

      // Mock the HTTP request
      httpClient.request = async () => mockData as any;

      const result = await testService.testGet("/test", schema);

      expect(result).toEqual(mockData);
    });

    it("should make POST request with validation", async () => {
      const mockData = { id: 1, name: "test" };
      const schema = z.object({ id: z.number(), name: z.string() });

      httpClient.request = async () => mockData as any;

      const result = await testService.testPost("/test", schema, {
        name: "test",
      });

      expect(result).toEqual(mockData);
    });

    it("should make PUT request with validation", async () => {
      const mockData = { id: 1, name: "updated" };
      const schema = z.object({ id: z.number(), name: z.string() });

      httpClient.request = async () => mockData as any;

      const result = await testService.testPut("/test/1", schema, {
        name: "updated",
      });

      expect(result).toEqual(mockData);
    });

    it("should make DELETE request with validation", async () => {
      const mockData = { success: true };
      const schema = z.object({ success: z.boolean() });

      httpClient.request = async () => mockData as any;

      const result = await testService.testDelete("/test/1", schema);

      expect(result).toEqual(mockData);
    });

    it("should pass parameters correctly to HTTP client", async () => {
      let capturedRequest: any;
      (httpClient.request as any) = async (config: any) => {
        capturedRequest = config;
        return { success: true };
      };

      const schema = z.object({ success: z.boolean() });
      const params = { page: 1, limit: 10 };

      await testService.testGet("/test", schema, params);

      expect(capturedRequest.method).toBe("GET");
      expect(capturedRequest.url).toBe("/test");
      expect(capturedRequest.params).toEqual(params);
    });

    it("should pass data correctly to POST requests", async () => {
      let capturedRequest: any;
      (httpClient.request as any) = async (config: any) => {
        capturedRequest = config;
        return { id: 1 };
      };

      const schema = z.object({ id: z.number() });
      const data = { name: "test", email: "test@example.com" };

      await testService.testPost("/test", schema, data);

      expect(capturedRequest.method).toBe("POST");
      expect(capturedRequest.data).toEqual(data);
    });
  });

  describe("validation", () => {
    it("should validate successful responses", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const validData = { name: "John", age: 30 };

      const result = testService.testValidate(validData, schema);

      expect(result).toEqual(validData);
    });

    it("should throw FalcaoValidationError for invalid responses", () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });
      const invalidData = { name: "John", age: "thirty" }; // age should be number

      expect(() => {
        testService.testValidate(invalidData, schema);
      }).toThrow(FalcaoValidationError);
    });

    it("should include ZodError details in validation error", () => {
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
      });
      const invalidData = { name: "Jo", email: "invalid-email" };

      try {
        testService.testValidate(invalidData, schema);
      } catch (error) {
        expect(error).toBeInstanceOf(FalcaoValidationError);
        expect((error as FalcaoValidationError).errors.issues).toHaveLength(2);
      }
    });

    it("should validate arrays correctly", () => {
      const schema = z.array(z.object({ id: z.number(), name: z.string() }));
      const validData = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ];

      const result = testService.testValidate(validData, schema);

      expect(result).toEqual(validData);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });
  });

  describe("buildArrayParams", () => {
    it("should convert regular arrays to comma-separated strings", () => {
      const params = {
        colecao: ["col1", "col2", "col3"],
        tribunais: ["STF", "STJ"],
        other: "unchanged",
      };
      const arrayFields = ["colecao", "tribunais"];

      const result = testService.testBuildArrayParams(params, arrayFields);

      expect(result.colecao).toBe("col1,col2,col3");
      expect(result.tribunais).toBe("STF,STJ");
      expect(result.other).toBe("unchanged");
    });

    it("should use # separator for special fields", () => {
      const params = {
        nomeRelator: ["Relator 1", "Relator 2"],
        orgaoJulgador: ["Orgao 1", "Orgao 2"],
        classeProcesso: ["ADI", "ADPF"],
        colecao: ["col1", "col2"],
      };
      const arrayFields = [
        "nomeRelator",
        "orgaoJulgador",
        "classeProcesso",
        "colecao",
      ];

      const result = testService.testBuildArrayParams(params, arrayFields);

      expect(result.nomeRelator).toBe("Relator 1#Relator 2");
      expect(result.orgaoJulgador).toBe("Orgao 1#Orgao 2");
      expect(result.classeProcesso).toBe("ADI#ADPF");
      expect(result.colecao).toBe("col1,col2");
    });

    it("should leave non-array values unchanged", () => {
      const params = {
        colecao: "single-value",
        tribunais: ["STF", "STJ"],
        text: "search text",
        page: 1,
      };
      const arrayFields = ["colecao", "tribunais"];

      const result = testService.testBuildArrayParams(params, arrayFields);

      expect(result.colecao).toBe("single-value");
      expect(result.tribunais).toBe("STF,STJ");
      expect(result.text).toBe("search text");
      expect(result.page).toBe(1);
    });

    it("should handle empty arrays", () => {
      const params = {
        colecao: [],
        tribunais: ["STF"],
        empty: [],
      };
      const arrayFields = ["colecao", "tribunais", "empty"];

      const result = testService.testBuildArrayParams(params, arrayFields);

      expect(result.colecao).toBe("");
      expect(result.tribunais).toBe("STF");
      expect(result.empty).toBe("");
    });

    it("should handle null and undefined values", () => {
      const params = {
        colecao: null,
        tribunais: undefined,
        valid: ["item1", "item2"],
      };
      const arrayFields = ["colecao", "tribunais", "valid"];

      const result = testService.testBuildArrayParams(params, arrayFields);

      expect(result.colecao).toBeNull();
      expect(result.tribunais).toBeUndefined();
      expect(result.valid).toBe("item1,item2");
    });

    it("should not modify original params object", () => {
      const originalParams = {
        colecao: ["col1", "col2"],
        other: "value",
      };
      const arrayFields = ["colecao"];

      const result = testService.testBuildArrayParams(
        originalParams,
        arrayFields
      );

      expect(originalParams.colecao).toEqual(["col1", "col2"]); // Original unchanged
      expect(result.colecao).toBe("col1,col2"); // Result modified
    });
  });

  describe("error handling", () => {
    it("should propagate HTTP client errors", async () => {
      const error = new Error("Network error");
      httpClient.request = async () => Promise.reject(error);

      const schema = z.object({ success: z.boolean() });

      await expect(testService.testGet("/test", schema)).rejects.toThrow(
        "Network error"
      );
    });

    it("should handle validation errors in HTTP responses", async () => {
      const invalidResponse = { name: 123 }; // Should be string
      httpClient.request = async () => invalidResponse as any;

      const schema = z.object({ name: z.string() });

      await expect(testService.testGet("/test", schema)).rejects.toThrow(
        FalcaoValidationError
      );
    });
  });
});
