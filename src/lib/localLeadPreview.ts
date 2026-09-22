import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import type { LeadFormData } from '../types';
import { buildLeadWebhookPayload, normalizeSubmittedLead } from './leadRequest';
import { buildFormLogEntry, leadScoreSummary } from './formLog';
import { handleMetaConversion } from './metaConversions';

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > 1024 * 1024) throw new Error('Payload muito grande.');
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as Record<string, unknown>;
}

function respond(response: ServerResponse, status: number, body: Record<string, unknown>) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

export function localLeadPreview(): Plugin {
  return {
    name: 'local-lead-preview',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/meta/conversions', async (request, response) => {
        if (request.method !== 'POST') return respond(response, 405, { error: 'Método não permitido.' });
        try {
          const body = await readJson(request);
          // Hard safety boundary: localhost never forwards events, regardless of env/body.
          const result = await handleMetaConversion(body, request.headers, { forceDryRun: true });
          respond(response, result.status, result.body);
        } catch {
          respond(response, 400, { error: 'JSON inválido ou muito grande.' });
        }
      });
      server.middlewares.use('/api/form-log', async (request, response) => {
        if (request.method !== 'POST') return respond(response, 405, { error: 'Método não permitido.' });
        try {
          const body = await readJson(request);
          const entry = buildFormLogEntry({ body: { ...body, dry_run: true }, headers: request.headers });
          console.info('LOCAL_FORM_BACKUP', JSON.stringify(entry));
          respond(response, 200, { ok: true, dry_run: true });
        } catch (error) {
          respond(response, 400, { error: error instanceof Error ? error.message : 'Payload inválido.' });
        }
      });

      server.middlewares.use('/api/leads', async (request, response) => {
        if (request.method !== 'POST') return respond(response, 405, { error: 'Método não permitido.' });
        try {
          const body = await readJson(request) as unknown as LeadFormData & {
            tipoLoja_value?: string;
            lojaFisica_value?: string;
            tempoCnpj_value?: string;
            timestamp?: string;
            page_url?: string;
            user_agent?: string;
            referrer?: string;
          };
          const payload = buildLeadWebhookPayload(
            normalizeSubmittedLead(body),
            body.timestamp || new Date().toISOString(),
            body.page_url || '',
            body.user_agent || '',
            body.referrer || 'direct'
          );
          const summary = leadScoreSummary(payload);
          console.info('LOCAL_LEAD_SCORE', JSON.stringify(summary));
          respond(response, 200, { success: true, dry_run: true, lead_score_summary: summary });
        } catch (error) {
          respond(response, 400, { error: error instanceof Error ? error.message : 'Payload inválido.' });
        }
      });
    }
  };
}
