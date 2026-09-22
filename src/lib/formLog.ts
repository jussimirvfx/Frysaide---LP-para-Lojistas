export interface FormLogRequestLike {
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

export function parseFormLogBody(body: unknown): Record<string, unknown> {
  if (typeof body === 'string') return JSON.parse(body || '{}') as Record<string, unknown>;
  return body && typeof body === 'object' ? body as Record<string, unknown> : {};
}

export function buildFormLogEntry(request: FormLogRequestLike, now = new Date()) {
  const body = parseFormLogBody(request.body);
  const payload = body.payload && typeof body.payload === 'object' ? body.payload as Record<string, unknown> : {};
  return {
    level: 'info',
    msg: 'landing_form_backup',
    event: 'form-submit',
    project: process.env.VERCEL_PROJECT_NAME || 'frysaide',
    route: '/api/form-log',
    dry_run: Boolean(body.dry_run || body.dryRun || body.__dry_run || body.vfx_dry_run),
    received_at: now.toISOString(),
    vercel_deployment: process.env.VERCEL_URL || null,
    user_agent: request.headers['user-agent'] || null,
    forwarded_for: request.headers['x-forwarded-for'] || null,
    payload_size: JSON.stringify(body).length,
    lead_score_summary: leadScoreSummary(payload),
    payload: body
  };
}

export function leadScoreSummary(payload: Record<string, unknown>) {
  return {
    breakdown: payload.lead_score_breakdown ?? null,
    raw_total: payload.lead_score_raw_total ?? null,
    total: payload.lead_score ?? null,
    priority: payload.lead_priority ?? null,
    disqualified: payload.disqualified ?? null
  };
}
