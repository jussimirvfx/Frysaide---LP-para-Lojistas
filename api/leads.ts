import type { IncomingMessage, ServerResponse } from 'node:http';
import type { LeadFormData } from '../src/types.js';
import { buildLeadWebhookPayload } from '../src/lib/leadRequest.js';

type VercelRequest = IncomingMessage & { body?: LeadFormData };
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
    const sourceUrl = String(request.headers.referer || request.headers.origin || '');
    const payload = buildLeadWebhookPayload(request.body as LeadFormData, new Date().toISOString(), sourceUrl);
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!webhookResponse.ok) throw new Error(`Webhook rejected with status ${webhookResponse.status}`);
    return response.status(200).json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao processar o envio.';
    const validationError = message.includes('inválido') || message.startsWith('Campo obrigatório');
    return response.status(validationError ? 400 : 502).json({ error: validationError ? message : 'Não foi possível enviar seus dados.' });
  }
}
