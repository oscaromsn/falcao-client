#!/usr/bin/env bun

/**
 * Response Structure Inspector
 * 
 * Analyzes the wrapper patterns in real API responses vs current mock responses
 * to identify the core discrepancy about ApiResponse<T> wrapper usage.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

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

interface MockHandler {
  endpoint: string;
  method: string;
  responseStructure: string;
  usesApiResponseWrapper: boolean;
  mockResponseSample: any;
}

interface ComparisonResult {
  endpoint: string;
  realApiStructure: string;
  mockStructure: string;
  hasDiscrepancy: boolean;
  issue: string;
  recommendation: string;
  realSample: any;
  mockSample: any;
}

class StructureInspector {
  private apiResponses: ApiResponse[];
  private mockHandlers: MockHandler[] = [];
  private comparisons: ComparisonResult[] = [];

  constructor() {
    const responsesPath = join(process.cwd(), "scripts", "analysis-output", "api-responses.json");
    console.log(`📖 Loading API responses from: ${responsesPath}`);
    
    const responsesContent = readFileSync(responsesPath, "utf-8");
    this.apiResponses = JSON.parse(responsesContent);
    console.log(`✅ Loaded ${this.apiResponses.length} API responses`);
  }

  async analyzeMockHandlers(): Promise<void> {
    console.log("\n🔍 Analyzing current mock handlers...");
    
    const mockHandlersPath = join(process.cwd(), "tests", "mocks", "handlers.ts");
    const mockContent = readFileSync(mockHandlersPath, "utf-8");
    
    // Parse mock handlers to understand their structure
    this.extractMockStructures(mockContent);
    
    console.log(`✅ Analyzed ${this.mockHandlers.length} mock handlers`);
  }

  private extractMockStructures(mockContent: string): void {
    // Extract handler patterns with regex
    const handlerPattern = /http\.(get|post|put|delete)\(`([^`]+)`[^}]+return HttpResponse\.json\(([^;]+)\);/gs;
    let match;
    
    while ((match = handlerPattern.exec(mockContent)) !== null) {
      const method = match[1].toUpperCase();
      const endpoint = match[2].replace(/\$\{[^}]+\}/g, ""); // Remove template vars
      const responseCode = match[3];
      
      // Check if uses createMockApiResponse wrapper
      const usesWrapper = responseCode.includes("createMockApiResponse");
      
      // Try to determine structure from response code
      let structure = "unknown";
      if (usesWrapper) {
        structure = "ApiResponse<T>";
      } else if (responseCode.includes("[") || responseCode.includes("Array")) {
        structure = "Array<T>";
      } else if (responseCode.includes("{")) {
        structure = "Object";
      }

      this.mockHandlers.push({
        endpoint: this.normalizeEndpoint(endpoint),
        method,
        responseStructure: structure,
        usesApiResponseWrapper: usesWrapper,
        mockResponseSample: responseCode
      });
    }
  }

  private normalizeEndpoint(endpoint: string): string {
    // Normalize endpoint for comparison
    return endpoint
      .replace(/\$\{BASE_URL\}/g, "")
      .replace(/\$\{AI_BASE_URL\}/g, "")
      .replace(/\/:[^/]+/g, "/:id") // Replace params with :id
      .replace(/\/\*$/g, ""); // Remove trailing wildcards
  }

  compareStructures(): void {
    console.log("\n🔍 Comparing real API vs mock structures...");
    
    for (const apiResponse of this.apiResponses) {
      const normalizedEndpoint = this.normalizeApiEndpoint(apiResponse.endpoint);
      
      // Find corresponding mock handler
      const mockHandler = this.findMatchingMockHandler(normalizedEndpoint, apiResponse.method);
      
      if (mockHandler) {
        const comparison = this.createComparison(apiResponse, mockHandler);
        this.comparisons.push(comparison);
        console.log(`📊 Compared ${apiResponse.method} ${normalizedEndpoint}: ${comparison.hasDiscrepancy ? "❌ DISCREPANCY" : "✅ MATCHES"}`);
      } else {
        // No matching mock handler found
        this.comparisons.push({
          endpoint: normalizedEndpoint,
          realApiStructure: this.describeStructure(apiResponse.responseBody, apiResponse.isWrapped),
          mockStructure: "NO MOCK HANDLER",
          hasDiscrepancy: true,
          issue: "Missing mock handler for this endpoint",
          recommendation: `Create mock handler for ${apiResponse.method} ${normalizedEndpoint}`,
          realSample: apiResponse.responseBody,
          mockSample: null
        });
        console.log(`❌ No mock found for ${apiResponse.method} ${normalizedEndpoint}`);
      }
    }

    console.log(`\n✅ Completed ${this.comparisons.length} comparisons`);
  }

  private normalizeApiEndpoint(endpoint: string): string {
    // Normalize API endpoint for comparison with mocks
    return endpoint
      .replace(/^\/jurisprudencia-nacional-backend\/api/, "") // Remove base path
      .replace(/\?.*$/, "") // Remove query params
      .replace(/\/\d+/g, "/:id"); // Replace numbers with :id
  }

  private findMatchingMockHandler(endpoint: string, method: string): MockHandler | undefined {
    return this.mockHandlers.find(handler => {
      const endpointMatch = handler.endpoint.includes(endpoint) || endpoint.includes(handler.endpoint);
      const methodMatch = handler.method === method;
      return endpointMatch && methodMatch;
    });
  }

  private createComparison(apiResponse: ApiResponse, mockHandler: MockHandler): ComparisonResult {
    const realStructure = this.describeStructure(apiResponse.responseBody, apiResponse.isWrapped);
    const mockStructure = mockHandler.responseStructure;
    
    // Determine if there's a discrepancy
    let hasDiscrepancy = false;
    let issue = "";
    let recommendation = "";

    // Check for wrapper discrepancy
    if (!apiResponse.isWrapped && mockHandler.usesApiResponseWrapper) {
      hasDiscrepancy = true;
      issue = "Mock uses ApiResponse<T> wrapper but real API returns raw data";
      recommendation = "Remove createMockApiResponse() wrapper and return raw data directly";
    } else if (apiResponse.isWrapped && !mockHandler.usesApiResponseWrapper) {
      hasDiscrepancy = true;
      issue = "Real API uses wrapper but mock returns raw data";
      recommendation = "Add appropriate wrapper to mock response";
    }

    // Check for structure type discrepancy
    const realIsArray = Array.isArray(apiResponse.responseBody);
    const mockIsArray = mockStructure.includes("Array");
    
    if (realIsArray !== mockIsArray) {
      hasDiscrepancy = true;
      issue += (issue ? " AND " : "") + "Array vs Object structure mismatch";
      recommendation += (recommendation ? " AND " : "") + `Mock should return ${realIsArray ? "array" : "object"}`;
    }

    return {
      endpoint: apiResponse.endpoint,
      realApiStructure: realStructure,
      mockStructure,
      hasDiscrepancy,
      issue: issue || "Structures match",
      recommendation: recommendation || "No changes needed",
      realSample: apiResponse.responseBody,
      mockSample: mockHandler.mockResponseSample
    };
  }

  private describeStructure(data: any, isWrapped: boolean): string {
    let base = "";
    
    if (Array.isArray(data)) {
      base = `Array<${data.length === 0 ? "unknown" : typeof data[0]}>`;
    } else if (typeof data === "object" && data !== null) {
      const keys = Object.keys(data);
      base = `Object{${keys.slice(0, 3).join(", ")}${keys.length > 3 ? "..." : ""}}`;
    } else {
      base = typeof data;
    }

    return isWrapped ? `Wrapped(${base})` : `Raw(${base})`;
  }

  generateReport(): string {
    const report = [
      "# API Structure Analysis Report",
      `Generated: ${new Date().toISOString()}`,
      `Total comparisons: ${this.comparisons.length}`,
      "",
      "## Executive Summary",
      ""
    ];

    // Summary statistics
    const discrepancies = this.comparisons.filter(c => c.hasDiscrepancy);
    const matches = this.comparisons.filter(c => !c.hasDiscrepancy);
    
    report.push(`- ✅ Structures match: ${matches.length}`);
    report.push(`- ❌ Discrepancies found: ${discrepancies.length}`);
    report.push("");

    // Key findings about wrapper usage
    const wrapperIssues = discrepancies.filter(c => c.issue.includes("wrapper"));
    if (wrapperIssues.length > 0) {
      report.push("### ⚠️  Critical Finding: Wrapper Usage Mismatch");
      report.push("");
      report.push("**The real Falcão API returns RAW responses without ApiResponse<T> wrapper, but our mocks use createMockApiResponse() which adds a wrapper.**");
      report.push("");
      report.push("This is the root cause of test inconsistencies. The real API structure is:");
      report.push("```");
      report.push("Real API: { sugestoes: [...], queriesRelated: [...] }");
      report.push("Our Mocks: { data: { sugestoes: [...], queriesRelated: [...] }, status: 200, timestamp: '...' }");
      report.push("```");
      report.push("");
    }

    report.push("## Detailed Comparisons");
    report.push("");

    this.comparisons.forEach((comparison, index) => {
      report.push(`### ${index + 1}. ${comparison.endpoint}`);
      report.push("");
      report.push(`**Status:** ${comparison.hasDiscrepancy ? "❌ DISCREPANCY" : "✅ MATCH"}`);
      report.push(`**Real API Structure:** ${comparison.realApiStructure}`);
      report.push(`**Mock Structure:** ${comparison.mockStructure}`);
      report.push("");
      
      if (comparison.hasDiscrepancy) {
        report.push(`**Issue:** ${comparison.issue}`);
        report.push(`**Recommendation:** ${comparison.recommendation}`);
        report.push("");
        
        report.push("**Real API Sample:**");
        report.push("```json");
        report.push(JSON.stringify(comparison.realSample, null, 2));
        report.push("```");
        report.push("");
        
        if (comparison.mockSample) {
          report.push("**Mock Code:**");
          report.push("```typescript");
          report.push(comparison.mockSample);
          report.push("```");
          report.push("");
        }
      }
    });

    // Action items
    report.push("## Recommended Actions");
    report.push("");
    
    if (wrapperIssues.length > 0) {
      report.push("### 1. Remove ApiResponse Wrapper from Mocks");
      report.push("- **Priority: HIGH**");
      report.push("- Replace all `createMockApiResponse(data)` with direct `data` return");
      report.push("- Update test helpers to not expect wrapped responses");
      report.push("- Verify client code handles raw responses correctly");
      report.push("");
    }

    const missingMocks = discrepancies.filter(c => c.mockStructure === "NO MOCK HANDLER");
    if (missingMocks.length > 0) {
      report.push("### 2. Create Missing Mock Handlers");
      report.push("- **Priority: MEDIUM**");
      missingMocks.forEach(comparison => {
        report.push(`- Add handler for ${comparison.endpoint}`);
      });
      report.push("");
    }

    return report.join("\n");
  }

  exportResults(): void {
    const outputDir = join(process.cwd(), "scripts", "analysis-output");

    // Write structure analysis report
    const reportPath = join(outputDir, "structure-analysis-report.md");
    writeFileSync(reportPath, this.generateReport());
    console.log(`📊 Structure analysis report written to: ${reportPath}`);

    // Write detailed comparisons
    const comparisonsPath = join(outputDir, "structure-comparisons.json");
    writeFileSync(comparisonsPath, JSON.stringify(this.comparisons, null, 2));
    console.log(`💾 Detailed comparisons written to: ${comparisonsPath}`);

    // Write action items
    const discrepancies = this.comparisons.filter(c => c.hasDiscrepancy);
    const actionItemsPath = join(outputDir, "action-items.json");
    const actionItems = {
      summary: {
        totalComparisons: this.comparisons.length,
        discrepancies: discrepancies.length,
        wrapperIssues: discrepancies.filter(c => c.issue.includes("wrapper")).length,
        missingMocks: discrepancies.filter(c => c.mockStructure === "NO MOCK HANDLER").length
      },
      actions: discrepancies.map(d => ({
        endpoint: d.endpoint,
        priority: d.issue.includes("wrapper") ? "HIGH" : "MEDIUM",
        issue: d.issue,
        recommendation: d.recommendation
      }))
    };
    writeFileSync(actionItemsPath, JSON.stringify(actionItems, null, 2));
    console.log(`📋 Action items written to: ${actionItemsPath}`);
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting API structure inspection...\n");
  
  try {
    const inspector = new StructureInspector();
    await inspector.analyzeMockHandlers();
    inspector.compareStructures();
    inspector.exportResults();
    
    console.log("\n✅ Structure inspection complete! Check scripts/analysis-output/ for results.");
  } catch (error) {
    console.error("\n❌ Inspection failed:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}