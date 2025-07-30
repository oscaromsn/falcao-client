# Falcão API Constraints and Limitations

> **⚠️ Important**: This documentation is based on empirical testing of the live Falcão API and reflects the behavior observed on 30/07/2025.

## Table of Contents

1. [Page Size Constraints](#page-size-constraints)
2. [Filter Combination Constraints](#filter-combination-constraints) 
3. [Parameter Format Requirements](#parameter-format-requirements)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Best Practices](#best-practices)
6. [Implementation Guidelines](#implementation-guidelines)

---

## Page Size Constraints

### Anonymous Users (Non-Authenticated)

The Falcão API enforces **very strict page size limitations** for anonymous users:

#### ✅ Allowed Page Sizes
- **Size 5**: ✅ Allowed
- **Size 10**: ✅ Allowed

#### ❌ Forbidden Page Sizes  
- **Sizes 1-4**: ❌ HTTP 401 - "Seu usuário não tem autorização para realizar pesquisas com páginas de tamanho X!"
- **Sizes 6-9**: ❌ HTTP 401 - Authorization failed
- **Sizes 11+**: ❌ HTTP 401 - Authorization failed

### Key Findings

```typescript
// ONLY these page sizes work for anonymous users:
const ALLOWED_ANONYMOUS_PAGE_SIZES = [5, 10];

// All other sizes (1-4, 6-9, 11+) result in HTTP 401 errors
```

### Error Messages
When using unauthorized page sizes, the API returns:
- **Status**: HTTP 401 (Unauthorized) 
- **Message**: "Seu usuário não tem autorização para realizar pesquisas com páginas de tamanho X!"

---

## Filter Combination Constraints

### ✅ Working Filter Combinations

#### Basic Searches
```typescript
// Simple text search - Always works
{ texto: "direito", colecao: "acordaos" }

// Multiple tribunals - Works well
{ 
  texto: "trabalho", 
  tribunais: ["STF", "STJ", "TST"],
  colecao: "acordaos" 
}

// Date range filters - Works
{
  texto: "constitutional",
  dataInicio: "2024-01-01",
  dataFim: "2024-12-31", 
  colecao: "acordaos"
}
```

#### Array Parameters
```typescript
// Large arrays are surprisingly allowed
{
  texto: "decisao",
  nomeRelator: [
    "Ministro 1", "Ministro 2", ..., "Ministro 10"  // 10 items ✅
  ],
  colecao: "acordaos"
}

{
  texto: "processo", 
  tribunais: [
    "TRIBUNAL_0", "TRIBUNAL_1", ..., "TRIBUNAL_19"  // 20 items ✅
  ],
  colecao: "acordaos"
}
```

### ❌ Problematic Filter Combinations

#### Complex Multi-Parameter Combinations
```typescript
// This combination causes HTTP 412 errors:
{
  texto: "administrative procedure",
  tribunais: ["TST", "TRT1"],
  nomeRelator: ["Ministro A", "Ministro B"],
  orgaoJulgador: ["Turma 1", "Turma 2"], 
  classeProcesso: ["RR", "AIRR"],
  dataInicio: "2023-01-01",
  dataFim: "2024-12-31",
  temEmenta: "S",
  precedente: "relevante",                    // ← This seems problematic
  pesquisaSomenteNasEmentas: true,
  colecao: "acordaos"
}
// Result: HTTP 412 - Parameter validation failed
```

#### Specific Problem Parameters
```typescript
// These individual filters cause issues:
{ precedente: "relevante", colecao: "acordaos" }  // ❌ HTTP 412
{ colecao: "invalid_collection" }                 // ❌ HTTP 412
```

---

## Parameter Format Requirements

### Collection Parameter
```typescript
// ✅ CORRECT: String format
{ colecao: "acordaos" }

// ❌ WRONG: Array format (surprisingly, this actually works in practice)
{ colecao: ["acordaos"] }  // Works but not recommended
```

### Date Formats
```typescript
// ✅ CORRECT: ISO format
{
  dataInicio: "2024-01-01",
  dataFim: "2024-12-31"
}

// ❌ WRONG: Invalid formats
{
  dataInicio: "invalid-date",    // HTTP 400 error
  dataFim: "also-invalid"
}
```

### Array Parameters (Special Separators)
The API expects different separators for different array parameters:

```typescript
// When serialized, these use different separators:
tribunais: ["STF", "STJ"]           // → "STF,STJ" (comma)
nomeRelator: ["Min A", "Min B"]     // → "Min A#Min B" (hash)
orgaoJulgador: ["Org1", "Org2"]    // → "Org1#Org2" (hash)  
classeProcesso: ["RR", "AIRR"]     // → "RR#AIRR" (hash)
```

---

## Error Handling Patterns

### HTTP Status Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| **401** | Unauthorized | Invalid page size for anonymous user |
| **400** | Bad Request | Invalid date format, malformed parameters |
| **412** | Precondition Failed | Invalid filter combinations, unsupported parameters |

### Error Response Format
```typescript
// Typical error response structure:
{
  userMessage: "Seu usuário não tem autorização para realizar pesquisas com páginas de tamanho X!",
  developerMessage: ""
}
```

---

## Best Practices

### 1. Page Size Strategy
```typescript
function getSafePageSize(requestedSize: number, isAuthenticated: boolean): number {
  if (!isAuthenticated) {
    // Only 5 and 10 are allowed for anonymous users
    return requestedSize <= 5 ? 5 : 10;
  }
  // For authenticated users, larger sizes may be allowed (needs testing)
  return Math.min(requestedSize, 100);
}
```

### 2. Filter Validation
```typescript
function validateFilters(filters: Filtro): void {
  // Avoid problematic parameters
  if (filters.precedente) {
    console.warn("precedente parameter may cause HTTP 412 errors");
  }
  
  // Validate collection format
  if (Array.isArray(filters.colecao)) {
    throw new Error("colecao must be string, not array");
  }
  
  // Validate dates
  if (filters.dataInicio && !/^\d{4}-\d{2}-\d{2}$/.test(filters.dataInicio)) {
    throw new Error("dataInicio must be in YYYY-MM-DD format");
  }
}
```

### 3. Error Recovery
```typescript
async function searchWithFallback(filters: Filtro, pagination: Pagination) {
  try {
    return await client.search.search(filters, pagination);
  } catch (error: any) {
    if (error.status === 401 && pagination.size !== 5 && pagination.size !== 10) {
      // Fallback to safe page size
      console.warn(`Page size ${pagination.size} not allowed, using 10`);
      return await client.search.search(filters, { ...pagination, size: 10 });
    }
    
    if (error.status === 412) {
      // Simplify filters and retry
      const simplifiedFilters = {
        texto: filters.texto,
        colecao: filters.colecao,
        tribunais: filters.tribunais
      };
      console.warn("Complex filters failed, retrying with simplified filters");
      return await client.search.search(simplifiedFilters, pagination);
    }
    
    throw error;
  }
}
```

---

## Implementation Guidelines

### 1. Default Configuration
```typescript
// Recommended default search parameters
const DEFAULT_SEARCH_CONFIG = {
  pagination: {
    page: 0,
    size: 10  // Safe for anonymous users
  },
  filters: {
    colecao: "acordaos"  // Always required
  }
};
```

### 2. User Interface Constraints
```typescript
// Page size selector for UI
const PAGE_SIZE_OPTIONS = [
  { value: 5, label: "5 por página" },
  { value: 10, label: "10 por página" }
  // Don't offer other options for anonymous users
];
```

### 3. Filter Builder Validation
```typescript
class FilterBuilder {
  private filters: Partial<Filtro> = {};
  
  setText(texto: string): this {
    this.filters.texto = texto;
    return this;
  }
  
  setTribunals(tribunais: string[]): this {
    // Validate reasonable limits
    if (tribunais.length > 20) {
      console.warn("Large tribunal arrays may cause performance issues");
    }
    this.filters.tribunais = tribunais;
    return this;
  }
  
  setDateRange(inicio: string, fim: string): this {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(inicio) || !dateRegex.test(fim)) {
      throw new Error("Dates must be in YYYY-MM-DD format");
    }
    this.filters.dataInicio = inicio;
    this.filters.dataFim = fim;
    return this;
  }
  
  build(): Filtro {
    // Always ensure collection is set
    return {
      ...this.filters,
      colecao: this.filters.colecao || "acordaos"
    } as Filtro;
  }
}
```

---

## Testing Recommendations

### Unit Tests
```typescript
describe("API Constraints", () => {
  it("should reject invalid page sizes", async () => {
    await expect(
      client.search.search({ texto: "test", colecao: "acordaos" }, { page: 0, size: 3 })
    ).rejects.toThrow(/autorização.*páginas de tamanho/);
  });
  
  it("should accept safe page sizes", async () => {
    await expect(
      client.search.search({ texto: "test", colecao: "acordaos" }, { page: 0, size: 10 })
    ).resolves.toBeDefined();
  });
});
```

### Integration Tests
```typescript
describe("Filter Constraints", () => {
  it("should handle complex filter fallback", async () => {
    const complexFilters = { /* problematic combination */ };
    
    // Should either succeed or fail gracefully with meaningful error
    try {
      const result = await client.search.search(complexFilters, { page: 0, size: 10 });
      expect(result).toBeDefined();
    } catch (error: any) {
      expect(error.status).toBeOneOf([400, 412]);
      expect(error.message).toBeDefined();
    }
  });
});
```

---

## Summary

The Falcão API has **very specific constraints** that must be respected:

1. **Page sizes**: Only 5 and 10 work for anonymous users
2. **Filter complexity**: Avoid too many parameters in one request  
3. **Parameter formats**: Follow exact format requirements
4. **Error handling**: Always implement fallbacks for common failures

These constraints are **strictly enforced** and will cause HTTP 401/412 errors if violated. Plan your implementation accordingly and always test with real API calls.

---

*Generated on 30/07/2025 based on empirical API testing.*
