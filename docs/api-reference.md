# Falcão API Documentation

**Version:** 2.12.1
**Last Updated:** July 29, 2025
**Base URL:** `https://jurisprudencia.jt.jus.br/jurisprudencia-nacional-backend`

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Authentication](#3-authentication)
4. [Common Parameters](#4-common-parameters)
5. [API Endpoints](#5-api-endpoints)
   - [5.1 Public Endpoints](#51-public-endpoints)
   - [5.2 Authenticated Endpoints](#52-authenticated-endpoints)
   - [5.3 Administrative Endpoints](#53-administrative-endpoints)
   - [5.4 AI Service Endpoints](#54-ai-service-endpoints)
6. [Data Models](#6-data-models)
7. [Error Handling](#7-error-handling)
8. [External Dependencies](#8-external-dependencies)
9. [Rate Limiting](#9-rate-limiting)
10. [Changelog](#10-changelog)

---

## 1. Introduction

The Falcão API (also known as PUJ - Pesquisa Unificada de Jurisprudência) provides programmatic access to Brazilian judicial jurisprudence data. It powers a comprehensive legal research platform used by legal professionals across Brazil.

### Key Features

- **Advanced Search**: Full-text search with boolean operators, faceted filtering, and autocomplete
- **Document Retrieval**: Access to various types of legal documents (Acórdãos, Precedentes, Sentenças, etc.)
- **User Personalization**: Save searches, favorite filters, and personalized dashboards
- **AI Integration**: Conversational AI assistant for advanced legal research
- **Notification System**: Real-time updates with geolocation tracking
- **Document Management**: PDF generation, citation creation, and authenticity validation

### API Architecture

The API follows RESTful principles and is divided into:
- **Public endpoints** (`/no-auth/*`): No authentication required
- **Authenticated endpoints**: Require JWT Bearer token
- **AI Service**: Separate microservice for conversational AI features

---

## 2. Getting Started

### Base URLs

The API uses dynamic configuration loaded from `assets/config/config.json`:

```json
{
  "api": {
    "url": "https://jurisprudencia.jt.jus.br/jurisprudencia-nacional-backend",
    "urlIA": "https://ai.jurisprudencia.jt.jus.br/robusto"
  }
}
```

### Environment Detection

The API automatically detects the environment based on URL patterns:
- Production: Default settings
- Development: URLs containing `desenvolvimento` or `-des`
- Staging: URLs containing `homologacao` or `-hml`

### Request Format

- **Content-Type**: `application/json` (default for POST/PUT requests)
- **Accept**: `application/json`
- **Encoding**: UTF-8

---

## 3. Authentication

### OAuth 2.0 Bearer Token

Protected endpoints require a JWT Bearer token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Token Management

- Tokens are obtained through the authentication service (login flow)
- The client automatically attaches tokens to requests for protected endpoints
- Token expiration is handled by the authentication service

### Public vs Protected Endpoints

| Endpoint Pattern | Authentication Required |
|-----------------|------------------------|
| `/no-auth/*` | No |
| `/notificacoes` | Yes |
| `/perfil/*` | Yes |
| `/pesquisasFavoritas/*` | Yes |
| `/statusCache/*` | Yes (Admin role) |
| `/logAcesso/*` | Yes |

---

## 4. Common Parameters

### 4.1 Session Parameters

All API requests include session tracking parameters:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `sessionId` | string | Unique session identifier (format: `_[random]`) | Yes |
| `juristkn` | string | Security token (14-char MD5 substring) | Yes |

### 4.2 Geolocation Parameters

Location data included in most requests for analytics:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `latitude` | number | User's geographical latitude | Yes |
| `longitude` | number | User's geographical longitude | Yes |
| `cidade` | string | User's city | No |
| `estado` | string | User's state/region | No |
| `pais` | string | User's country (ISO code) | No |

### 4.3 Security Token Generation

The `juristkn` is generated using:
```javascript
MD5(sessionId + "T9!juris#F4LKN").substring(3, 17)
```

---

## 5. API Endpoints

## 5.1 Public Endpoints

### 5.1.1 Search API

#### Search Documents

```http
GET /no-auth/pesquisa
```

Performs a comprehensive search across all document collections.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `texto` | string | Search query (supports boolean operators) | `"horas extras" +noturno` |
| `colecao` | string[] | Document collections to search | `acordaos,precedentes` |
| `tribunais` | string[] | Court identifiers | `TST,TRT1,TRT9` |
| `precedente` | string | Specific precedent identifier | `SUM-437` |
| `temEmenta` | string | Filter by ementa presence | `S` or `N` |
| `diasPesquisa` | number | Quick date filter (days ago) | `7` |
| `dataInicio` | string | Start date (YYYY-MM-DD) | `2024-01-01` |
| `dataFim` | string | End date (YYYY-MM-DD) | `2024-12-31` |
| `nomeRelator` | string[] | Judge names (# separated) | `João Silva#Maria Santos` |
| `orgaoJulgador` | string[] | Judging bodies (# separated) | `1ª Turma#2ª Turma` |
| `classeProcesso` | string[] | Process classes (# separated) | `RR#AIRR` |
| `tipoPrecedente` | string | Precedent type | `J` (Julgados) or `N` (Não julgados) |
| `filtroRapidoData` | string | Quick date filter preset | `Ultimos7Dias` |
| `pesquisaSomenteNasEmentas` | boolean | Search only in summaries | `true` |
| `verTodosPrecedentes` | boolean | Show all precedents | `false` |
| `page` | number | Page number (0-indexed) | `0` |
| `size` | number | Results per page | `20` |

**Response:**

```json
{
  "documentos": [
    {
      "id": "123456",
      "tribunal": "TST",
      "numeroProcesso": "1234567-89.2024.5.00.0000",
      "tituloDecisao": "RECURSO DE REVISTA - HORAS EXTRAS",
      "ementa": "HORAS EXTRAS. TRABALHO NOTURNO...",
      "relator": "Min. João Silva",
      "dataJulgamento": "2024-06-15",
      "orgaoJulgador": "3ª Turma",
      "classeProcessual": "Recurso de Revista"
    }
  ],
  "filtrosDisponiveis": [
    {
      "nomeDoFiltro": "tribunal",
      "nomeWeb": "Tribunal",
      "ordem": 1,
      "valoresFiltro": [
        {
          "valor": "TST",
          "quantidade": 1234,
          "valorWeb": "Tribunal Superior do Trabalho"
        }
      ]
    }
  ],
  "quantidadeTotal": 5678,
  "temasTopFive": [
    {
      "id": "tema-123",
      "titulo": "Tema relacionado",
      "descricao": "Descrição do tema"
    }
  ]
}
```

#### Count Documents

```http
GET /no-auth/pesquisa/count
```

Returns document counts for each collection matching the search criteria.

**Query Parameters:** Same as search endpoint (excluding pagination)

**Response:**

```json
{
  "filtrosDisponiveis": [
    {
      "nomeDoFiltro": "colecao",
      "nomeWeb": "Tipo de Documento",
      "ordem": 0,
      "valoresFiltro": [
        {
          "valor": "acordaos",
          "quantidade": 3456,
          "valorWeb": "Acórdãos"
        },
        {
          "valor": "precedentes",
          "quantidade": 234,
          "valorWeb": "Precedentes"
        }
      ]
    }
  ]
}
```

#### Autocomplete Suggestions

```http
GET /no-auth/autocompletar
```

Provides search term suggestions for the autocomplete feature.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `texto` | string | Partial search term |

**Response:**

```json
{
  "sugestoes": [
    "horas extras",
    "horas extras noturnas",
    "horas extras habituais"
  ],
  "queriesRelated": [
    {
      "queryString": "horas extras",
      "queryRelated": ["adicional noturno", "intervalo intrajornada"]
    }
  ]
}
```

### 5.1.2 Document Retrieval

#### Get Specific Document

Multiple endpoints for different document types:

```http
GET /no-auth/pesquisa/acordaos/{tribunal}/{id}
GET /no-auth/pesquisa/precedentes/{tribunal}/{id}
GET /no-auth/pesquisa/precedentesBNP/{tribunal}/{id}
GET /no-auth/pesquisa/recursorevista/{tribunal}/{id}
GET /no-auth/pesquisa/sentencas/{tribunal}/{id}
GET /no-auth/pesquisa/decisoesmonocraticas/{tribunal}/{id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tribunal` | string | Court identifier (e.g., TST, TRT1) |
| `id` | string | Document unique identifier |

**Response:**

```json
{
  "documentos": [
    {
      "id": "123456",
      "tribunal": "TST",
      "numeroProcesso": "1234567-89.2024.5.00.0000",
      "tituloDecisao": "RECURSO DE REVISTA - HORAS EXTRAS",
      "textoCompleto": "Inteiro teor do documento...",
      "ementa": "Ementa do documento...",
      "relator": "Min. João Silva",
      "dataJulgamento": "2024-06-15",
      "orgaoJulgador": "3ª Turma",
      "classeProcessual": "Recurso de Revista",
      // Additional fields specific to document type
    }
  ]
}
```

### 5.1.3 Document Actions

#### Copy Full Text

```http
POST /no-auth/pesquisa/copiarInteiroTeor
```

Logs the action of copying a document's full text and returns the text.

**Request Body:**

```json
{
  "documento": {
    "idDocumento": "123456",
    "tipoDocumento": "acordaos",
    "tribunal": "TST"
  },
  "indiceItemSelecionado": 0,
  "numeroPagina": 0,
  "tamanhoPagina": 20,
  "top5": false
}
```

**Response:**

```json
{
  "texto": "Inteiro teor do documento..."
}
```

#### Generate Citation

```http
POST /no-auth/pesquisa/citarDecisao
```

Generates an academic citation for a document.

**Request Body:** Same as Copy Full Text

**Response:**

```json
{
  "citacao": "BRASIL. Tribunal Superior do Trabalho. Recurso de Revista nº 1234567-89.2024.5.00.0000. Relator: Min. João Silva. Brasília, 15 de junho de 2024. Disponível em: https://jurisprudencia.jt.jus.br/..."
}
```

#### Additional Document Actions

Similar endpoints for logging user actions:
- `POST /no-auth/pesquisa/abrirInteiroTeor` - Log opening full text
- `POST /no-auth/pesquisa/copiarDecisao` - Log copying decision text

### 5.1.4 System Information

#### Get Tribunals List

```http
GET /no-auth/informacao/tribunais
```

Returns a list of all available courts in the system.

**Response:**

```json
[
  {
    "sigla": "TST",
    "nome": "Tribunal Superior do Trabalho"
  },
  {
    "sigla": "TRT1",
    "nome": "Tribunal Regional do Trabalho da 1ª Região"
  }
]
```

#### Get System Version

```http
GET /no-auth/informacao
```

Returns system version and update information.

**Response:**

```json
{
  "versao": "2.12.1",
  "dataAtualizacao": "2025-07-28T00:00:00Z",
  "ultimaAtualizacaoDados": "2025-07-29T03:00:00Z"
}
```

### 5.1.5 PDF Services

#### Generate PDF

```http
GET /no-auth/pdfInteiroTeor
```

Generates a PDF document with authenticity code.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tribunal` | string | Court identifier |
| `id` | string | Document ID |
| `tipo` | string | Document type |

**Response:** Binary PDF data

#### Validate PDF Authenticity

```http
POST /no-auth/pdfInteiroTeor/validar
```

Validates an authenticity code from a generated PDF.

**Request Body:**

```json
{
  "codigoAutenticidade": "ABC123DEF456"
}
```

**Response:**

```json
{
  "valido": true,
  "documento": {
    "tribunal": "TST",
    "numeroProcesso": "1234567-89.2024.5.00.0000",
    "dataGeracao": "2024-06-15T10:30:00Z"
  }
}
```

### 5.1.6 Notifications

#### Get Public Notifications

```http
GET /no-auth/notificacoes
```

Retrieves public system notifications.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (0-indexed) |
| `size` | number | Notifications per page |

**Response:**

```json
[
  {
    "id": 101,
    "titulo": "Manutenção Programada",
    "descricao": "O sistema estará em manutenção no próximo sábado das 00:00 às 06:00",
    "dataCadastro": "2025-07-28T10:00:00Z",
    "lido": false
  }
]
```

## 5.2 Authenticated Endpoints

### 5.2.1 User Profile

#### Get User Profile

```http
GET /perfil
```

**Headers:**
```http
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "user-123",
  "nome": "João Silva",
  "email": "joao.silva@example.com",
  "utilizaIARobusto": true,
  "configuracoes": {
    "resultadosPorPagina": 20,
    "abrirDocumentosNovaAba": true
  }
}
```

#### Get Favorite Tribunals

```http
GET /perfil/tribunaisFavoritos
```

**Response:**

```json
[
  {
    "sigla": "TST",
    "nome": "Tribunal Superior do Trabalho"
  },
  {
    "sigla": "TRT9",
    "nome": "Tribunal Regional do Trabalho da 9ª Região"
  }
]
```

#### Update Favorite Tribunals

```http
POST /perfil/tribunaisFavoritos
```

**Request Body:**

```json
{
  "tribunais": [
    {
      "sigla": "TST",
      "nome": "Tribunal Superior do Trabalho"
    }
  ],
  "requisicao": {
    "latitude": -23.5505,
    "longitude": -46.6333,
    "cidade": "São Paulo",
    "estado": "SP",
    "pais": "BR"
  }
}
```

#### Similar Endpoints

- `GET/POST /perfil/orgaosJulgadoresFavoritos` - Favorite judging bodies
- `GET/POST /perfil/magistradosFavoritos` - Favorite judges

### 5.2.2 Saved Searches

#### Get Saved Searches

```http
GET /pesquisasFavoritas
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `size` | number | Results per page |

**Response:**

```json
{
  "content": [
    {
      "id": "search-123",
      "titulo": "Horas Extras TST 2024",
      "dataCriacao": "2024-06-01T10:00:00Z",
      "filtro": {
        "texto": "horas extras",
        "tribunais": ["TST"],
        "dataInicio": "2024-01-01",
        "dataFim": "2024-12-31"
      }
    }
  ],
  "totalElements": 15,
  "totalPages": 2,
  "number": 0
}
```

#### Save Search

```http
POST /pesquisasFavoritas
```

**Request Body:**

```json
{
  "pesquisaFavorita": {
    "titulo": "Minha Pesquisa Salva"
  },
  "filtro": {
    "texto": "danos morais",
    "tribunais": ["TST", "TRT9"],
    "temEmenta": "S"
  },
  "requisicao": {
    "latitude": -23.5505,
    "longitude": -46.6333,
    "cidade": "São Paulo",
    "estado": "SP",
    "pais": "BR"
  }
}
```

#### Delete Saved Search

```http
DELETE /pesquisasFavoritas/{id}
```

### 5.2.3 User Notifications

#### Mark Notification as Read

```http
POST /notificacoes
```

**Request Body:**

```json
{
  "id": 101,
  "titulo": "Notificação",
  "descricao": "Descrição da notificação",
  "dataCadastro": "2025-07-28T10:00:00Z",
  "lido": true,
  "requisicao": {
    "latitude": -25.4284,
    "longitude": -49.2733,
    "cidade": "Curitiba",
    "estado": "Paraná",
    "pais": "Brasil"
  }
}
```

**Note:** The geolocation data in `requisicao` is captured when the user reads the notification.

### 5.2.4 Usage Analytics

#### Get Word Cloud Data

```http
GET /logAcesso/nuvemPalavras
```

Returns trending search terms for the word cloud visualization.

**Response:**

```json
[
  {
    "text": "danos morais",
    "weight": 500
  },
  {
    "text": "horas extras",
    "weight": 450
  },
  {
    "text": "vínculo empregatício",
    "weight": 400
  }
]
```

#### Get User Statistics

```http
GET /logAcesso/estatisticas
```

**Response:**

```json
{
  "totalPesquisas": 1234,
  "documentosVisualizados": 567,
  "citacoesGeradas": 89,
  "ranking": 42,
  "totalUsuarios": 5000
}
```

## 5.3 Administrative Endpoints

### 5.3.1 Cache Management

#### Get Cache Status

```http
GET /statusCache
```

**Authorization:** Requires admin role

**Response:**

```json
[
  {
    "nome": "SearchCache",
    "grupo": "Pesquisa",
    "tamanho": 1048576,
    "totalEmUso": 524288,
    "totalBuscadoNoCache": 15000,
    "percentualAcessoCache": 85.5,
    "totalBuscadoForaDoCache": 2500,
    "percentualForaDoCache": 14.5
  }
]
```

#### Clear Cache

```http
PUT /statusCache/{cacheName}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `cacheName` | string | Name of the cache to clear |

**Response:** `204 No Content`

## 5.4 AI Service Endpoints

The AI service ("Robusto") uses a separate base URL configured in `api.urlIA`.

### Initialize Conversation

```http
POST {AI_BASE_URL}/api/v1/conversation
```

Creates a new conversation context for the AI assistant.

**Request Body:**

```json
{
  "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",
  "title": "Pesquisa: Horas Extras (250 documentos)",
  "preset_context": "/no-auth/pesquisa?texto=horas%20extras&size=250"
}
```

**Response:**

```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Display Conversation

After creating a conversation, display it in an iframe:

```
{AI_BASE_URL}/conversation/{conversationId}/incontext
```

---

## 6. Data Models

### 6.1 Core Models

#### Documento (Document)

Base model for all document types:

```typescript
interface Documento {
  id: string | number;
  tribunal: string;
  numeroProcesso: string;
  tituloDecisao: string;
  ementa?: string;
  textoCompleto?: string;
  relator?: string;
  dataJulgamento?: string;
  orgaoJulgador?: string;
  classeProcessual?: string;
  siglaClasseProcesso?: string;
  // Additional fields vary by document type
}
```

#### Filtro (Search Filter)

```typescript
interface Filtro {
  texto?: string;
  colecao?: string[];
  tribunais?: string[];
  precedente?: string;
  temEmenta?: string;
  diasPesquisa?: number;
  dataInicio?: string;
  dataFim?: string;
  nomeRelator?: string[];
  orgaoJulgador?: string[];
  classeProcesso?: string[];
  tipoPrecedente?: 'J' | 'N';
  filtroRapidoData?: string;
  pesquisaSomenteNasEmentas?: boolean;
  verTodosPrecedentes?: boolean;
}
```

#### FiltroDisponivel (Available Filter)

```typescript
interface FiltroDisponivel {
  nomeDoFiltro: string;
  nomeWeb: string;
  ordem: number;
  valoresFiltro: ValorFiltro[];
}

interface ValorFiltro {
  valor: string;
  quantidade: number;
  valorWeb?: string;
  valorBalao?: string;
}
```

#### Notification

```typescript
interface Notification {
  id: number;
  titulo: string;
  descricao: string;
  dataCadastro: string; // ISO 8601
  lido: boolean;
}
```

#### RequisicaoForm (Geolocation Data)

```typescript
interface RequisicaoForm {
  latitude: number;
  longitude: number;
  cidade?: string;
  estado?: string;
  pais?: string;
}
```

### 6.2 Request/Response Models

#### SearchResponse

```typescript
interface SearchResponse {
  documentos: Documento[];
  filtrosDisponiveis: FiltroDisponivel[];
  quantidadeTotal: number;
  temasTopFive?: Documento[];
}
```

#### CountResponse

```typescript
interface CountResponse {
  filtrosDisponiveis: FiltroDisponivel[];
}
```

#### AutocompleteResponse

```typescript
interface AutocompleteResponse {
  sugestoes: string[];
  queriesRelated?: {
    queryString: string;
    queryRelated: string[];
  }[];
}
```

#### AcaoBotaoForm (User Action)

```typescript
interface AcaoBotaoForm {
  documento: {
    idDocumento: string;
    tipoDocumento: string;
    tribunal: string;
  };
  urlEncurtador?: string;
  indiceItemSelecionado: number;
  numeroPagina: number;
  tamanhoPagina: number;
  top5: boolean;
}
```

---

## 7. Error Handling

### HTTP Status Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| `200` | Success | Request processed successfully |
| `204` | No Content | Successful request with no response body |
| `400` | Bad Request | Invalid parameters or request format |
| `401` | Unauthorized | Missing or invalid authentication token |
| `403` | Forbidden | Valid token but insufficient permissions |
| `404` | Not Found | Resource not found |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side error |

### Error Response Format

```json
{
  "timestamp": "2025-07-29T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid search parameters",
  "userMessage": "Por favor, verifique os parâmetros de busca e tente novamente.",
  "path": "/no-auth/pesquisa"
}
```

### Client-Side Error Handling

The frontend implements specific handling for:
- **429 Rate Limiting**: Shows user-friendly message about request limits
- **401/403 Authentication**: Redirects to login page
- **Network Errors**: Displays offline message

---

## 8. External Dependencies

### OpenStreetMap Nominatim API

The application uses Nominatim for reverse geocoding:

```http
GET https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json
```

**Important Notes:**
- This is a free, public service with usage limits
- Rate limiting applies (max 1 request/second)
- Should not be used for commercial high-volume applications
- Consider implementing caching (7-day cache implemented in frontend)

---

## 9. Rate Limiting

### Limits

| Endpoint Type | Requests per Minute | Requests per Hour |
|--------------|-------------------|------------------|
| Public Search | 60 | 1000 |
| Authenticated | 120 | 2000 |
| AI Service | 10 | 100 |

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1627890000
```

### Handling Rate Limits

When rate limited, the API returns:
- Status: `429 Too Many Requests`
- Body: Error message with retry information
- Header: `Retry-After` with seconds to wait

---

## 10. Changelog

### Version 2.12.1 (Current)
- Added AI service integration ("Robusto")
- Enhanced geolocation tracking for notifications
- Improved search performance with faceted filtering
- Added PDF generation with authenticity codes

### Version 2.11.0
- Introduced saved searches functionality
- Added user dashboard with statistics
- Implemented word cloud for trending searches

### Version 2.10.0
- Initial public API release
- Basic search and document retrieval
- User authentication and profile management

---

## Appendix A: Search Operators

The search API supports advanced query syntax:

| Operator | Description | Example |
|----------|-------------|---------|
| `" "` | Exact phrase | `"danos morais"` |
| `+` | Mandatory term | `+horas +extras` |
| `-` | Exclude term | `assédio -moral` |
| `AND` | Both terms required | `horas AND extras` |
| `OR` | Either term | `TST OR TRT` |
| `( )` | Grouping | `(horas OR jornada) AND extras` |

## Appendix B: Quick Date Filters

Available values for `filtroRapidoData`:

| Value | Description |
|-------|-------------|
| `Hoje` | Today only |
| `Ultimos7Dias` | Last 7 days |
| `Ultimos30Dias` | Last 30 days |
| `Ultimos90Dias` | Last 90 days |
| `UltimoAno` | Last 365 days |
| `Personalizado` | Use dataInicio/dataFim |

## Appendix C: Document Collections

Available values for `colecao[]`:

| Value | Description |
|-------|-------------|
| `acordaos` | Acórdãos (Judgments) |
| `precedentes` | Precedentes (Precedents) |
| `sentencas` | Sentenças (Sentences) |
| `decisoesmonocraticas` | Decisões Monocráticas |
| `recursorevista` | Recursos de Revista |
| `precedentesBNP` | Banco Nacional de Precedentes |
