# Falcão API Client

<div align="center">
  <img src="https://raw.githubusercontent.com/user-attachments/assets/b2a759e1-7d9a-4e2b-8a1a-c454e99f4937/falcao-logo-dark.png#gh-dark-mode-only" alt="Falcão Logo Dark" width="400">
  <img src="https://raw.githubusercontent.com/user-attachments/assets/c510842e-13ca-49d7-832f-76342898b183/falcao-logo-light.png#gh-light-mode-only" alt="Falcão Logo Light" width="400">
</div>

<p align="center">
  <strong>A modern, type-safe, and robust TypeScript client for the Falcão Jurisprudence Search API.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@falcao/api-client"><img src="https://img.shields.io/npm/v/@falcao/api-client.svg?style=flat-square&color=CB3837" alt="NPM Version"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@falcao/api-client.svg?style=flat-square&color=blue" alt="License"></a>
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue.svg?style=flat-square" alt="TypeScript Strict">
  <img src="https://img.shields.io/badge/Powered%20by-Zod-3266B0.svg?style=flat-square" alt="Powered by Zod">
  <img src="https://img.shields.io/badge/runtime-Bun-black.svg?style=flat-square" alt="Bun Runtime">
</p>

---

The Falcão API Client provides a comprehensive, developer-friendly interface for interacting with the **Falcão API (PUJ - Pesquisa Unificada de Jurisprudência)**, the programmatic gateway to Brazilian judicial jurisprudence data.

This library abstracts away the complexities of direct HTTP requests, authentication, session management, and response parsing, allowing you to build powerful legal tech applications with confidence and speed. It is built with **TypeScript** and **Zod** to guarantee end-to-end type safety from the API response to your application code.

## ✨ Key Features

-   **✅ End-to-End Type Safety**: Combines strict TypeScript with Zod schemas to ensure all API interactions are fully typed and validated at runtime.
-   **? Fluent, Discoverable API**: A clean, namespaced client (`client.search`, `client.user`, etc.) makes the API intuitive and easy to use.
-   **? Automated Session Management**: Automatically handles the `sessionId` and `juristkn` security tokens required by the Falcão API.
-   **?️ Built-in Authentication Handling**: Seamlessly attaches JWT tokens to protected requests and provides hooks for handling authentication errors.
-   **? Robust Error Handling**: Provides custom, typed error classes (`FalcaoValidationError`, `FalcaoAuthenticationError`, etc.) for predictable error management.
-   **?️ AI Service Integration**: Includes dedicated methods for interacting with the "Robusto" AI conversational search service.
-   **? Modern Toolchain**: Developed with high-performance tools like Bun and Biome for top-tier code quality.
-   **? Comprehensive Coverage**: Implements the full range of API features, including search, document retrieval, PDF generation, user profiles, and administrative functions.

## ? Prerequisites

-   Node.js (`>= 18.0`) or Bun (`>= 1.0`)
-   TypeScript (`>= 5.0`)

## ? Installation

You can install the client using your preferred package manager:

```bash
# With Bun
bun add @falcao/api-client

# With npm
npm install @falcao/api-client

# With yarn
yarn add @falcao/api-client
```

## ? Getting Started

Here's a quick example to get you up and running. This example initializes the client, sets the user's location, and performs a simple public search.

```typescript
import { FalcaoClient, type Filtro } from "@falcao/api-client";

// 1. Initialize the client
const client = new FalcaoClient({
  baseURL: "https://jurisprudencia.jt.jus.br/jurisprudencia-nacional-backend",
  aiBaseURL: "https://ai.jurisprudencia.jt.jus.br/robusto",
  // Hook to provide your authentication token for protected routes
  getAuthToken: async () => {
    // Replace with your actual token retrieval logic
    return localStorage.getItem("my-app-auth-token");
  },
  // Optional: Hook to handle auth errors globally (e.g., redirect to login)
  onAuthError: () => {
    console.error("Authentication error! Redirecting to login...");
    window.location.href = "/login";
  },
});

// 2. Set user geolocation (recommended for analytics and API compliance)
// You can get this from the browser's Geolocation API
client.setGeolocation({
  latitude: -23.5505,
  longitude: -46.6333,
  cidade: "São Paulo",
  estado: "SP",
  pais: "BR",
});

// 3. Perform a search
async function searchForDocuments() {
  try {
    const filters: Filtro = {
      texto: '"danos morais" -assédio', // Search for "danos morais" but exclude "assédio"
      tribunais: ["TST", "TRT2"],
      dataInicio: "2024-01-01",
    };

    const pagination = { page: 0, size: 10 };

    console.log("Searching for documents...");
    const results = await client.search.search(filters, pagination);

    console.log(`Successfully found ${results.quantidadeTotal} documents.`);
    if (results.documentos.length > 0) {
      console.log("First document title:", results.documentos[0].tituloDecisao);
    }
  } catch (error) {
    console.error("An error occurred during search:", error);
  }
}

// Run the example
searchForDocuments();
```

