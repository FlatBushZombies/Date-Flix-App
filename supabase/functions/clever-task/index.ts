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

type InviteResponse = {
  sent: boolean
  provider: 'resend'
  mode?: 'test' | 'production'
  reason?:
    | 'missing_fields'
    | 'missing_provider_config'
    | 'domain_verification_required'
    | 'from_domain_not_verified'
    | 'provider_error'
  error?: string
  action?: string
  emailId?: string
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function parseResendError(raw: string): { reason?: InviteResponse['reason']; action?: string } {
  const lower = raw.toLowerCase()

  if (
    lower.includes('you can only send testing emails to your own email address') ||
    lower.includes('verify a domain at resend.com/domains')
  ) {
    return {
      reason: 'domain_verification_required',
      action:
        'Verify a domain in Resend, then set INVITE_FROM_EMAIL to an address on that verified domain.',
    }
  }

  if (lower.includes('domain is not verified') || lower.includes('domain mismatch')) {
    return {
      reason: 'from_domain_not_verified',
      action:
        'Update INVITE_FROM_EMAIL so it uses a domain or subdomain that is verified in Resend.',
    }
  }

  return {
    reason: 'provider_error',
  }
}

Deno.serve(async (req) => {
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
      return json({
        sent: false,
        provider: 'resend',
        reason: 'missing_fields',
        error: 'Missing required fields: to (email) and debateCode.',
        action: 'Pass a real recipient email address and a debate code when invoking clever-task.',
      } satisfies InviteResponse)
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('INVITE_FROM_EMAIL') ?? 'DateFlix <onboarding@resend.dev>'
    const appUrl = Deno.env.get('APP_URL') ?? ''
    const mode: InviteResponse['mode'] = fromEmail.toLowerCase().includes('resend.dev')
      ? 'test'
      : 'production'

    if (!resendKey) {
      return json({
        sent: false,
        provider: 'resend',
        mode,
        reason: 'missing_provider_config',
        error: 'Email not configured on server (missing RESEND_API_KEY).',
        action: 'Add RESEND_API_KEY to Supabase Edge Function secrets.',
      } satisfies InviteResponse)
    }

    const safeHostName = escapeHtml(hostName || 'Your partner')
    const safeDebateCode = escapeHtml(debateCode)
    const safeAppUrl = appUrl ? escapeHtml(appUrl) : ''

    const text = [
      'Hi!',
      '',
      `${hostName || 'Your partner'} wants to settle a movie debate with you in DateFlix.`,
      '',
      `Your invite code: ${debateCode}`,
      appUrl ? `Open the app: ${appUrl}` : 'Open the app and go to Debate > I Have a Code',
      '',
      'Have fun!',
    ].join('\n')

    const html = `
      <div style="font-family: ui-sans-serif, system-ui; line-height: 1.5">
        <h2 style="margin:0 0 12px 0;">You're invited to a DateFlix debate</h2>
        <p style="margin:0 0 12px 0;">
          <strong>${safeHostName}</strong> wants to settle a movie debate with you.
        </p>
        <p style="margin:0 0 6px 0;">Your invite code:</p>
        <div style="font-size: 22px; letter-spacing: 4px; font-weight: 800; padding: 10px 14px; border-radius: 12px; background:#111827; color:#fff; display:inline-block;">
          ${safeDebateCode}
        </div>
        <p style="margin:16px 0 0 0;">
          Open the app and go to <strong>Debate</strong> &gt; <strong>I Have a Code</strong>.
        </p>
        ${safeAppUrl ? `<p style="margin:10px 0 0 0;"><a href="${safeAppUrl}">Open DateFlix</a></p>` : ''}
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
      const parsed = parseResendError(errBody)
      return json({
        sent: false,
        provider: 'resend',
        mode,
        reason: parsed.reason,
        error: `Resend error ${resendRes.status}: ${errBody}`,
        action: parsed.action,
      } satisfies InviteResponse)
    }

    const resendData = (await resendRes.json().catch(() => ({}))) as { id?: string }

    return json({
      sent: true,
      provider: 'resend',
      mode,
      emailId: resendData.id,
    } satisfies InviteResponse)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error('clever-task error:', err)
    return json({
      sent: false,
      provider: 'resend',
      reason: 'provider_error',
      error: message,
    } satisfies InviteResponse)
  }
});
