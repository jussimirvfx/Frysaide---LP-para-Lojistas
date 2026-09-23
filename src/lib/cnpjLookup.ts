import { CNPJ_ERROR, cnpjDigits, isValidCnpj } from './cnpj.js';

export const CNPJ_LOOKUP_ERROR = 'Não foi possível consultar os dados do CNPJ. Confira o número e tente novamente.';

export interface CnpjEnrichment {
  cidade: string;
  estado: string;
  dataInicioAtividade: string;
  tempoCnpj: string;
  idadeCnpjAnos: number;
  fonte: 'BrasilAPI (Minha Receita)';
}

type BrasilApiCnpj = {
  municipio?: unknown;
  uf?: unknown;
  data_inicio_atividade?: unknown;
};

export function calcularIdadeCnpj(dataInicioAtividade: string, hoje = new Date()): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataInicioAtividade);
  if (!match) throw new Error(CNPJ_LOOKUP_ERROR);
  const [, year, month, day] = match.map(Number);
  const abertura = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(abertura.getTime()) || abertura.getUTCFullYear() !== year || abertura.getUTCMonth() !== month - 1 || abertura.getUTCDate() !== day || abertura > hoje) {
    throw new Error(CNPJ_LOOKUP_ERROR);
  }
  let idade = hoje.getUTCFullYear() - year;
  const aniversarioAindaNaoChegou = hoje.getUTCMonth() < month - 1 || (hoje.getUTCMonth() === month - 1 && hoje.getUTCDate() < day);
  if (aniversarioAindaNaoChegou) idade--;
  return idade;
}

export function tempoCnpjValueFromYears(idadeCnpjAnos: number): string {
  if (idadeCnpjAnos < 1) return 'opcao-1790102115667-1';
  if (idadeCnpjAnos <= 2) return 'opcao-1790102115667-2';
  if (idadeCnpjAnos <= 4) return 'opcao-1790102115667-3';
  return 'opcao-1790102115667-4';
}

export function normalizeCnpjApiData(data: BrasilApiCnpj, hoje = new Date()): CnpjEnrichment {
  const cidade = typeof data.municipio === 'string' ? data.municipio.trim() : '';
  const estado = typeof data.uf === 'string' ? data.uf.trim().toUpperCase() : '';
  const dataInicioAtividade = typeof data.data_inicio_atividade === 'string' ? data.data_inicio_atividade.trim() : '';
  if (!cidade || !/^[A-Z]{2}$/.test(estado) || !dataInicioAtividade) throw new Error(CNPJ_LOOKUP_ERROR);
  const idadeCnpjAnos = calcularIdadeCnpj(dataInicioAtividade, hoje);
  return { cidade, estado, dataInicioAtividade, idadeCnpjAnos, tempoCnpj: tempoCnpjValueFromYears(idadeCnpjAnos), fonte: 'BrasilAPI (Minha Receita)' };
}

export async function fetchCnpjEnrichment(
  cnpj: string,
  request: typeof fetch = fetch,
  hoje = new Date(),
  endpoint = 'https://brasilapi.com.br/api/cnpj/v1'
): Promise<CnpjEnrichment> {
  if (!isValidCnpj(cnpj)) throw new Error(CNPJ_ERROR);
  const response = await request(`${endpoint}/${cnpjDigits(cnpj)}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'Frysaide-LP/1.0' },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(CNPJ_LOOKUP_ERROR);
  return normalizeCnpjApiData(await response.json() as BrasilApiCnpj, hoje);
}

export async function consultarCnpj(cnpj: string, request: typeof fetch = fetch): Promise<CnpjEnrichment> {
  if (!isValidCnpj(cnpj)) throw new Error(CNPJ_ERROR);
  const response = await request(`/api/cnpj?cnpj=${encodeURIComponent(cnpjDigits(cnpj))}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(CNPJ_LOOKUP_ERROR);
  return normalizeCnpjApiData(await response.json() as BrasilApiCnpj);
}
