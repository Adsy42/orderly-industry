"use client";

import * as React from "react";
import type { NlToIqlTranslation } from "@/types/playbook";

interface UseIqlTranslateOptions {
  onSuccess?: (result: NlToIqlTranslation) => void;
  onError?: (error: string) => void;
}

interface UseIqlTranslateReturn {
  translate: (query: string) => Promise<NlToIqlTranslation | null>;
  isTranslating: boolean;
  error: string | null;
  result: NlToIqlTranslation | null;
  reset: () => void;
}

export function useIqlTranslate(
  options?: UseIqlTranslateOptions,
): UseIqlTranslateReturn {
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<NlToIqlTranslation | null>(null);

  const translate = React.useCallback(
    async (query: string): Promise<NlToIqlTranslation | null> => {
      if (!query.trim()) {
        setError("Please enter a search query");
        return null;
      }

      setIsTranslating(true);
      setError(null);
      setResult(null);

      try {
        const response = await fetch("/api/iql/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: query.trim(),
          }),
        });

        if (!response.ok) {
          let errorData: Record<string, unknown> = {};
          try {
            errorData = await response.json();
          } catch {
            errorData = {
              error: `Translation failed (HTTP ${response.status})`,
            };
          }

          const errorMessage =
            (errorData.message as string) ||
            (errorData.error as string) ||
            "Could not translate query. Please try rephrasing.";

          setError(errorMessage);
          options?.onError?.(errorMessage);
          return null;
        }

        const translationResult = await response.json();

        const result: NlToIqlTranslation = {
          iql: translationResult.iql,
          explanation: translationResult.explanation || "",
          templatesUsed: translationResult.templatesUsed || [],
          confidence: translationResult.confidence ?? 0.85,
        };

        setResult(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Translation failed. Please try again.";
        setError(errorMessage);
        options?.onError?.(errorMessage);
        return null;
      } finally {
        setIsTranslating(false);
      }
    },
    [options],
  );

  const reset = React.useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return {
    translate,
    isTranslating,
    error,
    result,
    reset,
  };
}
