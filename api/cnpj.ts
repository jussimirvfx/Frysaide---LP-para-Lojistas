import type { IncomingMessage, ServerResponse } from 'node:http';
import { fetchCnpjEnrichment, FRYSAIDE_CNPJ_LANDING_ID } from '../src/lib/cnpjLookup.js';

type VercelResponse = ServerResponse & { status: (statusCode: number) => VercelResponse; json: (body: unknown) => void };

export default async function handler(request: IncomingMessage, response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido.' });
  }
  try {
    const url = new URL(request.url || '', `https://${request.headers.host || 'localhost'}`);
    const oidcToken = String(request.headers['x-vercel-oidc-token'] || '').split(',')[0].trim();
    const clientIp = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const result = await fetchCnpjEnrichment(url.searchParams.get('cnpj') || '', fetch, new Date(), {
      oidcToken,
      landingId: FRYSAIDE_CNPJ_LANDING_ID,
      clientIp
    });
    return response.status(200).json({
      ok: true,
      cnpj_valido: result.cnpjValido,
      encontrado: result.encontrado,
      fonte: result.fonte,
      motivo: '',
      cnpj_validation_status: result.cnpjValidationStatus,
      company: result.company,
      municipio: result.cidade,
      uf: result.estado,
      data_inicio_atividade: result.dataInicioAtividade,
      idade_cnpj_anos: result.idadeCnpjAnos,
      tempo_cnpj_value: result.tempoCnpj
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao consultar CNPJ.';
    return response.status(message.includes('CNPJ inválido') ? 400 : 502).json({ error: message });
  }
}
