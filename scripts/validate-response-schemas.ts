#!/usr/bin/env bun

/**
 * Schema Validation Script
 * 
 * Tests real API responses against current Zod schemas to identify mismatches.
 * This helps us understand where our schemas need updates to match reality.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { ZodError } from "zod";

// Import all schemas from centralized index
import {
  // User schemas
  NotificationSchema,
  UserProfileSchema,
  SavedSearchSchema,
  WordCloudItemSchema,
  UserStatisticsSchema,
  // Search schemas
  AutocompleteResponseSchema,
  SearchResponseSchema,
  CountResponseSchema,
  TribunalSchema,
  // Document schemas
  DocumentoSchema,
  DocumentResponseSchema,
  CitacaoResponseSchema,
  TextoResponseSchema,
  // Admin schemas
  CacheStatusSchema,
  SystemInfoSchema,
  // AI schemas
  ConversationRequestSchema,
  ConversationResponseSchema,
  // Common schemas
  ApiResponseSchema,
  ErrorResponseSchema,
  GeolocationSchema,
  RequisicaoFormSchema
} from "@schemas/index";

interface ApiResponse {
  endpoint: string;
  method: string;
  status: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  queryParams: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  responseSize: number;
  timestamp: string;
  isWrapped: boolean;
  wrapperStructure?: string;
}

interface ValidationResult {
  endpoint: string;
  method: string;
  schemaName: string;
  isValid: boolean;
  errors?: string[];
  responseStructure: string;
  expectedStructure: string;
  suggestions: string[];
}

class SchemaValidator {
  private apiResponses: ApiResponse[];
  private validationResults: ValidationResult[] = [];

  constructor() {
    const responsesPath = join(process.cwd(), "scripts", "analysis-output", "api-responses.json");
    console.log(`📖 Loading API responses from: ${responsesPath}`);
    
    const responsesContent = readFileSync(responsesPath, "utf-8");
    this.apiResponses = JSON.parse(responsesContent);
    console.log(`✅ Loaded ${this.apiResponses.length} API responses`);
  }

  validate(): void {
    console.log("\n🔍 Validating responses against schemas...");

    for (const response of this.apiResponses) {
      this.validateResponse(response);
    }

    console.log(`\n✅ Validated ${this.validationResults.length} response-schema pairs`);
  }

  private validateResponse(response: ApiResponse): void {
    const endpoint = response.endpoint;
    
    // Map endpoints to expected schemas
    const schemaMapping = this.getSchemaMapping(endpoint);
    
    for (const { schemaName, schema, description } of schemaMapping) {
      try {
        console.log(`🧪 Testing ${response.method} ${endpoint} against ${schemaName}`);
        
        // For array responses, validate each item if it's a single-item schema
        let dataToValidate = response.responseBody;
        
        if (Array.isArray(dataToValidate) && schemaName !== "NotificationArray") {
          // If we expect a single item schema but got an array, validate first item
          if (dataToValidate.length > 0) {
            dataToValidate = dataToValidate[0];
          }
        }

        const result = schema.safeParse(dataToValidate);
        
        if (result.success) {
          console.log(`  ✅ Valid against ${schemaName}`);
          this.validationResults.push({
            endpoint: response.endpoint,
            method: response.method,
            schemaName,
            isValid: true,
            responseStructure: this.getStructureDescription(response.responseBody),
            expectedStructure: description,
            suggestions: []
          });
        } else {
          console.log(`  ❌ Invalid against ${schemaName}`);
          this.handleValidationError(response, schemaName, description, result.error);
        }
      } catch (error) {
        console.warn(`  ⚠️  Error validating ${schemaName}: ${error}`);
        this.validationResults.push({
          endpoint: response.endpoint,
          method: response.method,
          schemaName,
          isValid: false,
          errors: [`Validation error: ${error}`],
          responseStructure: this.getStructureDescription(response.responseBody),
          expectedStructure: description,
          suggestions: ["Check schema import and structure"]
        });
      }
    }
  }

  private getSchemaMapping(endpoint: string) {
    const mappings = [];

    // Notifications endpoint
    if (endpoint.includes("/notificacoes")) {
      mappings.push({
        schemaName: "NotificationArray",
        schema: NotificationSchema.array(),
        description: "Array of Notification objects with id, titulo, descricao, dataCadastro, lido"
      });
    }

    // Autocomplete endpoint  
    if (endpoint.includes("/autocompletar")) {
      mappings.push({
        schemaName: "AutocompleteResponse",
        schema: AutocompleteResponseSchema,
        description: "Object with sugestoes array and optional queriesRelated array"
      });
    }

    // Search endpoint
    if (endpoint.includes("/pesquisa") && !endpoint.includes("/autocompletar")) {
      mappings.push({
        schemaName: "SearchResponse",
        schema: SearchResponseSchema,
        description: "Object with documentos, filtrosDisponiveis, quantidadeTotal, optional temasTopFive"
      });
    }

    // Count endpoint
    if (endpoint.includes("/pesquisa/count")) {
      mappings.push({
        schemaName: "CountResponse",
        schema: CountResponseSchema,
        description: "Object with filtrosDisponiveis array"
      });
    }

    // Tribunals info
    if (endpoint.includes("/informacao/tribunais")) {
      mappings.push({
        schemaName: "TribunalArray",
        schema: TribunalSchema.array(),
        description: "Array of Tribunal objects with sigla and nome"
      });
    }

    // User profile
    if (endpoint.includes("/perfil") && !endpoint.includes("/tribunais") && !endpoint.includes("/orgaos") && !endpoint.includes("/magistrados")) {
      mappings.push({
        schemaName: "UserProfile",
        schema: UserProfileSchema,
        description: "User profile with id, nome, email, utilizaIARobusto, configuracoes"
      });
    }

    // Document endpoints
    if (endpoint.includes("/acordaos/") || endpoint.includes("/precedentes/") || endpoint.includes("/sentencas/")) {
      mappings.push({
        schemaName: "DocumentResponse",
        schema: DocumentResponseSchema,
        description: "Object with documentos array containing document objects"
      });
    }

    // If no specific mapping, try common patterns
    if (mappings.length === 0) {
      // Try to infer from response structure
      console.log(`  📝 No specific schema mapping for ${endpoint}, using inference`);
    }

    return mappings;
  }

  private handleValidationError(response: ApiResponse, schemaName: string, description: string, error: ZodError): void {
    const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    const suggestions = this.generateSuggestions(response.responseBody, error);

    this.validationResults.push({
      endpoint: response.endpoint,
      method: response.method,
      schemaName,
      isValid: false,
      errors,
      responseStructure: this.getStructureDescription(response.responseBody),
      expectedStructure: description,
      suggestions
    });
  }

  private generateSuggestions(responseBody: any, error: ZodError): string[] {
    const suggestions: string[] = [];
    
    if (!responseBody || typeof responseBody !== "object") {
      suggestions.push("Response is not an object - check if endpoint returns expected data");
      return suggestions;
    }

    const responseKeys = Object.keys(responseBody);
    
    // Check for common field name mismatches
    for (const err of error.errors) {
      if (err.code === "invalid_type" && err.path.length === 1) {
        const field = err.path[0];
        
        // Check for Portuguese/English field name variants
        const fieldMappings: Record<string, string[]> = {
          "nome": ["name", "title", "titulo"],
          "email": ["e-mail", "mail"],
          "utilizaIARobusto": ["useRobustAI", "usesAI", "aiEnabled"],
          "configuracoes": ["configurations", "config", "settings", "preferences"],
          "titulo": ["title", "name", "nome"],
          "descricao": ["description", "desc", "content"],
          "dataCadastro": ["dateCreated", "createdAt", "created_at", "date"],
          "lido": ["read", "isRead", "viewed"]
        };

        if (fieldMappings[field as string]) {
          const alternatives = fieldMappings[field as string].filter(alt => responseKeys.includes(alt));
          if (alternatives.length > 0) {
            suggestions.push(`Field '${field}' not found. Found similar fields: ${alternatives.join(', ')}`);
          }
        }
      }
      
      if (err.code === "unrecognized_keys") {
        suggestions.push(`Extra fields in response: ${err.keys?.join(', ')}. Consider making schema .partial() or .passthrough()`);
      }
    }

    // Check if response structure suggests it should be wrapped/unwrapped
    if (responseKeys.includes("data") && responseKeys.length <= 3) {
      suggestions.push("Response appears to be wrapped in ApiResponse format - extract .data field");
    }

    if (Array.isArray(responseBody) && error.errors.some(e => e.path.length === 0)) {
      suggestions.push("Response is an array but schema expects object - use .array() or validate individual items");
    }

    return suggestions;
  }

  private getStructureDescription(data: any): string {
    if (data === null) return "null";
    if (data === undefined) return "undefined";
    
    if (Array.isArray(data)) {
      if (data.length === 0) return "[]";
      return `Array<${this.getStructureDescription(data[0])}>`;
    }
    
    if (typeof data === "object") {
      const keys = Object.keys(data);
      if (keys.length === 0) return "{}";
      
      const keyDescriptions = keys.slice(0, 5).map(key => {
        const value = data[key];
        const type = Array.isArray(value) ? "array" : typeof value;
        return `${key}: ${type}`;
      });
      
      const more = keys.length > 5 ? `, ...${keys.length - 5} more` : "";
      return `{ ${keyDescriptions.join(", ")}${more} }`;
    }
    
    return typeof data;
  }

  generateReport(): string {
    const report = [
      "# Schema Validation Report",
      `Generated: ${new Date().toISOString()}`,
      `Total validations: ${this.validationResults.length}`,
      "",
      "## Summary",
      ""
    ];

    // Summary statistics
    const validCount = this.validationResults.filter(r => r.isValid).length;
    const invalidCount = this.validationResults.length - validCount;
    
    report.push(`- ✅ Valid: ${validCount}`);
    report.push(`- ❌ Invalid: ${invalidCount}`);
    report.push("");

    // Group by endpoint
    const byEndpoint = this.validationResults.reduce((groups, result) => {
      const key = `${result.method} ${result.endpoint}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(result);
      return groups;
    }, {} as Record<string, ValidationResult[]>);

    report.push("## Validation Results by Endpoint");
    report.push("");

    Object.entries(byEndpoint).forEach(([endpoint, results]) => {
      report.push(`### ${endpoint}`);
      report.push("");

      const validResults = results.filter(r => r.isValid);
      const invalidResults = results.filter(r => !r.isValid);

      if (validResults.length > 0) {
        report.push("**✅ Valid Schemas:**");
        validResults.forEach(result => {
          report.push(`- ${result.schemaName}`);
        });
        report.push("");
      }

      if (invalidResults.length > 0) {
        report.push("**❌ Invalid Schemas:**");
        report.push("");
        
        invalidResults.forEach(result => {
          report.push(`#### ${result.schemaName}`);
          report.push("");
          report.push("**Response Structure:**");
          report.push(`\`${result.responseStructure}\``);
          report.push("");
          report.push("**Expected Structure:**");
          report.push(result.expectedStructure);
          report.push("");
          
          if (result.errors && result.errors.length > 0) {
            report.push("**Validation Errors:**");
            result.errors.forEach(error => {
              report.push(`- ${error}`);
            });
            report.push("");
          }
          
          if (result.suggestions.length > 0) {
            report.push("**Suggestions:**");
            result.suggestions.forEach(suggestion => {
              report.push(`- ${suggestion}`);
            });
            report.push("");
          }
        });
      }
    });

    return report.join("\n");
  }

  exportResults(): void {
    const outputDir = join(process.cwd(), "scripts", "analysis-output");

    // Write validation report
    const reportPath = join(outputDir, "schema-validation-report.md");
    writeFileSync(reportPath, this.generateReport());
    console.log(`📊 Validation report written to: ${reportPath}`);

    // Write detailed results
    const resultsPath = join(outputDir, "validation-results.json");
    writeFileSync(resultsPath, JSON.stringify(this.validationResults, null, 2));
    console.log(`💾 Detailed results written to: ${resultsPath}`);

    // Write summary of issues
    const issues = this.validationResults.filter(r => !r.isValid);
    const issuesPath = join(outputDir, "schema-issues.json");
    writeFileSync(issuesPath, JSON.stringify(issues, null, 2));
    console.log(`🚨 Schema issues written to: ${issuesPath}`);
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting schema validation...\n");
  
  try {
    const validator = new SchemaValidator();
    validator.validate();
    validator.exportResults();
    
    console.log("\n✅ Schema validation complete! Check scripts/analysis-output/ for results.");
  } catch (error) {
    console.error("\n❌ Validation failed:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}