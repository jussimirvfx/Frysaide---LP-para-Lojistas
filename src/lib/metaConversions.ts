import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import type { IncomingHttpHeaders } from 'node:http';

type Payload = Record<string, unknown>;
type Options = {
  forceDryRun?: boolean;
  env?: Record<string, string | undefined>;
  request?: typeof fetch;
  log?: (entry: Payload) => void;
};
const object = (value: unknown): Payload => value && typeof value === 'object' && !Array.isArray(value) ? value as Payload : {};
const enabled = (value: unknown) => value === true || value === 1 || ['true', '1'].includes(String(value).toLowerCase());
const hashFields = ['em', 'ph', 'fn', 'ln', 'ct', 'st', 'zp', 'country', 'external_id'];

export function redactMetaSecrets(value: unknown, secret = ''): unknown {
  if (typeof value === 'string') return (secret ? value.split(secret).join('[REDACTED]') : value).replace(/EAA[A-Za-z0-9]{20,}/g, '[REDACTED]');
  if (Array.isArray(value)) return value.map(item => redactMetaSecrets(item, secret));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) =>
    [key, /token|authorization|password|secret/i.test(key) ? '[REDACTED]' : redactMetaSecrets(item, secret)]));
  return value;
}

export function prepareMetaEvent(body: Payload, headers: IncomingHttpHeaders) {
  if (!['PageView', 'Scroll', 'Lead', 'LeadQualificado'].includes(String(body.event_name))) throw new Error('Evento inválido.');
  if (typeof body.event_id !== 'string' || !body.event_id || body.event_id.length > 200) throw new Error('event_id inválido.');
  const source = new URL(String(body.event_source_url));
  if (!['http:', 'https:'].includes(source.protocol)) throw new Error('URL inválida.');
  const incoming = object(body.user_data);
  const user_data: Payload = {};
  for (const field of hashFields) {
    const values = (Array.isArray(incoming[field]) ? incoming[field] : [incoming[field]]) as unknown[];
    const hashes = values.filter(value => typeof value === 'string' && value.trim()).map(value => {
      let normalized = String(value).trim().toLowerCase();
      if (/^[a-f0-9]{64}$/.test(normalized)) return normalized; // scoretrack already hashes matching fields.
      if (['ph', 'zp'].includes(field)) normalized = normalized.replace(/\D/g, '');
      if (['ct', 'st', 'fn', 'ln', 'country'].includes(field)) normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
      return createHash('sha256').update(normalized).digest('hex');
    });
    if (hashes.length) user_data[field] = hashes;
  }
  for (const field of ['fbp', 'fbc']) {
    if (typeof incoming[field] === 'string' && /^fb\.\d+\.\d+\..+/.test(incoming[field] as string)) user_data[field] = incoming[field];
  }
  const ip = String(headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (isIP(ip)) user_data.client_ip_address = ip;
  const agent = String(headers['user-agent'] || incoming.client_user_agent || '');
  if (agent) user_data.client_user_agent = agent;
  const custom = object(body.custom_data);
  const custom_data = Object.fromEntries(['value', 'currency', 'content_name', 'content_category', 'lead_score', 'lead_priority',
    'disqualified', 'lead_score_breakdown', 'lead_score_raw_total', 'scroll_depth', 'scroll_percentage'].filter(key => key in custom).map(key => [key, custom[key]]));
  if (['Lead', 'LeadQualificado'].includes(String(body.event_name))) {
    if (typeof custom.lead_score !== 'number' || custom.lead_score < 0 || custom.lead_score > 100 || custom.value !== custom.lead_score) throw new Error('Score inválido.');
    if (body.event_name === 'LeadQualificado' && (custom.lead_score < 70 || custom.disqualified !== false)) throw new Error('Lead não qualificado.');
  }
  const now = Math.floor(Date.now() / 1000);
  const event_time = typeof body.event_time === 'number' && body.event_time <= now + 60 && body.event_time >= now - 7 * 86400 ? Math.floor(body.event_time) : now;
  return { event_name: body.event_name, event_id: body.event_id, event_time, event_source_url: source.href,
    action_source: 'website', user_data, custom_data };
}

export async function handleMetaConversion(input: unknown, headers: IncomingHttpHeaders = {}, options: Options = {}) {
  const env = options.env ?? process.env;
  const secret = env.META_API_ACCESS_TOKEN || '';
  const log = (entry: Payload) => {
    const safe = redactMetaSecrets(entry, secret) as Payload;
    if (options.log) options.log(safe);
    else if (safe.level === 'error') console.error(JSON.stringify(safe));
    else console.info(JSON.stringify(safe));
  };
  let body: Payload = {};
  let prepared: Payload | null = null;
  let metaStatus: number | null = null;
  let metaError: unknown = null;
  const base = { project: env.VERCEL_PROJECT_NAME || 'frysaide-lp-lojistas', route: '/api/meta/conversions',
    received_at: new Date().toISOString(), request_id: headers['x-vercel-id'] || headers['x-request-id'] || null };
  try {
    body = object(typeof input === 'string' ? JSON.parse(input) : input);
    const dryRun = options.forceDryRun || enabled(env.META_DRY_RUN) || enabled(headers['x-vfx-dry-run'])
      || ['dry_run', 'dryRun', 'vfx_dry_run', 'skip_webhook'].some(key => enabled(body[key]));
    log({ ...base, level: 'info', msg: 'conversion_api_event_backup', event: 'conversion_api_event_backup',
      event_name: body.event_name, event_id: body.event_id, custom_data: body.custom_data || {}, dry_run: Boolean(dryRun),
      user_data_presence: Object.fromEntries(Object.entries(object(body.user_data)).map(([key, value]) => [key, Boolean(value)])) });
    const event = prepareMetaEvent(body, headers);
    prepared = { data: [event] };
    if (env.VERCEL_ENV !== 'production' && env.NODE_ENV !== 'production' && env.META_TEST_EVENT_CODE) prepared.test_event_code = env.META_TEST_EVENT_CODE;
    if (dryRun) return { status: 200, body: { dry_run: true, skipped_meta: true, event_name: body.event_name, event_id: body.event_id } };
    if (!secret || !/^\d+$/.test(env.META_PIXEL_ID || '')) throw new Error('Credenciais Meta ausentes no servidor.');
    const response = await (options.request ?? fetch)(`https://graph.facebook.com/v23.0/${env.META_PIXEL_ID}/events`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify(prepared), signal: AbortSignal.timeout(6000)
    });
    metaStatus = response.status;
    const result = await response.json();
    if (!response.ok || result.error || !result.events_received) { metaError = result; throw new Error('Meta não confirmou o recebimento do evento.'); }
    log({ ...base, level: 'info', event: 'conversion_api_event_success', event_name: body.event_name, event_id: body.event_id, events_received: result.events_received });
    return { status: 200, body: { accepted: true, meta_sent: true } };
  } catch (error) {
    log({ ...base, level: 'error', msg: 'Falha ao processar conversão', event: 'conversion_api_event_error',
      event_name: body.event_name || null, event_id: body.event_id || null, request_payload: Object.keys(body).length ? body : input,
      prepared_meta_payload: prepared, meta_status: metaStatus, meta_error: metaError,
      error_message: error instanceof Error ? error.message : 'Erro interno' });
    return { status: 202, body: { accepted: true, meta_sent: false } };
  }
}
