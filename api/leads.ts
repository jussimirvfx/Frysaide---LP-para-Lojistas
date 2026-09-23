import type { IncomingMessage, ServerResponse } from 'node:http';
import type { LeadFormData } from '../src/types.js';
import { fetchCnpjEnrichment, FRYSAIDE_CNPJ_LANDING_ID } from '../src/lib/cnpjLookup.js';
import { buildLeadWebhookPayload, normalizeSubmittedLead } from '../src/lib/leadRequest.js';
import { isLeadBlockedByCuration } from '../src/lib/leadScoring.js';

type VercelRequest = IncomingMessage & { body?: LeadFormData & {
  timestamp?: string;
  page_url?: string;
  user_agent?: string;
  referrer?: string;
  tipoLoja_value?: string;
  lojaFisica_value?: string;
  tempoCnpj_value?: string;
} };
type VercelResponse = ServerResponse & {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => void;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  const webhookUrl = process.env.N8N_FRYSAIDE_WEBHOOK_URL;
  if (!webhookUrl) return response.status(503).json({ error: 'Integração temporariamente indisponível.' });

  try {
    const body = request.body as VercelRequest['body'];
    const sourceUrl = String(body?.page_url || request.headers.referer || request.headers.origin || '');
    const submittedFormData = body ? normalizeSubmittedLead(body) : body;
    if (submittedFormData && isLeadBlockedByCuration(submittedFormData)) {
      return response.status(422).json({ error: 'Cadastro não selecionado pela curadoria.' });
    }
    if (!submittedFormData) throw new Error('Payload inválido.');
    let cnpjData: Awaited<ReturnType<typeof fetchCnpjEnrichment>> | null = null;
    try {
      const oidcToken = String(request.headers['x-vercel-oidc-token'] || '').split(',')[0].trim();
      const clientIp = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
      cnpjData = await fetchCnpjEnrichment(submittedFormData.cnpj, fetch, new Date(), {
        oidcToken,
        landingId: FRYSAIDE_CNPJ_LANDING_ID,
        clientIp
      });
    } catch {
      // Cadastral enrichment is optional. A valid checksum must still reach n8n.
      console.warn('CNPJ_ENRICHMENT_OPTIONAL_FAILED');
    }
    const formData = {
      ...submittedFormData,
      ...(cnpjData ? {
        cidade: cnpjData.cidade,
        estado: cnpjData.estado,
        tempoCnpj: cnpjData.tempoCnpj
      } : {})
    };
    const payload = buildLeadWebhookPayload(
      formData as LeadFormData,
      body?.timestamp || new Date().toISOString(),
      sourceUrl,
      body?.user_agent || String(request.headers['user-agent'] || ''),
      body?.referrer || 'direct',
      cnpjData
    );
    const webhookToken = process.env.N8N_FRYSAIDE_WEBHOOK_TOKEN;
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(webhookToken ? { Authorization: `Bearer ${webhookToken}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!webhookResponse.ok) throw new Error(`Webhook rejected with status ${webhookResponse.status}`);
    return response.status(200).json({
      success: true,
      enrichment_available: Boolean(cnpjData),
      ...(cnpjData ? { enrichment: {
        cidade: cnpjData.cidade,
        estado: cnpjData.estado,
        tempoCnpj: cnpjData.tempoCnpj,
        fonte: cnpjData.fonte,
        encontrado: cnpjData.encontrado,
        cnpj_validation_status: cnpjData.cnpjValidationStatus
      } } : {}),
      lead_score_summary: {
        lead_score: payload.lead_score,
        lead_priority: payload.lead_priority,
        disqualified: payload.disqualified
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao processar o envio.';
    const validationError = message.includes('inválid')
      || message.startsWith('Campo obrigatório')
      || ['Telefone ', 'Celular ', 'DDD ', 'E-mail ', 'Resposta ', 'Tempo de CNPJ '].some(prefix => message.startsWith(prefix));
    return response.status(validationError ? 400 : 502).json({ error: validationError ? message : 'Não foi possível enviar seus dados.' });
  }
}
