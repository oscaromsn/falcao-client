import { describe, expect, it } from "vitest";
import {
  isDocumento,
  isErrorResponse,
  isPaginatedResponse,
  toAuthToken,
  toConversationId,
  toDocumentId,
  toProcessNumber,
  toSessionId,
} from "@/types";

describe("Type utilities", () => {
  describe("branded type constructors", () => {
    it("should create SessionId", () => {
      const sessionId = toSessionId("session_123");
      expect(sessionId).toBe("session_123");
      expect(typeof sessionId).toBe("string");
    });

    it("should create DocumentId", () => {
      const documentId = toDocumentId("doc_123");
      expect(documentId).toBe("doc_123");
      expect(typeof documentId).toBe("string");
    });

    it("should create ProcessNumber", () => {
      const processNumber = toProcessNumber("12345678901234567890");
      expect(processNumber).toBe("12345678901234567890");
      expect(typeof processNumber).toBe("string");
    });

    it("should create ConversationId", () => {
      const conversationId = toConversationId("conv_123");
      expect(conversationId).toBe("conv_123");
      expect(typeof conversationId).toBe("string");
    });

    it("should create AuthToken", () => {
      const authToken = toAuthToken("token_abc123");
      expect(authToken).toBe("token_abc123");
      expect(typeof authToken).toBe("string");
    });
  });

  describe("type guards", () => {
    describe("isDocumento", () => {
      it("should return true for valid document", () => {
        const validDoc = {
          id: "doc123",
          tribunal: "STF",
          numeroProcesso: "12345678901234567890",
          tituloDecisao: "Test Decision",
        };

        expect(isDocumento(validDoc)).toBe(true);
      });

      it("should return false for invalid document", () => {
        const invalidDoc = {
          id: "doc123",
          // missing required fields
        };

        expect(isDocumento(invalidDoc)).toBe(false);
      });

      it("should return false for non-object", () => {
        expect(isDocumento("not an object")).toBe(false);
        expect(isDocumento(null)).toBe(false);
        expect(isDocumento(undefined)).toBe(false);
        expect(isDocumento(123)).toBe(false);
      });

      it("should return false for array", () => {
        expect(isDocumento([])).toBe(false);
        expect(isDocumento([{ id: "doc123" }])).toBe(false);
      });
    });

    describe("isErrorResponse", () => {
      it("should return true for error response", () => {
        const errorResponse = {
          status: 500,
          error: "Something went wrong",
          message: "Internal server error",
          timestamp: "2024-01-01T10:00:00Z",
          userMessage: "Something went wrong",
          path: "/api/test",
        };

        expect(isErrorResponse(errorResponse)).toBe(true);
      });

      it("should return true for minimal error response", () => {
        const errorResponse = {
          status: 400,
          error: "Error occurred",
          message: "Bad request",
        };

        expect(isErrorResponse(errorResponse)).toBe(true);
      });

      it("should return false for success response", () => {
        const successResponse = {
          data: { message: "success" },
          status: "ok",
        };

        expect(isErrorResponse(successResponse)).toBe(false);
      });

      it("should return false for non-object", () => {
        expect(isErrorResponse("error")).toBe(false);
        expect(isErrorResponse(null)).toBe(false);
        expect(isErrorResponse(undefined)).toBe(false);
      });
    });

    describe("isPaginatedResponse", () => {
      it("should return true for paginated response", () => {
        const paginatedResponse = {
          content: [{ id: 1 }, { id: 2 }],
          totalElements: 50,
          totalPages: 5,
          number: 1,
        };

        expect(isPaginatedResponse(paginatedResponse)).toBe(true);
      });

      it("should return true for paginated response with different data", () => {
        const paginatedResponse = {
          content: [{ id: "doc1" }, { id: "doc2" }],
          totalElements: 25,
          totalPages: 3,
          number: 2,
        };

        expect(isPaginatedResponse(paginatedResponse)).toBe(true);
      });

      it("should return false for non-paginated response", () => {
        const nonPaginatedResponse = {
          data: [{ id: 1 }],
          // missing pagination
        };

        expect(isPaginatedResponse(nonPaginatedResponse)).toBe(false);
      });

      it("should return false for invalid pagination", () => {
        const invalidResponse = {
          data: [{ id: 1 }],
          pagination: {
            currentPage: 1,
            // missing required pagination fields
          },
        };

        expect(isPaginatedResponse(invalidResponse)).toBe(false);
      });

      it("should return false for non-object", () => {
        expect(isPaginatedResponse("not paginated")).toBe(false);
        expect(isPaginatedResponse(null)).toBe(false);
        expect(isPaginatedResponse(undefined)).toBe(false);
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty strings for branded types", () => {
      expect(toSessionId("")).toBe("");
      expect(toDocumentId("")).toBe("");
      expect(toProcessNumber("")).toBe("");
      expect(toConversationId("")).toBe("");
      expect(toAuthToken("")).toBe("");
    });

    it("should handle special characters in branded types", () => {
      const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";

      expect(toSessionId(specialChars)).toBe(specialChars);
      expect(toDocumentId(specialChars)).toBe(specialChars);
      expect(toProcessNumber(specialChars)).toBe(specialChars);
      expect(toConversationId(specialChars)).toBe(specialChars);
      expect(toAuthToken(specialChars)).toBe(specialChars);
    });

    it("should handle Unicode characters in branded types", () => {
      const unicode = "测试文档ID";

      expect(toSessionId(unicode)).toBe(unicode);
      expect(toDocumentId(unicode)).toBe(unicode);
      expect(toProcessNumber(unicode)).toBe(unicode);
      expect(toConversationId(unicode)).toBe(unicode);
      expect(toAuthToken(unicode)).toBe(unicode);
    });

    it("should handle very long strings", () => {
      const longString = "a".repeat(1000);

      expect(toSessionId(longString)).toBe(longString);
      expect(toDocumentId(longString)).toBe(longString);
      expect(toProcessNumber(longString)).toBe(longString);
      expect(toConversationId(longString)).toBe(longString);
      expect(toAuthToken(longString)).toBe(longString);
    });
  });

  describe("type safety", () => {
    it("should preserve type information for branded types", () => {
      const sessionId = toSessionId("session_123");
      const documentId = toDocumentId("doc_123");

      // These should be different types even though the runtime values are strings
      expect(typeof sessionId).toBe("string");
      expect(typeof documentId).toBe("string");

      // But TypeScript should treat them as different types
      // (This is verified at compile time, not runtime)
    });

    it("should work with type guards in conditional logic", () => {
      const potentialDoc = {
        id: "doc123",
        tribunal: "STF",
        numeroProcesso: "12345678901234567890",
        tituloDecisao: "Test Decision",
      };

      if (isDocumento(potentialDoc)) {
        // Inside this block, TypeScript should know this is a Documento
        expect(potentialDoc.id).toBeDefined();
        expect(potentialDoc.tribunal).toBeDefined();
        expect(potentialDoc.numeroProcesso).toBeDefined();
        expect(potentialDoc.tituloDecisao).toBeDefined();
      }
    });

    it("should work with error response type guards", () => {
      const potentialError = {
        error: "Something went wrong",
        code: 500,
      };

      if (isErrorResponse(potentialError)) {
        // Inside this block, TypeScript should know this has an error property
        expect(potentialError.error).toBeDefined();
        expect(typeof potentialError.error).toBe("string");
      }
    });
  });
});
