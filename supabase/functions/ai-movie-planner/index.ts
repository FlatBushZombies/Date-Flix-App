import { Anthropic } from '@anthropic-ai/sdk'

const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'AI not configured on server (missing ANTHROPIC_API_KEY).' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const anthropic = new Anthropic({ apiKey })
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Optional: rate limit per user using Supabase auth
    // const authHeader = req.headers.get('Authorization');
    // const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    // ... check usage count in DB

    const message = await anthropic.messages.create({
      // Use a fast, low-cost Claude model
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (message.content[0] as { type: 'text'; text: string }).text;

    // Strip any accidental markdown fences
    const clean = raw.replace(/```json|```/g, '').trim();
    const plan = JSON.parse(clean);

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('ai-movie-planner error:', err);
    return new Response(
      JSON.stringify({ error: err.message ?? 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
