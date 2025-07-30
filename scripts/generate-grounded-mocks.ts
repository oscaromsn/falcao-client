#!/usr/bin/env bun

/**
 * Grounded Mock Generator
 * 
 * Generates new mock handlers using real API response structures.
 * Removes incorrect ApiResponse wrappers and ensures 1:1 correspondence with actual API behavior.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface MockTemplate {
  endpointPattern: string;
  method: string;
  responseStructure: string;
  realSamples: any[];
  mockTemplate: any;
  schemaValidated: boolean;
  notes: string[];
}

class GroundedMockGenerator {
  private mockTemplates: MockTemplate[];

  constructor() {
    const templatesPath = join(process.cwd(), "scripts", "analysis-output", "mock-templates.json");
    console.log(`📖 Loading mock templates from: ${templatesPath}`);
    
    const templatesContent = readFileSync(templatesPath, "utf-8");
    this.mockTemplates = JSON.parse(templatesContent);
    console.log(`✅ Loaded ${this.mockTemplates.length} mock templates`);
  }

  generateHandlers(): string {
    console.log("\n🔍 Generating grounded mock handlers...");
    
    const handlers = [
      "import { HttpResponse, http } from \"msw\";",
      "import {",
      "  createMockNoAuthNotificacoes,",
      "  createMockNoAuthAutocompletar",
      "} from \"../utils/grounded-mock-helpers\";",
      "",
      "// IMPORTANT: Real Falcão API returns RAW responses without ApiResponse<T> wrapper",
      "// These handlers match the actual API structure exactly",
      "",
      "const BASE_URL = \"https://jurisprudencia.jt.jus.br/jurisprudencia-nacional-backend/api\";",
      "const AI_BASE_URL = \"https://ai.jurisprudencia.jt.jus.br/robusto\";",
      "",
      "export const groundedHandlers = [",
      ""
    ];

    for (const template of this.mockTemplates) {
      console.log(`📝 Generating handler for ${template.method} ${template.endpointPattern}`);
      
      handlers.push(`  // ${template.notes.join(", ")}`);
      
      if (template.endpointPattern.includes("/notificacoes")) {
        handlers.push(`  http.get(\`\${BASE_URL}/no-auth/notificacoes\`, ({ request }) => {`);
        handlers.push(`    const url = new URL(request.url);`);
        handlers.push(`    const page = parseInt(url.searchParams.get("page") || "0");`);
        handlers.push(`    const size = parseInt(url.searchParams.get("size") || "5");`);
        handlers.push(`    `);
        handlers.push(`    // Return raw array - NO WRAPPER (matches real API)`);
        handlers.push(`    const allNotifications = createMockNoAuthNotificacoes();`);
        handlers.push(`    const start = page * size;`);
        handlers.push(`    const end = start + size;`);
        handlers.push(`    const pageData = allNotifications.slice(start, end);`);
        handlers.push(`    `);
        handlers.push(`    return HttpResponse.json(pageData);`);
        handlers.push(`  }),`);
      } else if (template.endpointPattern.includes("/autocompletar")) {
        handlers.push(`  http.get(\`\${BASE_URL}/no-auth/autocompletar\`, ({ request }) => {`);
        handlers.push(`    const url = new URL(request.url);`);
        handlers.push(`    const query = url.searchParams.get("texto") || "";`);
        handlers.push(`    `);
        handlers.push(`    // Return raw object - NO WRAPPER (matches real API)`);
        handlers.push(`    const response = createMockNoAuthAutocompletar(query);`);
        handlers.push(`    `);
        handlers.push(`    return HttpResponse.json(response);`);
        handlers.push(`  }),`);
      } else if (template.endpointPattern.includes("/produtos")) {
        // Skip external API endpoints that aren't part of Falcão
        continue;
      } else {
        // Generic handler for other endpoints
        const functionName = this.getFunctionName(template.endpointPattern);
        const urlPattern = template.endpointPattern.replace(/:uuid/g, ":id").replace(/:id/g, "${id}");
        
        handlers.push(`  http.${template.method.toLowerCase()}(\`\${BASE_URL}${urlPattern}\`, () => {`);
        handlers.push(`    // Return raw data - NO WRAPPER (matches real API)`);
        handlers.push(`    return HttpResponse.json(${JSON.stringify(template.mockTemplate, null, 6).replace(/\n/g, "\n    ")});`);
        handlers.push(`  }),`);
      }
      
      handlers.push("");
    }

    // Add essential handlers that are in the current mock but not in our HAR data
    handlers.push("  // Additional essential handlers (extend as needed)");
    handlers.push("");

    handlers.push("  // Search endpoints");
    handlers.push("  http.get(`${BASE_URL}/no-auth/pesquisa`, ({ request }) => {");
    handlers.push("    const url = new URL(request.url);");
    handlers.push("    const texto = url.searchParams.get(\"texto\") || \"\";");
    handlers.push("    const page = parseInt(url.searchParams.get(\"page\") || \"0\");");
    handlers.push("    const size = parseInt(url.searchParams.get(\"size\") || \"20\");");
    handlers.push("");
    handlers.push("    // Return raw SearchResponse - NO WRAPPER");
    handlers.push("    return HttpResponse.json({");
    handlers.push("      documentos: [");
    handlers.push("        {");
    handlers.push("          id: \"doc123\",");
    handlers.push("          tribunal: \"TST\",");
    handlers.push("          numeroProcesso: \"1234567-89.2024.5.00.0000\",");
    handlers.push("          tituloDecisao: `SEARCH RESULT - ${texto}`,");
    handlers.push("          ementa: `Ementa relacionada a: ${texto}`,");
    handlers.push("          relator: \"Min. Test\",");
    handlers.push("          dataJulgamento: \"2024-06-15\",");
    handlers.push("          orgaoJulgador: \"3ª Turma\",");
    handlers.push("          classeProcessual: \"Recurso de Revista\"");
    handlers.push("        }");
    handlers.push("      ],");
    handlers.push("      filtrosDisponiveis: [");
    handlers.push("        {");
    handlers.push("          nomeDoFiltro: \"tribunal\",");
    handlers.push("          nomeWeb: \"Tribunal\",");
    handlers.push("          ordem: 1,");
    handlers.push("          valoresFiltro: [");
    handlers.push("            {");
    handlers.push("              valor: \"TST\",");
    handlers.push("              quantidade: 100,");
    handlers.push("              valorWeb: \"Tribunal Superior do Trabalho\",");
    handlers.push("              valorBalao: \"TST\"");
    handlers.push("            }");
    handlers.push("          ]");
    handlers.push("        }");
    handlers.push("      ],");
    handlers.push("      quantidadeTotal: 1");
    handlers.push("    });");
    handlers.push("  }),");
    handlers.push("");

    handlers.push("  // System information");
    handlers.push("  http.get(`${BASE_URL}/no-auth/informacao/tribunais`, () => {");
    handlers.push("    // Return raw array - NO WRAPPER");
    handlers.push("    return HttpResponse.json([");
    handlers.push("      { sigla: \"TST\", nome: \"Tribunal Superior do Trabalho\" },");
    handlers.push("      { sigla: \"TRT1\", nome: \"Tribunal Regional do Trabalho da 1ª Região\" },");
    handlers.push("      { sigla: \"STF\", nome: \"Supremo Tribunal Federal\" }");
    handlers.push("    ]);");
    handlers.push("  }),");
    handlers.push("");

    handlers.push("  // Error responses for testing");
    handlers.push("  http.get(`${BASE_URL}/error/500`, () => {");
    handlers.push("    // Return raw error - NO WRAPPER");
    handlers.push("    return HttpResponse.json({");
    handlers.push("      timestamp: new Date().toISOString(),");
    handlers.push("      status: 500,");
    handlers.push("      error: \"Internal Server Error\",");
    handlers.push("      message: \"An internal server error occurred\",");
    handlers.push("      path: \"/error/500\"");
    handlers.push("    }, { status: 500 });");
    handlers.push("  }),");
    handlers.push("");

    handlers.push("  http.get(`${BASE_URL}/error/401`, () => {");
    handlers.push("    // Return raw error - NO WRAPPER");
    handlers.push("    return HttpResponse.json({");
    handlers.push("      timestamp: new Date().toISOString(),");
    handlers.push("      status: 401,");
    handlers.push("      error: \"Unauthorized\",");
    handlers.push("      message: \"Authentication required\",");
    handlers.push("      path: \"/error/401\"");
    handlers.push("    }, { status: 401 });");
    handlers.push("  })");
    handlers.push("];");

    return handlers.join("\n");
  }

  private getFunctionName(pattern: string): string {
    let name = pattern
      .replace(/^\//, "")
      .replace(/\//g, "_")
      .replace(/-/g, "_")
      .replace(/:/g, "")
      .replace(/_+/g, "_");
    
    return `createMock${name.split("_").map(p => 
      p.charAt(0).toUpperCase() + p.slice(1)
    ).join("")}`;
  }

  generateUpdatedTestHelpers(): string {
    console.log("📝 Generating updated test helpers...");
    
    const helpers = [
      "/**",
      " * Grounded Test Helpers",
      " * Based on real API responses - NO ApiResponse<T> wrapper",
      " */",
      "",
      'import type { ',
      '  Notification, ',
      '  AutocompleteResponse,',
      '  SearchResponse,',
      '  Documento,',
      '  ErrorResponse',
      '} from "@schemas/index";',
      'import type { DocumentId, SessionId } from "@/types";',
      "",
      "// CRITICAL: Real API returns RAW data, not wrapped in ApiResponse<T>",
      "// These helpers match actual API behavior",
      "",
    ];

    // Import the generated helpers
    const groundedHelpersPath = join(process.cwd(), "scripts", "analysis-output", "grounded-mock-helpers.ts");
    const groundedHelpers = readFileSync(groundedHelpersPath, "utf-8");
    
    // Extract the helper functions and add them
    const lines = groundedHelpers.split("\n");
    let inFunction = false;
    let currentFunction = [];
    
    for (const line of lines) {
      if (line.startsWith("export const create")) {
        if (inFunction && currentFunction.length > 0) {
          helpers.push(...currentFunction);
          helpers.push("");
        }
        inFunction = true;
        currentFunction = [line];
      } else if (inFunction) {
        currentFunction.push(line);
        if (line === "});" || line === "];") {
          helpers.push(...currentFunction);
          helpers.push("");
          currentFunction = [];
          inFunction = false;
        }
      }
    }

    // Add remaining helpers for missing endpoints
    helpers.push("// Additional mock helpers for testing");
    helpers.push("");
    
    helpers.push("export const createMockDocument = (overrides: Partial<Documento> = {}): Documento => ({");
    helpers.push("  id: \"doc123\",");
    helpers.push("  tribunal: \"TST\",");
    helpers.push("  numeroProcesso: \"1234567-89.2024.5.00.0000\",");
    helpers.push("  tituloDecisao: \"Test Document Title\",");
    helpers.push("  ementa: \"Test document summary\",");
    helpers.push("  relator: \"Min. Test\",");
    helpers.push("  dataJulgamento: \"2024-01-15\",");
    helpers.push("  orgaoJulgador: \"3ª Turma\",");
    helpers.push("  classeProcessual: \"Recurso de Revista\",");
    helpers.push("  ...overrides");
    helpers.push("});");
    helpers.push("");

    helpers.push("export const createMockSearchResponse = (overrides: Partial<SearchResponse> = {}): SearchResponse => ({");
    helpers.push("  documentos: [createMockDocument()],");
    helpers.push("  filtrosDisponiveis: [");
    helpers.push("    {");
    helpers.push("      nomeDoFiltro: \"tribunal\",");
    helpers.push("      nomeWeb: \"Tribunal\",");
    helpers.push("      ordem: 1,");
    helpers.push("      valoresFiltro: [");
    helpers.push("        {");
    helpers.push("          valor: \"TST\",");
    helpers.push("          quantidade: 100,");
    helpers.push("          valorWeb: \"Tribunal Superior do Trabalho\",");
    helpers.push("          valorBalao: \"TST\"");
    helpers.push("        }");
    helpers.push("      ]");
    helpers.push("    }");
    helpers.push("  ],");
    helpers.push("  quantidadeTotal: 1,");
    helpers.push("  ...overrides");
    helpers.push("});");
    helpers.push("");

    helpers.push("export const createMockErrorResponse = (overrides: Partial<ErrorResponse> = {}): ErrorResponse => ({");
    helpers.push("  timestamp: new Date().toISOString(),");
    helpers.push("  status: 500,");
    helpers.push("  error: \"Internal Server Error\",");
    helpers.push("  message: \"An error occurred while processing the request\",");
    helpers.push("  path: \"/api/test\",");
    helpers.push("  ...overrides");
    helpers.push("});");
    helpers.push("");

    helpers.push("// Utility functions");
    helpers.push("export const createMockSessionId = (): SessionId =>");
    helpers.push("  `session_${Math.random().toString(36).substr(2, 9)}` as SessionId;");
    helpers.push("");

    helpers.push("export const createMockDocumentId = (): DocumentId =>");
    helpers.push("  `doc_${Math.random().toString(36).substr(2, 9)}` as DocumentId;");

    return helpers.join("\n");
  }

  exportResults(): void {
    const outputDir = join(process.cwd(), "scripts", "analysis-output");

    // Write grounded handlers
    const handlersPath = join(outputDir, "grounded-handlers.ts");
    writeFileSync(handlersPath, this.generateHandlers());
    console.log(`📊 Grounded handlers written to: ${handlersPath}`);

    // Write updated test helpers
    const helpersPath = join(outputDir, "updated-test-helpers.ts");
    writeFileSync(helpersPath, this.generateUpdatedTestHelpers());
    console.log(`💾 Updated test helpers written to: ${helpersPath}`);

    // Write migration guide
    const migrationGuide = [
      "# Mock Handler Migration Guide",
      "",
      "## Key Changes",
      "",
      "### 1. Remove ApiResponse<T> Wrapper",
      "**BEFORE (Incorrect):**",
      "```typescript",
      "const mockResponse = createMockApiResponse(data);",
      "return HttpResponse.json(mockResponse);",
      "```",
      "",
      "**AFTER (Correct):**",
      "```typescript",
      "// Return raw data - NO WRAPPER (matches real API)",
      "return HttpResponse.json(data);",
      "```",
      "",
      "### 2. Update Base URLs",
      "**BEFORE:**",
      "```typescript",
      "const BASE_URL = \"https://api.test.com\";",
      "```",
      "",
      "**AFTER:**",
      "```typescript",
      "const BASE_URL = \"https://jurisprudencia.jt.jus.br/jurisprudencia-nacional-backend/api\";",
      "```",
      "",
      "### 3. Use Grounded Mock Helpers",
      "Replace generic mock data with helpers based on real API responses:",
      "",
      "```typescript",
      "import {",
      "  createMockNoAuthNotificacoes,",
      "  createMockNoAuthAutocompletar",
      "} from \"../utils/grounded-mock-helpers\";",
      "```",
      "",
      "## Migration Steps",
      "",
      "1. **Replace handlers file:**",
      "   - Copy `grounded-handlers.ts` to `tests/mocks/handlers.ts`",
      "",
      "2. **Update test helpers:**",
      "   - Copy `updated-test-helpers.ts` to override existing helpers",
      "   - Remove `createMockApiResponse` function entirely",
      "",
      "3. **Update tests:**",
      "   - Remove expectations for wrapped responses",
      "   - Test against raw response structures",
      "",
      "4. **Validate:**",
      "   - Run schema validation to ensure all responses pass",
      "   - Run existing tests to verify compatibility",
      "",
      "## Validation Commands",
      "",
      "```bash",
      "# Validate new mocks against schemas",
      "bun run scripts/validate-mocks.ts",
      "",
      "# Run tests with new handlers",
      "bun test",
      "```"
    ].join("\n");

    const migrationPath = join(outputDir, "migration-guide.md");
    writeFileSync(migrationPath, migrationGuide);
    console.log(`📋 Migration guide written to: ${migrationPath}`);
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting grounded mock generation...\n");
  
  try {
    const generator = new GroundedMockGenerator();
    generator.exportResults();
    
    console.log("\n✅ Grounded mock generation complete! Check scripts/analysis-output/ for results.");
    console.log("\n📋 Next steps:");
    console.log("1. Review generated handlers in grounded-handlers.ts");
    console.log("2. Follow migration-guide.md to update your test files");
    console.log("3. Run validation scripts to ensure everything works");
  } catch (error) {
    console.error("\n❌ Generation failed:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}