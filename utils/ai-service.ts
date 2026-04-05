/**
 * AI Service for Movie Debate Settler
 * 
 * Supports multiple AI providers:
 * 1. Google Gemini via Supabase Edge Functions - RECOMMENDED
 * 2. Groq (FREE tier with rate limits)
 * 3. Puter.js (User pays, developer free)
 * 
 * To use Gemini safely:
 * 1. Go to https://aistudio.google.com/apikey
 * 2. Create a Gemini API key in Google AI Studio
 * 3. Add it to Supabase Edge Function secrets as GEMINI_API_KEY
 * 4. Do not expose it with EXPO_PUBLIC_* in the client
 */

import type { AIVerdict } from "@/types"
import { supabase } from "@/lib/supabase"

// API Keys from environment
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY

// Determine which provider to use
type AIProvider = "gemini" | "groq" | "puter"

const getActiveProvider = (): AIProvider => {
  // Prefer server-side Gemini via Supabase Edge Function.
  // This avoids shipping API keys in the client.
  return "gemini"
  if (GROQ_API_KEY) return "groq"
  return "puter" // Fallback to Puter.js (user pays)
}

// Build the prompt for movie debate settlement
const buildDebatePrompt = (hostPreferences: string, partnerPreferences: string): string => {
  return `You are a romantic movie recommendation AI helping a couple find the perfect movie for their date night.

Partner 1 wants: "${hostPreferences}"
Partner 2 wants: "${partnerPreferences}"

Analyze both preferences and provide a JSON response with exactly this structure:
{
  "recommendation": "The single best movie title that would make both partners happy",
  "reasoning": "A romantic, warm explanation of why this movie is perfect for them both (2-3 sentences)",
  "compatibilityScore": 85,
  "compromiseOptions": ["Movie 1", "Movie 2", "Movie 3"],
  "movieSuggestions": [
    {"title": "Movie Name", "reason": "Why it's perfect for them"},
    {"title": "Movie Name 2", "reason": "Why it's a great choice"},
    {"title": "Movie Name 3", "reason": "Another wonderful option"}
  ],
  "coupleInsight": "A sweet observation about what their preferences reveal about them as a couple (1-2 sentences)"
}

Be warm, romantic, and encouraging. This is for couples having a cozy movie night together.
Use real movie titles that actually exist.
Respond ONLY with valid JSON, no markdown or extra text.`
}

// Gemini via Supabase Edge Function (server-side key)
const callGeminiAPI = async (prompt: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke("super-function", {
    body: { prompt },
  })

  if (error) {
    throw new Error(error.message || "Edge Function error")
  }

  // The Edge Function returns JSON already; turn it back into string for the existing parser.
  return JSON.stringify(data ?? {})
}

// Groq API (FREE tier available)
const callGroqAPI = async (prompt: string): Promise<string> => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a helpful movie recommendation assistant for couples. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Groq API error: ${error}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ""
}

// Puter.js API (User pays - inject via WebView)
// This requires the Puter.js SDK to be loaded in a WebView
const callPuterAPI = async (prompt: string): Promise<string> => {
  // For React Native, Puter.js requires a WebView bridge
  // This is a placeholder - in production, use a WebView component
  throw new Error("Puter.js requires WebView integration. Prefer Gemini through the Supabase Edge Function instead.")
}

// Parse AI response to structured verdict
const parseAIResponse = (response: string): AIVerdict => {
  // Clean up response - remove markdown code blocks if present
  let cleaned = response.trim()
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7)
  }
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3)
  }
  cleaned = cleaned.trim()

  try {
    const parsed = JSON.parse(cleaned)
    
    // Validate required fields
    return {
      recommendation: parsed.recommendation || "The Notebook",
      reasoning: parsed.reasoning || "A beautiful choice for your movie night together.",
      compatibilityScore: Math.min(100, Math.max(0, parsed.compatibilityScore || 85)),
      compromiseOptions: Array.isArray(parsed.compromiseOptions) 
        ? parsed.compromiseOptions.slice(0, 3) 
        : ["La La Land", "About Time", "Crazy Rich Asians"],
      movieSuggestions: Array.isArray(parsed.movieSuggestions)
        ? parsed.movieSuggestions.slice(0, 3).map((m: any) => ({
            title: m.title || "Movie",
            reason: m.reason || "Great choice!",
            posterPath: m.posterPath,
            tmdbId: m.tmdbId,
          }))
        : [
            { title: "La La Land", reason: "A magical musical romance" },
            { title: "The Notebook", reason: "A timeless love story" },
            { title: "About Time", reason: "Heartwarming with a touch of magic" },
          ],
      coupleInsight: parsed.coupleInsight || "You two have wonderful taste in movies!",
    }
  } catch (e) {
    console.error("[AI Service] Failed to parse response:", e)
    // Return fallback verdict
    return {
      recommendation: "La La Land",
      reasoning: "This magical musical romance is perfect for couples who appreciate both emotion and artistry.",
      compatibilityScore: 88,
      compromiseOptions: ["The Notebook", "Crazy Rich Asians", "About Time"],
      movieSuggestions: [
        { title: "La La Land", reason: "A beautiful blend of romance, music, and dreams" },
        { title: "The Notebook", reason: "A timeless love story" },
        { title: "About Time", reason: "Heartwarming with just the right touch of magic" },
      ],
      coupleInsight: "You both appreciate stories with heart and beautiful storytelling!",
    }
  }
}

// Main function to settle debate
export const settleDebateWithAI = async (
  hostPreferences: string,
  partnerPreferences: string
): Promise<{ success: boolean; verdict?: AIVerdict; error?: string; provider: AIProvider }> => {
  const provider = getActiveProvider()
  const prompt = buildDebatePrompt(hostPreferences, partnerPreferences)

  try {
    let response: string

    switch (provider) {
      case "gemini":
        response = await callGeminiAPI(prompt)
        break
      case "groq":
        response = await callGroqAPI(prompt)
        break
      case "puter":
        response = await callPuterAPI(prompt)
        break
      default:
        throw new Error("No AI provider configured")
    }

    const verdict = parseAIResponse(response)
    return { success: true, verdict, provider }
  } catch (error: any) {
    console.error(`[AI Service] Error with ${provider}:`, error)
    return { 
      success: false, 
      error: error.message || "Failed to get AI response", 
      provider 
    }
  }
}

// Check if AI is configured
export const isAIConfigured = (): boolean => {
  // Gemini is expected to be configured server-side via Supabase secrets.
  return true
}

// Get active provider name for display
export const getAIProviderName = (): string => {
  const provider = getActiveProvider()
  switch (provider) {
    case "gemini":
      return "Google Gemini"
    case "groq":
      return "Groq"
    case "puter":
      return "Puter AI"
    default:
      return "AI"
  }
}
