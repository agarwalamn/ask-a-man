import path from "path";
import dotenv from "dotenv";
import { parseResume } from "./parsers/resume-parser";
import { chunkDocuments } from "./chunker";
import { embedTexts } from "../src/lib/embeddings";
import { getVectorStore } from "../src/lib/vector-store";
import type { Chunk } from "../src/types/rag";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const DATA_DIR = path.resolve(__dirname, "../data");

async function main() {
  console.log("=== AI Portfolio Ingestion Pipeline ===\n");

  // --- Step 1: Parse resume ---
  console.log("Step 1: Parsing resume...\n");

  const resumePath = path.join(DATA_DIR, "resume.json");
  const allDocs = await parseResume(resumePath);
  console.log(`  Resume: ${allDocs.length} documents\n`);

  // --- Step 2: Chunk documents ---
  console.log("Step 2: Chunking documents...\n");

  const chunks: Chunk[] = chunkDocuments(allDocs);
  console.log(`  Total chunks: ${chunks.length}\n`);

  // --- Step 3: Embed chunks ---
  console.log(
    `Step 3: Embedding chunks (provider: ${process.env.EMBEDDING_PROVIDER ?? "ollama"})...\n`,
  );

  const texts = chunks.map((c) => c.text);
  const vectors = await embedTexts(texts);
  console.log(
    `  Embedded ${vectors.length} chunks (${vectors[0].length} dimensions)\n`,
  );

  // --- Step 4: Upsert into vector store ---
  const storeType = process.env.VECTOR_STORE ?? "local";
  console.log(`Step 4: Upserting to vector store (${storeType})...\n`);

  const store = getVectorStore();
  const items = chunks.map((chunk, i) => ({
    id: chunk.id,
    vector: vectors[i],
    metadata: { ...chunk.metadata, text: chunk.text },
  }));
  await store.upsert(items);
  console.log(`  Upserted ${items.length} vectors\n`);

  // --- Summary ---
  const bySource = chunks.reduce(
    (acc, c) => {
      acc[c.metadata.source] = (acc[c.metadata.source] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log("=== Summary ===");
  console.log(`Total chunks: ${chunks.length}`);
  console.log("By source:", bySource);
  console.log(`Vector dimensions: ${vectors[0].length}`);
  console.log(
    `Avg chunk length: ${Math.round(texts.reduce((sum, t) => sum + t.length, 0) / texts.length)} chars`,
  );
  console.log("\n✓ Ingestion complete. Data is ready for querying.");
}

main().catch(console.error);
