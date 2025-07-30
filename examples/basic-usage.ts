import { FalcaoClient } from "@falcao/api-client";

// Minimal client initialization - zero configuration required
const client = new FalcaoClient();

// Minimal search - just query and go
const results = await client.search.search(
  { texto: "gerente bancário jornada 8 horas acordo coletivo" },
  { page: 0, size: 10 }
);

console.log(`Found ${results.quantidadeTotal} documents`);
console.log(`First result: ${results.documentos[0]?.numeroProcesso}`);
