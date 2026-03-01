/**
 * A parsed document is the intermediate format between raw data sources
 * and the chunker. Each parser produces an array of these.
 *
 * `text` is the content to be chunked and embedded.
 * `metadata` travels with every chunk derived from this document and
 * enables citation + filtering at query time.
 */
export interface ParsedDocument {
  text: string;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  source: "linkedin" | "blog" | "project" | "resume";
  section: string;
  title: string;
  url?: string;
  tags?: string[];
  date?: string;
}

/**
 * A chunk is a ParsedDocument that has been split to fit within the
 * embedding model's token budget. The `id` is a deterministic hash
 * used for upsert deduplication in the vector store.
 */
export interface Chunk {
  id: string;
  text: string;
  metadata: ChunkMetadata;
}

/**
 * A chunk after embedding, ready for upsert into the vector store.
 */
export interface EmbeddedChunk extends Chunk {
  vector: number[];
}
