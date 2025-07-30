#!/usr/bin/env bun

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, basename, extname, join } from 'path';
import { dump as yamlDump } from 'js-yaml';

interface SchemaOptions {
  outputDir?: string;
  maxDepth?: number;
  arrayMaxItems?: number;
  stringMaxLength?: number;
  generateExamples?: boolean;
  verbose?: boolean;
}

// Analyze array items to detect mixed types
function analyzeArrayItems(array: any[], maxDepth: number, currentDepth: number): any {
  if (array.length === 0) return {};

  // Sample size for analysis - analyze more items for better type detection
  const sampleSize = Math.min(array.length, 20);
  const samples = array.slice(0, sampleSize);
  
  // Collect type information from samples
  const typeInfo = new Map<string, { schema: any; count: number; examples: any[] }>();
  
  for (const item of samples) {
    const itemSchema = generateSchemaFromData(item, maxDepth, currentDepth);
    const typeKey = getTypeKey(itemSchema);
    
    if (!typeInfo.has(typeKey)) {
      typeInfo.set(typeKey, { schema: itemSchema, count: 0, examples: [] });
    }
    
    const info = typeInfo.get(typeKey)!;
    info.count++;
    if (info.examples.length < 3) {
      info.examples.push(item);
    }
  }

  // If all items have the same type, return that type
  if (typeInfo.size === 1) {
    const [info] = typeInfo.values();
    
    // For objects, always run enhanced analysis for nullability
    if (info.schema.type === 'object' && info.schema.properties) {
      const enhancedProperties: Record<string, any> = {};
      const allKeys = new Set<string>();
      
      // Collect all possible keys from all objects
      samples.forEach(item => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          Object.keys(item).forEach(key => allKeys.add(key));
        }
      });

      // Analyze each field across all items
      for (const key of allKeys) {
        enhancedProperties[key] = analyzeFieldAcrossItems(samples, key, maxDepth, currentDepth);
      }

      return {
        type: 'object',
        properties: enhancedProperties,
        required: Object.keys(enhancedProperties).filter(key => {
          const prop = enhancedProperties[key];
          return !prop.nullable && prop.type !== 'null' && !Array.isArray(prop.type);
        })
      };
    }
    
    return info.schema;
  }

  // Always use enhanced analysis for objects, even with mixed types
  const hasObjects = Array.from(typeInfo.values()).some(info => info.schema.type === 'object');
  
  if (hasObjects) {
    const enhancedProperties: Record<string, any> = {};
    const allKeys = new Set<string>();
    
    // Collect all possible keys from all objects (ignore non-object items)
    samples.forEach(item => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        Object.keys(item).forEach(key => allKeys.add(key));
      }
    });

    // Analyze each field across all items
    for (const key of allKeys) {
      enhancedProperties[key] = analyzeFieldAcrossItems(samples, key, maxDepth, currentDepth);
    }

    return {
      type: 'object',
      properties: enhancedProperties,
      required: Object.keys(enhancedProperties).filter(key => {
        const prop = enhancedProperties[key];
        return !prop.nullable && prop.type !== 'null' && !Array.isArray(prop.type);
      })
    };
  }

  // For non-object mixed types, create a oneOf schema
  const schemas = Array.from(typeInfo.values()).map(info => {
    const schema = { ...info.schema };
    schema.description = `${info.count}/${sampleSize} items (${Math.round(info.count/sampleSize*100)}%)`;
    return schema;
  });

  return {
    oneOf: schemas,
    description: `Mixed types detected in array of ${array.length} items`
  };
}

// Generate a type key for grouping similar schemas
function getTypeKey(schema: any): string {
  if (schema.type === 'object') {
    // For objects, create key based on properties
    const propKeys = Object.keys(schema.properties || {}).sort();
    return `object:${propKeys.join(',')}`;
  }
  
  if (schema.type === 'array') {
    // For arrays, include item type information
    const itemType = schema.items?.type || 'unknown';
    return `array:${itemType}`;
  }
  
  // For primitives, just use the type
  return schema.type || 'unknown';
}

