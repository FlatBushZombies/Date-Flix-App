const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type InvitePayload = {
  to?: string
  hostName?: string
  debateCode?: string
  subject?: string
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const body = (await req.json().catch(() => ({}))) as InvitePayload
    const to = typeof body.to === 'string' ? body.to.trim() : ''
    const hostName = typeof body.hostName === 'string' ? body.hostName.trim() : ''
    const debateCode = typeof body.debateCode === 'string' ? body.debateCode.trim() : ''
    const subject =
      typeof body.subject === 'string' && body.subject.trim()
        ? body.subject.trim()
        : `${hostName || 'Someone'} invited you to a DateFlix debate!`

    if (!to || !to.includes('@') || !debateCode) {
      // Keep this 200 so the app can gracefully fall back to manual code sharing.
      return json({
        sent: false,
        error: 'Missing required fields: to (email) and debateCode.',
      })
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('INVITE_FROM_EMAIL') ?? 'DateFlix <onboarding@resend.dev>'
    const appUrl = Deno.env.get('APP_URL') ?? ''

    if (!resendKey) {
      return json({
        sent: false,
        error: 'Email not configured on server (missing RESEND_API_KEY).',
      })
    }

    const text = [
      `Hi!`,
      ``,
      `${hostName || 'Your partner'} wants to settle a movie debate with you in DateFlix.`,
      ``,
      `Your invite code: ${debateCode}`,
      appUrl ? `Open the app: ${appUrl}` : `Open the app and go to Debate → "I Have a Code"`,
      ``,
      `Have fun!`,
    ].join('\n')

    const html = `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5">
        <h2 style="margin:0 0 12px 0;">You're invited to a DateFlix debate</h2>
        <p style="margin:0 0 12px 0;">
          <strong>${hostName || 'Your partner'}</strong> wants to settle a movie debate with you.
        </p>
        <p style="margin:0 0 6px 0;">Your invite code:</p>
        <div style="font-size: 22px; letter-spacing: 4px; font-weight: 800; padding: 10px 14px; border-radius: 12px; background:#111827; color:#fff; display:inline-block;">
          ${debateCode}
        </div>
        <p style="margin:16px 0 0 0;">
          Open the app and go to <strong>Debate</strong> → <strong>I Have a Code</strong>.
        </p>
        ${appUrl ? `<p style="margin:10px 0 0 0;"><a href="${appUrl}">Open DateFlix</a></p>` : ''}
      </div>
    `

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject,
        text,
        html,
      }),
    })

    if (!resendRes.ok) {
      const errBody = await resendRes.text()
      return json({ sent: false, error: `Resend error ${resendRes.status}: ${errBody}` })
    }

    return json({ sent: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('clever-task error:', err);
    // Keep 200 so the app can fall back to manual sharing without surfacing a hard error.
    return json({ sent: false, error: message })
  }
});
