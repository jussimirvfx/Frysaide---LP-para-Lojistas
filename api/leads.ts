import type { IncomingMessage, ServerResponse } from 'node:http';
import type { LeadFormData } from '../src/types.js';
import { fetchCnpjEnrichment } from '../src/lib/cnpjLookup.js';
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
    const cnpjData = await fetchCnpjEnrichment(submittedFormData?.cnpj || '');
    const formData = submittedFormData ? {
      ...submittedFormData,
      cidade: cnpjData.cidade,
      estado: cnpjData.estado,
      tempoCnpj: cnpjData.tempoCnpj
    } : submittedFormData;
    const payload = buildLeadWebhookPayload(
      formData as LeadFormData,
      body?.timestamp || new Date().toISOString(),
      sourceUrl,
      body?.user_agent || String(request.headers['user-agent'] || ''),
      body?.referrer || 'direct'
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
    return response.status(200).json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao processar o envio.';
    const validationError = message.includes('inválid')
      || message.startsWith('Campo obrigatório')
      || ['Telefone ', 'Celular ', 'DDD ', 'E-mail ', 'Resposta ', 'Tempo de CNPJ '].some(prefix => message.startsWith(prefix));
    return response.status(validationError ? 400 : 502).json({ error: validationError ? message : 'Não foi possível enviar seus dados.' });
  }
}