// Analyze field across multiple samples to determine nullability and best example
function analyzeFieldAcrossItems(items: any[], fieldName: string, maxDepth: number, currentDepth: number): any {
  const values = items.map(item => item?.[fieldName]).filter(val => val !== undefined);
  
  if (values.length === 0) {
    return { type: 'null' };
  }

  const nonNullValues = values.filter(val => val !== null);
  const nullCount = values.length - nonNullValues.length;
  const hasNulls = nullCount > 0;

  if (nonNullValues.length === 0) {
    return { type: 'null' };
  }

  // Calculate unique values count
  const uniqueValues = new Set();
  nonNullValues.forEach(val => {
    if (typeof val === 'object' && val !== null) {
      // For objects/arrays, use JSON stringification to check uniqueness
      uniqueValues.add(JSON.stringify(val));
    } else {
      uniqueValues.add(val);
    }
  });
  const uniqueCount = uniqueValues.size;

  // Generate schema from first non-null value
  const baseSchema = generateSchemaFromData(nonNullValues[0], maxDepth, currentDepth);
  
  // For objects, apply enhanced analysis recursively
  if (baseSchema.type === 'object' && baseSchema.properties && nonNullValues.length > 1) {
    const enhancedProperties: Record<string, any> = {};
    const allKeys = new Set<string>();
    
    // Collect all keys from non-null objects
    nonNullValues.forEach(obj => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        Object.keys(obj).forEach(key => allKeys.add(key));
      }
    });

    // Analyze each nested field across all non-null objects
    for (const key of allKeys) {
      enhancedProperties[key] = analyzeFieldAcrossItems(nonNullValues, key, maxDepth, currentDepth + 1);
    }

    const enhancedSchema = {
      type: 'object',
      properties: enhancedProperties,
      required: Object.keys(enhancedProperties).filter(key => {
        const prop = enhancedProperties[key];
        return !prop.nullable && prop.type !== 'null' && !Array.isArray(prop.type);
      })
    };

    // Always indicate nullability status explicitly
    if (hasNulls) {
      return {
        ...enhancedSchema,
        nullable: true,
        uniqueValues: uniqueCount
      };
    }

    return {
      ...enhancedSchema,
      nullable: false,
      uniqueValues: uniqueCount
    };
  }
  
  // For non-objects, handle normally
  if (hasNulls) {
    if (baseSchema.type) {
      return {
        type: baseSchema.type,
        nullable: true,
        uniqueValues: uniqueCount,
        ...baseSchema
      };
    }
  }

  // Explicitly mark as not nullable
  return {
    ...baseSchema,
    nullable: false,
    uniqueValues: uniqueCount
  };
}

// Custom JSON Schema generator
function generateSchemaFromData(data: any, maxDepth = 10, currentDepth = 0): any {
  if (currentDepth >= maxDepth) {
    return { type: 'object', description: 'Max depth reached' };
  }

  if (data === null) {
    return { type: 'null' };
  }

  if (data === undefined) {
    return { type: 'null' };
  }

  const type = typeof data;

  switch (type) {
    case 'boolean':
      return { type: 'boolean', example: data };

    case 'number':
      return {
        type: Number.isInteger(data) ? 'integer' : 'number',
        example: data
      };

    case 'string':
      return {
        type: 'string',
        example: data.length > 50 ? data.substring(0, 50) + '...' : data
      };

    case 'object':
      if (Array.isArray(data)) {
        if (data.length === 0) {
          return {
            type: 'array',
            items: {},
            example: []
          };
        }

        // Analyze multiple items to detect mixed types
        const itemSchemas = analyzeArrayItems(data, maxDepth, currentDepth + 1);
        
        return {
          type: 'array',
          items: itemSchemas,
          example: `Array of ${data.length} items`
        };
      }

      // Regular object - for single objects, we can't analyze nullability across multiple samples
      // so we'll mark based on current values only
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(data)) {
        const propSchema = generateSchemaFromData(value, maxDepth, currentDepth + 1);
        
        // For single object analysis, mark nullable based on current value
        if (value === null) {
          properties[key] = { type: 'null' };
        } else {
          properties[key] = {
            ...propSchema,
            nullable: false // Single object, current value is non-null
          };
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined
      };

    default:
      return { type: 'string', description: `Unknown type: ${type}` };
  }
}

