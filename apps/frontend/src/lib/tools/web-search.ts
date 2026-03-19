/**
 * Web Search Tool - Tavily API
 *
 * Searches the web and fetches content for research tasks.
 */

interface WebSearchParams {
  query: string;
  max_results?: number;
  topic?: "general" | "news" | "finance";
}

export async function executeWebSearch(params: WebSearchParams) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return { error: "TAVILY_API_KEY not configured", results: [] };
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query: params.query,
      max_results: params.max_results || 3,
      topic: params.topic || "general",
      include_answer: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily search failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  const results = (data.results || []).map(
    (r: { title: string; url: string; content: string }) => ({
      title: r.title,
      url: r.url,
      content: r.content,
    }),
  );

  return {
    answer: data.answer || null,
    results,
    query: params.query,
  };
}
