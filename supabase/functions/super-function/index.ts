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

  try {
    const apiKey =
      Deno.env.get('GEMINI_API_KEY') ?? Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error(
        'Missing Gemini API key. Set GEMINI_API_KEY or GOOGLE_API_KEY as a Supabase Edge Function secret.'
      );
    }

    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid prompt' }), {
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
              parts: [{ text: prompt }],
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