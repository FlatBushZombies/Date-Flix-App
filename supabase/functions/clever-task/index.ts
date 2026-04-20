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
    | 'rate_limited'
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

  // Rate limiting check
  const rateLimitResult = checkRateLimit(req);
  if (!rateLimitResult.allowed) {
    return json({
      sent: false,
      provider: 'resend',
      reason: 'rate_limited',
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
    }, 429)
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

    // Enhanced validation and sanitization
    if (!to || !to.includes('@') || !debateCode) {
      return json({
        sent: false,
        provider: 'resend',
        reason: 'missing_fields',
        error: 'Missing required fields: to (email) and debateCode.',
        action: 'Pass a real recipient email address and a debate code when invoking clever-task.',
      } satisfies InviteResponse)
    }

    // Validate email format more strictly
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return json({
        sent: false,
        provider: 'resend',
        reason: 'missing_fields',
        error: 'Invalid email address format.',
        action: 'Provide a valid email address.',
      } satisfies InviteResponse)
    }

    // Sanitize inputs
    const sanitizedTo = to.toLowerCase().slice(0, 254) // RFC 5321 limit
    const sanitizedHostName = hostName.replace(/[<>'"&]/g, '').slice(0, 100)
    const sanitizedDebateCode = debateCode.replace(/[<>'"&]/g, '').slice(0, 50)
    const sanitizedSubject = subject.replace(/[<>'"&]/g, '').slice(0, 200)

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

    const safeHostName = escapeHtml(sanitizedHostName || 'Your partner')
    const safeDebateCode = escapeHtml(sanitizedDebateCode)
    const safeAppUrl = appUrl ? escapeHtml(appUrl) : ''

    const text = [
      'Hi!',
      '',
      `${sanitizedHostName || 'Your partner'} wants to settle a movie debate with you in DateFlix.`,
      '',
      `Your invite code: ${sanitizedDebateCode}`,
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
        to: sanitizedTo,
        subject: sanitizedSubject,
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
