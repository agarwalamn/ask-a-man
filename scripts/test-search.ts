import path from "path";
import dotenv from "dotenv";
import { embedTexts } from "../src/lib/embeddings";
import { getVectorStore } from "../src/lib/vector-store";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function main() {
  const store = getVectorStore();
  const query = "What technologies does Aman work with?";
  const [qVec] = await embedTexts([query]);
  const results = await store.query(qVec, 3);

  console.log("Query:", query);
  console.log("---");
  for (const r of results) {
    console.log("Score:", r.score.toFixed(3), "| Section:", r.metadata.section);
    const text = (r.metadata.text ?? r.text ?? "") as string;
    console.log("Text:", text.slice(0, 200), "...");
    console.log("---");
  }
}

main().catch(console.error);
