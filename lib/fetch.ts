import { useState, useEffect, useCallback } from "react";

export const fetchAPI = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);

    const rawText = await response.text();

    if (!response.ok) {
      // Try to parse error JSON, but fall back to text without throwing JSON errors
      let errorBody: unknown = rawText;
      try {
        errorBody = rawText ? JSON.parse(rawText) : rawText;
      } catch {
        // ignore JSON parse errors, keep text body
      }

      const errorMessage =
        typeof errorBody === "object" && errorBody !== null && "message" in errorBody
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (errorBody as any).message
          : rawText || `HTTP error! status: ${response.status}`;

      throw new Error(String(errorMessage));
    }

    if (!rawText) {
      return null;
    }

    try {
      return JSON.parse(rawText);
    } catch {
      // Non-JSON success payload, return as text to avoid crashing
      return rawText;
    }
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const useFetch = <T>(url: string, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchAPI(url, options);
      setData(result.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
