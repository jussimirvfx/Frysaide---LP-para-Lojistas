import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleMetaConversion } from '../../src/lib/metaConversions.js';

type Request = IncomingMessage & { body?: unknown };
type Response = ServerResponse & { status: (status: number) => Response; json: (body: unknown) => void };
export default async function handler(req: Request, res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const result = await handleMetaConversion(req.body, req.headers);
  return res.status(result.status).json(result.body);
}
