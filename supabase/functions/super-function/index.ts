// Rate limiting utility for Supabase Edge Functions
interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now()
    const entry = this.limits.get(identifier)

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return false
    }

    if (entry.count >= this.maxRequests) {
      return true
    }

    entry.count++
    return false
  }

  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier)
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - entry.count)
  }

  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier)
    return entry?.resetTime || 0
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter(60000, 10) // 10 requests per minute

function checkRateLimit(req: Request): { allowed: boolean; remaining: number; resetTime: number } {
  // Get client IP or user identifier
  const clientIP = req.headers.get('CF-Connecting-IP') ||
                   req.headers.get('X-Forwarded-For') ||
                   req.headers.get('X-Real-IP') ||
                   'unknown'

  const allowed = !rateLimiter.isRateLimited(clientIP)
  const remaining = rateLimiter.getRemainingRequests(clientIP)
  const resetTime = rateLimiter.getResetTime(clientIP)

  return { allowed, remaining, resetTime }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Rate limiting check
  const rateLimitResult = checkRateLimit(req);
  if (!rateLimitResult.allowed) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    }), {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
      },
    });
  }

  try {
    const apiKey =
      Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error(
        'Missing Gemini API key. Set GEMINI_API_KEY or GOOGLE_API_KEY as a Supabase Edge Function secret.'
      );
    }

    const body = await req.json();
    const { prompt } = body;

    // Enhanced input validation and sanitization
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid prompt parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize prompt: remove potentially harmful content
    const sanitizedPrompt = prompt
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .slice(0, 10000); // Limit length

    if (sanitizedPrompt.length === 0) {
      return new Response(JSON.stringify({ error: 'Prompt is empty after sanitization' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate prompt content (basic check for malicious patterns)
    const maliciousPatterns = [
      /\b(eval|exec|system|shell_exec|passthru|popen|proc_open)\b/i,
      /\b(unlink|rmdir|chmod|chown)\b/i,
      /\b(include|require|include_once|require_once)\b/i,
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
    ];

    if (maliciousPatterns.some(pattern => pattern.test(sanitizedPrompt))) {
      return new Response(JSON.stringify({ error: 'Invalid prompt content' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiRes = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [
              {
                text: 'You are a movie planning assistant. Always respond with valid JSON only. No markdown, no prose, no code fences — raw JSON exclusively.',
              },
            ],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: sanitizedPrompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 8192, // Fix: was 1024, too low and caused truncated JSON
            temperature: 0.4,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      if (errBody.includes('reported as leaked')) {
        throw new Error(
          'Gemini API key has been flagged as leaked. Rotate it in Google AI Studio and update the Supabase Edge Function secret.'
        );
      }
      throw new Error(`Gemini API error ${geminiRes.status}: ${errBody}`);
    }

    const geminiData = await geminiRes.json();

    const candidate = geminiData?.candidates?.[0];
    const finishReason = candidate?.finishReason;

    // Catch early stops before trying to parse
    if (finishReason && finishReason !== 'STOP') {
      if (finishReason === 'SAFETY') {
        throw new Error('Response blocked by Gemini safety filters.');
      }
      if (finishReason === 'MAX_TOKENS') {
        throw new Error(
          'Gemini hit the token limit and returned truncated JSON. Try increasing maxOutputTokens further.'
        );
      }
      throw new Error(`Gemini stopped early with reason: ${finishReason}`);
    }

    const rawText: string | undefined = candidate?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Empty or unexpected response from Gemini.');
    }

    // Strip any stray fences just in case
    const clean = rawText.replace(/```json|```/g, '').trim();

    let plan: unknown;
    try {
      plan = JSON.parse(clean);
    } catch {
      throw new Error(`Gemini returned non-JSON: ${clean.slice(0, 150)}`);
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('super-function error:', err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});