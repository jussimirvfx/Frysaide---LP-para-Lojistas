import type { LeadFormData, LeadSubmissionContext } from '../types.js';
import { buildLeadWebhookPayload } from './leadRequest.js';
import { isLeadBlockedByCuration } from './leadScoring.js';

const defaultContext = (): LeadSubmissionContext => ({
  timestamp: new Date().toISOString(),
  pageUrl: typeof window === 'undefined' ? '' : window.location.href,
  userAgent: typeof navigator === 'undefined' ? '' : navigator.userAgent,
  referrer: typeof document === 'undefined' ? 'direct' : document.referrer || 'direct'
});

export async function registrarEnvioFormularioNoVercel(
  payload: unknown,
  context: Record<string, unknown> = {},
  request: typeof fetch = fetch
) {
  try {
    const response = await request('/api/form-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        source: 'form-submit',
        dry_run: import.meta.env?.DEV ?? false,
        pageUrl: typeof window === 'undefined' ? '' : window.location.href,
        loggedAt: new Date().toISOString(),
        context,
        payload
      })
    });
    if (!response.ok) throw new Error(`Backup rejected with status ${response.status}`);
  } catch (error) {
    console.warn('Falha ao registrar backup do formulário na Vercel:', error);
  }
}

export async function sendLead(
  data: LeadFormData,
  endpoint: string,
  request: typeof fetch = fetch,
  context: LeadSubmissionContext = defaultContext()
) {
  if (isLeadBlockedByCuration(data)) throw new Error('Cadastro não selecionado pela curadoria.');
  const payload = buildLeadWebhookPayload(data, context.timestamp, context.pageUrl, context.userAgent, context.referrer);

  await registrarEnvioFormularioNoVercel(payload, { endpoint }, request);

  const response = await request(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Submission failed');
  const result = await response.clone().json().catch(() => null) as {
    dry_run?: boolean;
    lead_score_summary?: unknown;
    enrichment_available?: boolean;
    enrichment?: Pick<LeadFormData, 'cidade' | 'estado' | 'tempoCnpj'>;
  } | null;
  if (result?.dry_run) console.info('LOCAL_LEAD_SCORE', JSON.stringify(result.lead_score_summary));
  return result;
}
