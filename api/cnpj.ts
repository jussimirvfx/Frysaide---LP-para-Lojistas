import type { IncomingMessage, ServerResponse } from 'node:http';
import { fetchCnpjEnrichment } from '../src/lib/cnpjLookup.js';

type VercelResponse = ServerResponse & { status: (statusCode: number) => VercelResponse; json: (body: unknown) => void };

export default async function handler(request: IncomingMessage, response: VercelResponse) {
  response.setHeader('Cache-Control', 'private, max-age=300');
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido.' });
  }
  try {
    const url = new URL(request.url || '', `https://${request.headers.host || 'localhost'}`);
    const result = await fetchCnpjEnrichment(url.searchParams.get('cnpj') || '');
    return response.status(200).json({
      municipio: result.cidade,
      uf: result.estado,
      data_inicio_atividade: result.dataInicioAtividade,
      idade_cnpj_anos: result.idadeCnpjAnos,
      tempo_cnpj_value: result.tempoCnpj,
      fonte: result.fonte
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao consultar CNPJ.';
    return response.status(message.includes('CNPJ inválido') ? 400 : 502).json({ error: message });
  }
}
