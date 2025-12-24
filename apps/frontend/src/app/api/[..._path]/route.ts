import { initApiPassthrough } from "langgraph-nextjs-api-passthrough";

// This file acts as a proxy for requests to your LangGraph server.
// Read the [Going to Production](https://github.com/langchain-ai/agent-chat-ui?tab=readme-ov-file#going-to-production) section for more information.

// For local development, proxy to localhost:2024
// For production, use LANGGRAPH_API_URL (LangSmith deployment) with LANGSMITH_API_KEY
const apiUrl = process.env.LANGGRAPH_API_URL || "http://localhost:2024";
const apiKey = process.env.LANGSMITH_API_KEY || undefined;

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS, runtime } =
  initApiPassthrough({
    apiUrl,
    apiKey,
    runtime: "edge",
  });
