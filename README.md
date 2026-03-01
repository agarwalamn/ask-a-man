# ask-a-man

A chat-first AI portfolio website that answers questions about my career using Retrieval-Augmented Generation (RAG). Instead of a traditional static portfolio, visitors interact with an AI assistant that has been trained on my resume, work history, projects, and blog posts.

Built with Next.js, TypeScript, and the Vercel AI SDK.

## How It Works

```
 Your Data                    Ingestion Pipeline                 Vector Store
 ─────────                    ──────────────────                 ────────────
 resume.pdf  ─┐               ┌─ Parse ─ Chunk ─ Embed ─────────▶  vectra
 linkedin.json─┤──▶ ingest.ts─┤                                  (or Pinecone)
 projects.json─┤               └──────────────────────────────────────────────
 blog/*.md   ─┘

 User Question                   Query Pipeline                   Response
 ─────────────                   ──────────────                   ────────
 "What's your                ┌─ Embed query                   Streamed answer
  tech stack?" ──▶ /api/chat─┤─ Similarity search              grounded in
                             ├─ Sanitize context (PII guard)   your real data
                             └─ Stream LLM response ──────────▶ to the browser
```

**Ingestion** parses your data sources into chunks, embeds them into vectors, and stores them locally. **At query time**, the user's question is embedded, the most relevant chunks are retrieved, and an LLM generates a response grounded in that context -- streamed in real time to the UI.

## Tech Stack

| Layer               | Technology                       |
| ------------------- | -------------------------------- |
| Framework           | Next.js 16 (App Router)          |
| Language            | TypeScript                       |
| Styling             | Tailwind CSS 4                   |
| AI SDK              | Vercel AI SDK v6                 |
| LLM (dev)           | Ollama (Mistral)                 |
| LLM (prod)          | Google Gemini / Anthropic Claude |
| Embeddings (dev)    | Ollama (nomic-embed-text)        |
| Embeddings (prod)   | Google text-embedding-004        |
| Vector Store (dev)  | vectra (local file-based)        |
| Vector Store (prod) | Pinecone                         |
| PDF Parsing         | pdf-parse                        |
| Markdown            | react-markdown + remark-gfm      |

## Project Structure

```
ask-a-man/
├── data/                       # Raw data sources
│   ├── blog/                   #   Markdown blog posts
│   ├── linkedin.json           #   LinkedIn profile (structured JSON)
│   ├── projects.json           #   Project portfolio
│   └── resume.pdf              #   PDF resume
├── scripts/                    # Ingestion pipeline
│   ├── ingest.ts               #   Orchestrator: parse → chunk → embed → store
│   ├── chunker.ts              #   Recursive character splitter
│   └── parsers/
│       ├── linkedin-parser.ts  #   LinkedIn JSON → ParsedDocument[]
│       ├── markdown-parser.ts  #   Blog Markdown → ParsedDocument[]
│       ├── projects-parser.ts  #   Projects JSON → ParsedDocument[]
│       └── resume-parser.ts    #   PDF resume → ParsedDocument[]
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts   #   Chat API endpoint (RAG + streaming)
│   │   ├── page.tsx            #   Main chat UI
│   │   ├── layout.tsx          #   Root layout + metadata
│   │   └── globals.css         #   Theme (dark, teal accent)
│   ├── components/
│   │   └── chat/
│   │       └── markdown-message.tsx  # Markdown renderer for LLM responses
│   ├── lib/
│   │   ├── embeddings.ts       #   Embedding model abstraction (Ollama/Google)
│   │   ├── llm.ts              #   Chat LLM abstraction (Ollama/Gemini/Claude)
│   │   ├── rag/
│   │   │   ├── retriever.ts    #   Embed query → vector search → top-k chunks
│   │   │   ├── context-builder.ts  # Format chunks for the LLM prompt
│   │   │   └── prompt-templates.ts # System prompt with strict grounding rules
│   │   ├── safety/
│   │   │   ├── pii-patterns.ts #   Regex patterns for PII detection
│   │   │   ├── redacted-fields.ts  # Explicit blocklist of private values
│   │   │   ├── input-guard.ts  #   Sanitize context before it reaches the LLM
│   │   │   └── output-guard.ts #   Scan + redact PII from streamed output
│   │   └── vector-store/
│   │       ├── types.ts        #   VectorStore interface
│   │       ├── local-store.ts  #   vectra implementation (dev)
│   │       ├── pinecone-client.ts  # Pinecone implementation (prod)
│   │       └── index.ts        #   Factory: returns store based on env var
│   └── types/
│       └── rag.ts              #   Core types: ParsedDocument, Chunk, etc.
└── .env.local                  #   Environment config (LLM, embeddings, store)
```

## Getting Started

### Prerequisites

- Node.js 20+
- [Ollama](https://ollama.com/) installed and running (for local development)

### 1. Install dependencies

```bash
npm install
```

### 2. Pull Ollama models

```bash
ollama pull mistral
ollama pull nomic-embed-text
```

### 3. Configure environment

Copy the example env file and adjust if needed:

```bash
cp .env.example .env.local
```

Default configuration uses Ollama locally -- no API keys required for development.

### 4. Add your data

Place your files in the `data/` directory:

- `data/resume.pdf` -- your PDF resume
- `data/linkedin.json` -- your LinkedIn profile data (see existing file for schema)
- `data/projects.json` -- your project portfolio (see existing file for schema)
- `data/blog/*.md` -- any blog posts in Markdown with YAML frontmatter

### 5. Run the ingestion pipeline

```bash
npm run ingest
```

This parses all data sources, chunks them, generates embeddings via Ollama, and stores vectors locally in `.vector-index/`.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start chatting.

## Privacy & Safety

The system implements a multi-layered defense against PII leakage:

1. **Input Guard** -- Scrubs PII from retrieved context chunks before the LLM ever sees them
2. **System Prompt** -- Explicitly instructs the LLM to never output private information
3. **Output Guard** -- A streaming transform that scans and redacts PII patterns from the LLM response before it reaches the browser

## Switching to Production

To deploy with a cloud LLM and managed vector store, update `.env.local`:

```env
LLM_PROVIDER=google           # or "anthropic"
GOOGLE_API_KEY=your-key-here

EMBEDDING_PROVIDER=google
GOOGLE_API_KEY=your-key-here

VECTOR_STORE=pinecone
PINECONE_API_KEY=your-key-here
PINECONE_INDEX_NAME=ask-a-man
```

Then re-run `npm run ingest` to populate Pinecone and deploy to Vercel.

## License

Private project. Not licensed for redistribution.
