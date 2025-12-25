import { NextRequest, NextResponse } from "next/server";

// This file acts as a proxy for requests to your LangGraph server.
// Custom implementation that forwards the Authorization header for JWT auth.

// For local development, proxy to localhost:2024
// For production, use LANGGRAPH_API_URL (LangSmith deployment) with LANGSMITH_API_KEY
const API_URL = process.env.LANGGRAPH_API_URL || "http://localhost:2024";
const API_KEY = process.env.LANGSMITH_API_KEY || "";

export const runtime = "edge";

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

async function handleRequest(req: NextRequest, method: string) {
  try {
    // Extract path after /api/
    const path = req.nextUrl.pathname.replace(/^\/?api\//, "");

    // Build query string
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);
    searchParams.delete("_path");
    searchParams.delete("nxtP_path");
    const queryString = searchParams.toString()
      ? `?${searchParams.toString()}`
      : "";

    // Build headers - forward Authorization header from the original request
    const headers: Record<string, string> = {};

    // Add LangSmith API key if available (for deployed graphs)
    if (API_KEY) {
      headers["x-api-key"] = API_KEY;
    }

    // Forward Authorization header from browser (contains Supabase JWT)
    const authHeader = req.headers.get("authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    // Forward Content-Type
    const contentType = req.headers.get("content-type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    const options: RequestInit = {
      method,
      headers,
    };

    // Forward body for methods that support it
    if (["POST", "PUT", "PATCH"].includes(method)) {
      options.body = await req.text();
    }

    const targetUrl = `${API_URL}/${path}${queryString}`;
    const res = await fetch(targetUrl, options);

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: {
        ...Object.fromEntries(res.headers.entries()),
        ...getCorsHeaders(),
      },
    });
  } catch (e) {
    const error = e as Error;
    console.error("[API Passthrough] Error:", error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: getCorsHeaders() },
    );
  }
}

export async function GET(req: NextRequest) {
  return handleRequest(req, "GET");
}

export async function POST(req: NextRequest) {
  return handleRequest(req, "POST");
}

export async function PUT(req: NextRequest) {
  return handleRequest(req, "PUT");
}

export async function PATCH(req: NextRequest) {
  return handleRequest(req, "PATCH");
}

export async function DELETE(req: NextRequest) {
  return handleRequest(req, "DELETE");
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}
