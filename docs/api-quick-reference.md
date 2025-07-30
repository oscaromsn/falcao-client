# Falcão API Quick Reference

## Page Sizes (Anonymous Users)
- ✅ **5, 10** - Allowed
- ❌ **1-4, 6-9, 11+** - HTTP 401 error

## Safe Filter Patterns
```typescript
// ✅ Basic search
{ texto: "search term", colecao: "acordaos" }

// ✅ With tribunals 
{ texto: "term", tribunais: ["STF", "STJ"], colecao: "acordaos" }

// ✅ With dates
{ texto: "term", dataInicio: "2024-01-01", dataFim: "2024-12-31", colecao: "acordaos" }
```

## Problematic Patterns
```typescript
// ❌ Complex combinations with precedente
{ precedente: "relevante", /* other filters */ }  // HTTP 412

// ❌ Invalid page sizes
{ page: 0, size: 3 }  // HTTP 401
```

## Error Recovery
```typescript
// Always fallback to safe page sizes
const safeSize = [5, 10].includes(requestedSize) ? requestedSize : 10;
```