## ? Core Concepts

### The `FalcaoClient`

The `FalcaoClient` is the main entry point to the library. You create a single instance of it for your application. It holds the configuration and provides access to all the API services.

### Services

The client is organized into services that mirror the API's structure:
-   `client.search`: For public search, autocomplete, and system info.
-   `client.documents`: For fetching specific documents and performing actions like citation or PDF generation.
-   `client.user`: For authenticated actions related to user profiles, saved searches, and notifications.
-   `client.ai`: For interacting with the AI "Robusto" service.
-   `client.admin`: For administrative tasks like cache management.

### Session Management

The Falcão API requires a `sessionId` and a derived `juristkn` on every request. This library handles this automatically.
-   A `sessionId` is generated and, by default, persisted in `localStorage`.
-   The `juristkn` is calculated from the `sessionId`.
-   Geolocation data, once set via `client.setGeolocation()`, is also automatically included in requests.

### Authentication

For authenticated endpoints (like those in `UserService`), the client needs a JWT. You provide this via the `getAuthToken` function during initialization. The client will call this function before making a request to a protected route and will automatically add the `Authorization: Bearer <token>` header.

## ? API Usage Examples

Below are detailed examples for each service.

### `client.search` - Public Search Operations

#### Search for Documents
```typescript
const searchResults = await client.search.search(
  {
    texto: '("horas extras" OR "sobreaviso") +TST',
    colecao: ["acordaos", "precedentes"],
    temEmenta: "S", // Only documents with an ementa (summary)
    filtroRapidoData: "Ultimos90Dias", // Quick date filter
  },
  { page: 0, size: 20 }
);
console.log(`Found ${searchResults.quantidadeTotal} results.`);
```

#### Get Search Term Suggestions (Autocomplete)
```typescript
const suggestions = await client.search.autocomplete("vínculo empregat");
console.log("Autocomplete suggestions:", suggestions.sugestoes);
```

#### Get Document Counts per Collection
```typescript
const counts = await client.search.count({
  texto: "justa causa",
  tribunais: ["TST"],
});
// e.g., { valor: "acordaos", quantidade: 1234, valorWeb: "Acórdãos" }
console.log("Counts by collection:", counts.filtrosDisponiveis[0].valoresFiltro);
```

#### Get System Information
```typescript
const tribunals = await client.search.getTribunals();
console.log("Available tribunals:", tribunals);

const systemInfo = await client.search.getSystemInfo();
console.log("API Version:", systemInfo.versao);
```

### `client.documents` - Document-Specific Actions

#### Get a Specific Document
```typescript
// Fetch a specific "acórdão" by its tribunal and ID
const docResponse = await client.documents.getAcordao("TST", "doc-id-12345");
const document = docResponse.documentos[0];
console.log(document.tituloDecisao, document.ementa);
```

#### Generate a Citation
```typescript
const citation = await client.documents.generateCitation({
  documento: {
    idDocumento: "doc-id-12345",
    tipoDocumento: "acordaos",
    tribunal: "TST",
  },
  // These params are used for logging/analytics by the API
  indiceItemSelecionado: 0,
  numeroPagina: 0,
  tamanhoPagina: 20,
  top5: false,
});
console.log("Generated Citation:", citation);
```

#### Generate and Download a PDF
```typescript
const pdfBlob = await client.documents.generatePdf("TST", "doc-id-12345", "acordaos");

// In a browser environment, you can create a download link
const url = URL.createObjectURL(pdfBlob);
const a = document.createElement("a");
a.href = url;
a.download = "documento-tst-12345.pdf";
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
```

### `client.user` - Authenticated User Operations

> **Note:** All methods in this service require a valid JWT token provided via the `getAuthToken` callback.

