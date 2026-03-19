import type { AppMessage } from "@/providers/Stream";

export const DO_NOT_RENDER_ID_PREFIX = "do-not-render-";

/**
 * This function is kept for backward compatibility but is no longer needed
 * with Vercel AI SDK since it handles tool call/response pairing automatically.
 */
export function ensureToolCallsHaveResponses(
  _messages: AppMessage[],
): AppMessage[] {
  return [];
}
