#!/usr/bin/env bun

/**
 * HAR File Analysis Script
 * 
 * Analyzes the HAR file to extract real API responses and document their structure.
 * This helps us understand the actual API response format to create accurate mocks.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface HarEntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    headers: Array<{ name: string; value: string }>;
    queryString: Array<{ name: string; value: string }>;
    postData?: {
      mimeType: string;
      text: string;
    };
  };
  response: {
    status: number;
    statusText: string;
    headers: Array<{ name: string; value: string }>;
    content: {
      size: number;
      mimeType: string;
      text?: string;
      encoding?: string;
    };
  };
}

interface HarFile {
  log: {
    version: string;
    creator: { name: string; version: string };
    entries: HarEntry[];
  };
}

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

class HarAnalyzer {
  private harData: HarFile;
  private apiResponses: ApiResponse[] = [];

  constructor(harFilePath: string) {
    console.log(`📖 Reading HAR file: ${harFilePath}`);
    const harContent = readFileSync(harFilePath, "utf-8");
    this.harData = JSON.parse(harContent);
    console.log(`✅ Found ${this.harData.log.entries.length} network entries`);
  }

  analyze(): void {
    console.log("\n🔍 Analyzing API responses...");
    
    const apiBaseUrls = [
      "jurisprudencia-nacional-backend",
      "/no-auth/",
      "/api/",
      "/perfil/",
      "/notificacoes",
      "/statusCache",
      "/logAcesso",
      "/pesquisasFavoritas"
    ];

    for (const entry of this.harData.log.entries) {
      const url = entry.request.url;
      
      // Check if this is an API call
      const isApiCall = apiBaseUrls.some(baseUrl => url.includes(baseUrl));
      
      if (isApiCall && entry.response.content.text) {
        try {
          const response = this.parseApiResponse(entry);
          if (response) {
            this.apiResponses.push(response);
            console.log(`📝 Captured API response: ${response.method} ${response.endpoint}`);
          }
        } catch (error) {
          console.warn(`⚠️  Failed to parse response from ${url}: ${error}`);
        }
      }
    }

    console.log(`\n✅ Analyzed ${this.apiResponses.length} API responses`);
  }

  private parseApiResponse(entry: HarEntry): ApiResponse | null {
    const { request, response } = entry;
    
    if (!response.content.text) return null;

    // Parse headers
    const requestHeaders: Record<string, string> = {};
    request.headers.forEach(h => requestHeaders[h.name.toLowerCase()] = h.value);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach(h => responseHeaders[h.name.toLowerCase()] = h.value);

    // Parse query parameters
    const queryParams: Record<string, string> = {};
    request.queryString.forEach(q => queryParams[q.name] = q.value);

    // Parse request body
    let requestBody;
    if (request.postData?.text) {
      try {
        requestBody = JSON.parse(request.postData.text);
      } catch {
        requestBody = request.postData.text;
      }
    }

    // Parse response body
    let responseBody;
    let responseText = response.content.text;
    
    // Handle base64 encoded responses
    if (response.content.encoding === "base64") {
      responseText = Buffer.from(responseText, "base64").toString("utf-8");
    }

    try {
      responseBody = JSON.parse(responseText);
    } catch {
      // Not JSON, keep as text
      responseBody = responseText;
    }

    // Analyze wrapper structure
    const { isWrapped, wrapperStructure } = this.analyzeWrapperStructure(responseBody);

    // Extract clean endpoint path
    const url = new URL(request.url);
    let endpoint = url.pathname;
    if (url.search) {
      endpoint += url.search;
    }

    return {
      endpoint,
      method: request.method,
      status: response.status,
      requestHeaders,
      responseHeaders,
      queryParams,
      requestBody,
      responseBody,
      responseSize: response.content.size,
      timestamp: entry.startedDateTime,
      isWrapped,
      wrapperStructure
    };
  }

  private analyzeWrapperStructure(responseBody: any): { isWrapped: boolean; wrapperStructure?: string } {
    if (!responseBody || typeof responseBody !== "object") {
      return { isWrapped: false };
    }

    // Check for common wrapper patterns
    const keys = Object.keys(responseBody);
    
    // Check for ApiResponse<T> pattern: { data, status?, timestamp? }
    if (keys.includes("data")) {
      const otherKeys = keys.filter(k => k !== "data");
      const wrapperKeys = otherKeys.filter(k => ["status", "timestamp", "message", "error"].includes(k));
      
      if (wrapperKeys.length > 0) {
        return {
          isWrapped: true,
          wrapperStructure: `{ data: T, ${wrapperKeys.join(", ")} }`
        };
      }
    }

    // Check for error response pattern
    if (keys.includes("timestamp") && keys.includes("status") && keys.includes("error")) {
      return {
        isWrapped: true,
        wrapperStructure: "ErrorResponse"
      };
    }

    // Check for pagination pattern
    if (keys.includes("content") && keys.includes("totalElements")) {
      return {
        isWrapped: true,
        wrapperStructure: "PaginatedResponse<T>"
      };
    }

    return { isWrapped: false };
  }

  generateReport(): string {
    const report = [
      "# API Response Analysis Report",
      `Generated: ${new Date().toISOString()}`,
      `Total API responses analyzed: ${this.apiResponses.length}`,
      "",
      "## Summary",
      "",
      "### Response Wrapper Analysis",
      ""
    ];

    // Analyze wrapper patterns
    const wrapperStats = this.apiResponses.reduce((stats, response) => {
      if (response.isWrapped) {
        const structure = response.wrapperStructure || "unknown";
        stats[structure] = (stats[structure] || 0) + 1;
      } else {
        stats["raw"] = (stats["raw"] || 0) + 1;
      }
      return stats;
    }, {} as Record<string, number>);

    Object.entries(wrapperStats).forEach(([structure, count]) => {
      report.push(`- **${structure}**: ${count} responses`);
    });

    report.push("", "## Endpoint Analysis", "");

    // Group by endpoint pattern
    const endpointGroups = this.groupByEndpointPattern();
    
    Object.entries(endpointGroups).forEach(([pattern, responses]) => {
      report.push(`### ${pattern}`);
      report.push("");
      
      responses.forEach((response, index) => {
        report.push(`#### Example ${index + 1}: ${response.method} ${response.endpoint}`);
        report.push("");
        report.push("**Request:**");
        if (Object.keys(response.queryParams).length > 0) {
          report.push("```");
          report.push(`Query Parameters: ${JSON.stringify(response.queryParams, null, 2)}`);
          report.push("```");
        }
        if (response.requestBody) {
          report.push("```json");
          report.push(JSON.stringify(response.requestBody, null, 2));
          report.push("```");
        }
        
        report.push("");
        report.push("**Response:**");
        report.push(`- Status: ${response.status}`);
        report.push(`- Size: ${response.responseSize} bytes`);
        report.push(`- Wrapped: ${response.isWrapped}`);
        if (response.wrapperStructure) {
          report.push(`- Wrapper: ${response.wrapperStructure}`);
        }
        
        if (response.responseBody && typeof response.responseBody === "object") {
          report.push("```json");
          report.push(JSON.stringify(response.responseBody, null, 2));
          report.push("```");
        }
        
        report.push("");
      });
    });

    return report.join("\n");
  }

  private groupByEndpointPattern(): Record<string, ApiResponse[]> {
    const groups: Record<string, ApiResponse[]> = {};
    
    this.apiResponses.forEach(response => {
      // Extract pattern from endpoint
      let pattern = response.endpoint;
      
      // Normalize patterns
      pattern = pattern.replace(/\/\d+/g, "/:id");
      pattern = pattern.replace(/\?.*/, "");
      
      if (!groups[pattern]) {
        groups[pattern] = [];
      }
      groups[pattern].push(response);
    });

    return groups;
  }

  exportResponses(): void {
    const outputDir = join(process.cwd(), "scripts", "analysis-output");
    
    // Create output directory
    try {
      require("fs").mkdirSync(outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Write detailed analysis
    const reportPath = join(outputDir, "api-analysis-report.md");
    writeFileSync(reportPath, this.generateReport());
    console.log(`📊 Analysis report written to: ${reportPath}`);

    // Write raw response data
    const dataPath = join(outputDir, "api-responses.json");
    writeFileSync(dataPath, JSON.stringify(this.apiResponses, null, 2));
    console.log(`💾 Raw response data written to: ${dataPath}`);

    // Write summary for quick reference
    const summaryPath = join(outputDir, "response-summary.json");
    const summary = {
      totalResponses: this.apiResponses.length,
      endpointPatterns: Object.keys(this.groupByEndpointPattern()),
      wrapperPatterns: this.apiResponses.reduce((patterns, response) => {
        if (response.isWrapped && response.wrapperStructure) {
          patterns.add(response.wrapperStructure);
        } else if (!response.isWrapped) {
          patterns.add("raw");
        }
        return patterns;
      }, new Set<string>()),
      statusCodes: [...new Set(this.apiResponses.map(r => r.status))].sort(),
    };
    
    writeFileSync(summaryPath, JSON.stringify({
      ...summary,
      wrapperPatterns: Array.from(summary.wrapperPatterns)
    }, null, 2));
    console.log(`📋 Summary written to: ${summaryPath}`);
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting HAR file analysis...\n");
  
  const harFilePath = join(process.cwd(), "debug_artifacts", "network", "requests.har");
  
  try {
    const analyzer = new HarAnalyzer(harFilePath);
    analyzer.analyze();
    analyzer.exportResponses();
    
    console.log("\n✅ Analysis complete! Check scripts/analysis-output/ for results.");
  } catch (error) {
    console.error("\n❌ Analysis failed:", error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}