#### Get User Profile
```typescript
const profile = await client.user.getProfile();
console.log(`Welcome, ${profile.nome}!`);
```

#### Get and Save a Search
```typescript
// Save a search
const myFilter: Filtro = { texto: "equiparação salarial", tribunais: ["TST"] };
const geo = client.sessionManager.getGeolocation();
if (!geo) throw new Error("Geolocation must be set!");

const savedSearch = await client.user.saveSearch(
  "Equiparação Salarial - TST",
  myFilter,
  geo
);
console.log("Search saved with ID:", savedSearch.id);

// Get all saved searches
const savedSearches = await client.user.getSavedSearches(0, 10);
console.log("Your saved searches:", savedSearches.content);
```

#### Manage Notifications
```typescript
// The API provides public notifications, but marking as read is authenticated
const notifications = await client.user.getNotifications();
if (notifications.length > 0) {
  const firstNotification = notifications[0];
  console.log("First notification:", firstNotification.titulo);

  // Mark it as read
  await client.user.markNotificationAsRead(firstNotification, geo);
  console.log("Notification marked as read.");
}
```

### `client.ai` - AI "Robusto" Service

#### Start an AI Conversation
The AI service works by creating a conversation context based on a search query.

```typescript
// 1. Define the search filters for the AI context
const aiFilters: Filtro = {
  texto: "inteligência artificial no direito do trabalho",
  tribunais: ["TST"],
};

// 2. Build the search context URL (this client utility creates the query string)
const searchContext = client.buildAISearchContext(aiFilters, 200); // Context with 200 docs

// 3. Create the conversation
const conversation = await client.ai.createConversation(
  "AI e Direito do Trabalho (200 docs)",
  searchContext
);

console.log("AI Conversation ID:", conversation.conversationId);

// 4. Get the URL to embed in an iframe
const iframeUrl = client.ai.getConversationUrl(conversation.conversationId);
console.log("Embed this URL in an iframe:", iframeUrl);

// Example: <iframe src={iframeUrl} width="100%" height="600px" />
```

## ? Error Handling

The client throws typed errors, allowing you to handle different failure scenarios gracefully.

```typescript
import {
  FalcaoClient,
  FalcaoAuthenticationError,
  FalcaoValidationError,
  FalcaoNetworkError,
} from "@falcao/api-client";

const client = new FalcaoClient({
  /* ... config ... */
});

async function safeApiCall() {
  try {
    // This will fail if the user is not authenticated
    const profile = await client.user.getProfile();
    console.log(profile);
  } catch (error) {
    if (error instanceof FalcaoAuthenticationError) {
      // Handle auth errors: token is missing, invalid, or expired
      console.error("Authentication failed:", error.message);
      // Redirect to login, refresh token, etc.
    } else if (error instanceof FalcaoValidationError) {
      // Handle validation errors: API response did not match expected schema
      console.error("API response validation failed:", error.message);
      console.error("Zod issues:", error.errors.issues);
    } else if (error instanceof FalcaoNetworkError) {
      // Handle network errors, including rate limiting (429) or server errors (5xx)
      console.error("Network error:", error.message);
      console.error("Status:", error.status, "Details:", error.details);
    } else {
      // Handle other unexpected errors
      console.error("An unknown error occurred:", error);
    }
  }
}
```

## ? Advanced Type Usage

This library exports all Zod-inferred types for use in your application.

```typescript
import type { Filtro, Documento, UserProfile } from "@falcao/api-client";

function processDocument(doc: Documento) {
  // `doc` is fully typed
  console.log(doc.numeroProcesso);
}

function buildSearchQuery(profile: UserProfile): Filtro {
  // Use user preferences to build a default filter
  const filter: Filtro = {
    tribunais: profile.configuracoes?.tribunaisPreferidos || [],
    texto: "",
  };
  return filter;
}
```

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

We welcome all forms of contributions, including:
-   🐛 Reporting bugs
-   ✨ Suggesting new features
-   📝 Improving documentation
-   💻 Submitting pull requests

Before you get started, please take a moment to read our comprehensive **[Contributing Guide](./CONTRIBUTING.md)**. This document provides detailed information on our development setup, coding conventions, testing guidelines, and the pull request process.

To get started, you can also check the [open issues](https://github.com/oscaromsn/falcao-api-client/issues) for anything that piques your interest.

---

<p align="center"><em>This is a third-party client and is not officially maintained by the developers of the Falcão API.</em></p>
