import { NextRequest, NextResponse } from "next/server";
import { embed } from "@/lib/isaacus";

/**
 * Embedding API Route
 *
 * Generates embeddings for text using Isaacus Kanon 2 Embedder.
 *
 * @see https://docs.isaacus.com/capabilities/embedding
 */
export async function POST(request: NextRequest) {
  try {
    const { text, task = "retrieval/document" } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Generate embedding using shared Isaacus client
    const embeddings = await embed(
      [text],
      task as "retrieval/query" | "retrieval/document",
    );
    const embedding = embeddings[0];

    if (!embedding) {
      return NextResponse.json(
        { error: "No embedding returned" },
        { status: 500 },
      );
    }

    return NextResponse.json({ embedding });
  } catch (error) {
    console.error("Embed API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
