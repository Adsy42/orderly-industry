import { NextRequest, NextResponse } from "next/server";

const ISAACUS_API_KEY = process.env.ISAACUS_API_KEY;
const ISAACUS_BASE_URL =
  process.env.ISAACUS_BASE_URL || "https://api.isaacus.com";

export async function POST(request: NextRequest) {
  try {
    if (!ISAACUS_API_KEY) {
      return NextResponse.json(
        { error: "Isaacus API key not configured" },
        { status: 500 },
      );
    }

    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Call Isaacus embedding API
    const response = await fetch(`${ISAACUS_BASE_URL}/embed`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ISAACUS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        texts: [text],
        model: "legal-embed-v1",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Isaacus API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: response.status },
      );
    }

    const data = await response.json();
    const embedding = data.embeddings?.[0];

    if (!embedding) {
      return NextResponse.json(
        { error: "No embedding returned" },
        { status: 500 },
      );
    }

    return NextResponse.json({ embedding });
  } catch (error) {
    console.error("Embed API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
