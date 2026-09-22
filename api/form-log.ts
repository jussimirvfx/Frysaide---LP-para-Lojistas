import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildFormLogEntry } from '../src/lib/formLog.js';

type VercelRequest = IncomingMessage & { body?: unknown };
type VercelResponse = ServerResponse & {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => void;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method === 'OPTIONS') return response.status(204).end();
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST, OPTIONS');
    return response.status(405).json({ ok: false, error: 'method-not-allowed' });
  }

  try {
    console.info(JSON.stringify(buildFormLogEntry(request)));
    return response.status(200).json({ ok: true });
  } catch {
    return response.status(400).json({ ok: false, error: 'invalid-json' });
  }
}