function generateYamlSchema(jsonFilePath: string, options: SchemaOptions = {}) {
  const {
    outputDir = 'schemas',
    maxDepth = 10,
    arrayMaxItems = 3,
    stringMaxLength = 100,
    generateExamples = true,
    verbose = false
  } = options;

  try {
    // Validate input file
    if (!existsSync(jsonFilePath)) {
      throw new Error(`File not found: ${jsonFilePath}`);
    }

    if (verbose) console.log(`Reading JSON file: ${jsonFilePath}`);
    
    // Read and parse JSON
    const content = readFileSync(jsonFilePath, 'utf-8');
    const jsonData = JSON.parse(content);
    
    // Generate JSON Schema using custom implementation
    const jsonSchema = generateSchemaFromData(jsonData, maxDepth);
    
    // Add minimal metadata
    const enhancedSchema = {
      sourceFile: jsonFilePath,
      ...jsonSchema
    };

    // Create output directory if it doesn't exist
    const outputPath = resolve(outputDir);
    if (!existsSync(outputPath)) {
      const { mkdirSync } = require('fs');
      mkdirSync(outputPath, { recursive: true });
    }

    // Generate output file name
    const baseName = basename(jsonFilePath, extname(jsonFilePath));
    const schemaFileName = `${baseName}.schema.yaml`;
    const outputFile = join(outputPath, schemaFileName);

    // Convert to YAML with custom sorting for better readability
    const yamlContent = yamlDump(enhancedSchema, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: (a: string, b: string) => {
        // Define preferred field order
        const fieldOrder = ['sourceFile', 'type', 'nullable', 'uniqueValues', 'items', 'properties', 'required', 'oneOf', 'description', 'example'];
        
        const aIndex = fieldOrder.indexOf(a);
        const bIndex = fieldOrder.indexOf(b);
        
        // If both fields are in the preferred order, use that order
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // If only one field is in preferred order, it comes first
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // For other fields, use alphabetical order
        return a.localeCompare(b);
      }
    });

    // Write YAML schema file
    writeFileSync(outputFile, yamlContent, 'utf-8');

    if (verbose) {
      console.log(`✅ Schema generated successfully!`);
      console.log(`📁 Output: ${outputFile}`);
      console.log(`📊 File size: ${(content.length / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.log(`✅ Schema saved: ${outputFile}`);
    }

    return {
      success: true,
      inputFile: jsonFilePath,
      outputFile,
      schema: enhancedSchema
    };

  } catch (error) {
    console.error(`❌ Error processing ${jsonFilePath}:`, error);
    return {
      success: false,
      inputFile: jsonFilePath,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🔄 JSON to YAML Schema Converter

Usage:
  bun run scripts/json-to-yaml-schema.ts <json-file> [options]
  bun run scripts/json-to-yaml-schema.ts <pattern> [options]

Options:
  --output-dir <dir>     Output directory (default: schemas)
  --max-depth <number>   Maximum schema depth (default: 10)
  --verbose              Verbose output
  --help                 Show this help

Examples:
  bun run scripts/json-to-yaml-schema.ts data.json
  bun run scripts/json-to-yaml-schema.ts "examples/output/*.json" --verbose
  bun run scripts/json-to-yaml-schema.ts data.json --output-dir ./my-schemas
    `);
    process.exit(0);
  }

  if (args.includes('--help') || args.length === 0) {
    return;
  }

  const inputPattern = args[0];
  const options: SchemaOptions = {
    verbose: args.includes('--verbose')
  };

  // Parse options
  const outputDirIndex = args.indexOf('--output-dir');
  if (outputDirIndex !== -1 && args[outputDirIndex + 1]) {
    options.outputDir = args[outputDirIndex + 1];
  }

  const maxDepthIndex = args.indexOf('--max-depth');
  if (maxDepthIndex !== -1 && args[maxDepthIndex + 1]) {
    options.maxDepth = parseInt(args[maxDepthIndex + 1], 10);
  }

  // Handle glob patterns or single files
  if (inputPattern.includes('*')) {
    // Use glob pattern matching
    const { globSync } = require('glob');
    const files = globSync(inputPattern);
    
    if (files.length === 0) {
      console.error(`❌ No files found matching pattern: ${inputPattern}`);
      process.exit(1);
    }

    console.log(`🔍 Found ${files.length} files matching pattern: ${inputPattern}`);
    
    const results = files.map((file: string) => generateYamlSchema(file, options));
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n📊 Summary: ${successful} successful, ${failed} failed`);
    
    if (failed > 0) {
      console.log('\n❌ Failed files:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  ${r.inputFile}: ${r.error}`);
      });
    }

  } else {
    // Single file
    const result = generateYamlSchema(inputPattern, options);
    if (!result.success) {
      process.exit(1);
    }
  }
}

// Export for programmatic use
export { generateYamlSchema, type SchemaOptions };

// Run if called directly
if (import.meta.main) {
  main();
}