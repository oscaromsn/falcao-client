import { FalcaoClient } from "@falcao/api-client";
import { writeFileSync } from "fs";
import { join } from "path";

// Minimal client initialization - zero configuration required
const client = new FalcaoClient();

// Minimal search - just query and go
const results = await client.search.search(
  { texto: "gerente bancário jornada 8 horas acordo coletivo" },
  { page: 0, size: 10 }
);

console.log(`Found ${results.quantidadeTotal} documents`);
console.log(`First result: ${results.documentos[0]?.numeroProcesso}`);

// Save output to subdirectory
const outputPath = join(__dirname, "output", "gerente-bancario-jornada.json");
writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`Results saved to: ${outputPath}`);
