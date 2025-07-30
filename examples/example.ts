import { DocumentoTipo, FalcaoClient, type Filtro } from "@falcao/api-client";

// Initialize the client
const client = new FalcaoClient({
  baseURL: "https://jurisprudencia.jt.jus.br/jurisprudencia-nacional-backend",
  aiBaseURL: "https://ai.jurisprudencia.jt.jus.br/robusto",
  timeout: 30000,
  sessionConfig: {
    persistSession: true,
    storageType: "localStorage",
  },
  getAuthToken: async () => {
    // Your auth token logic
    return localStorage.getItem("auth_token");
  },
  onAuthError: () => {
    // Handle auth errors (e.g., redirect to login)
    window.location.href = "/login";
  },
});

// Set user geolocation (optional but recommended)
client.setGeolocation({
  latitude: -23.5505,
  longitude: -46.6333,
  cidade: "São Paulo",
  estado: "SP",
  pais: "BR",
});

// Example 1: Search for documents
async function searchDocuments() {
  try {
    const filters: Filtro = {
      texto: '"horas extras" +noturno',
      tribunais: ["TST", "TRT2"],
      dataInicio: "2024-01-01",
      dataFim: "2024-12-31",
      temEmenta: "S",
    };

    const results = await client.search.search(filters, { page: 0, size: 20 });

    console.log(`Found ${results.quantidadeTotal} documents`);
    console.log("First document:", results.documentos[0]);

    // Get available filters
    const facets = results.filtrosDisponiveis;
    console.log("Available filters:", facets);
  } catch (error) {
    console.error("Search failed:", error);
  }
}

// Example 2: Get autocomplete suggestions
async function getSearchSuggestions() {
  try {
    const suggestions = await client.search.autocomplete("danos mor");
    console.log("Suggestions:", suggestions.sugestoes);
  } catch (error) {
    console.error("Autocomplete failed:", error);
  }
}

// Example 3: Get a specific document
async function getDocument() {
  try {
    const doc = await client.documents.getAcordao("TST", "123456");
    console.log("Document:", doc.documentos[0]);

    // Generate citation
    const citation = await client.documents.generateCitation({
      documento: {
        idDocumento: "123456",
        tipoDocumento: DocumentoTipo.Acordao,
        tribunal: "TST",
      },
      indiceItemSelecionado: 0,
      numeroPagina: 0,
      tamanhoPagina: 20,
      top5: false,
    });

    console.log("Citation:", citation);
  } catch (error) {
    console.error("Document retrieval failed:", error);
  }
}

// Example 4: User profile operations (authenticated)
async function userOperations() {
  try {
    // Get user profile
    const profile = await client.user.getProfile();
    console.log("User profile:", profile);

    // Save a search
    const savedSearch = await client.user.saveSearch(
      "My TST Search",
      { texto: "horas extras", tribunais: ["TST"] },
      client.sessionManager.getGeolocation() || { latitude: 0, longitude: 0 }
    );
    console.log("Saved search:", savedSearch);

    // Get notifications
    const notifications = await client.user.getNotifications();
    console.log("Notifications:", notifications);

    // Mark first notification as read
    if (notifications.length > 0) {
      await client.user.markNotificationAsRead(
        notifications[0],
        client.sessionManager.getGeolocation() || { latitude: 0, longitude: 0 }
      );
    }
  } catch (error) {
    console.error("User operations failed:", error);
  }
}

// Example 5: AI conversation
async function startAIChat() {
  try {
    // Build search context
    const searchContext = client.buildAISearchContext(
      {
        texto: "danos morais",
        tribunais: ["TST"],
      },
      100
    );

    // Create conversation
    const conversation = await client.ai.createConversation(
      "Danos Morais TST (100 docs)",
      searchContext
    );

    console.log("AI Conversation ID:", conversation.conversationId);

    // Get iframe URL
    const iframeUrl = client.ai.getConversationUrl(conversation.conversationId);
    console.log("Iframe URL:", iframeUrl);

    // You can now display this URL in an iframe
    // <iframe src={iframeUrl} />
  } catch (error) {
    console.error("AI conversation failed:", error);
  }
}

// Run examples
(async () => {
  await searchDocuments();
  await getSearchSuggestions();
  await getDocument();
  await userOperations();
  await startAIChat();
})();
