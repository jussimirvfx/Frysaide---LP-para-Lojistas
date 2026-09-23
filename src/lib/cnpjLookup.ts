import { CNPJ_ERROR, cnpjDigits, isValidCnpj } from './cnpj.js';

export const CENTRAL_CNPJ_API_URL = 'https://validador-cnpj.vfxaceleradordevendas.com.br/api/v1/cnpj';
export const CNPJ_LOOKUP_ERROR = 'Não foi possível consultar os dados do CNPJ. Confira o número e tente novamente.';
export const FRYSAIDE_CNPJ_LANDING_ID = 'frysaide-lojistas';

export interface CnpjCompany {
  razao_social: string;
  nome_fantasia: string;
  situacao_cadastral: string;
  data_abertura: string;
  porte: string;
  cnae_principal: string;
  descricao_cnae_principal: string;
  inscricoes_estaduais: unknown[];
  inscricao_estadual_status: string;
  possui_inscricao_estadual: boolean | null;
  endereco: {
    completo: string;
    rua: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
}

export interface CnpjEnrichment {
  cidade: string;
  estado: string;
  dataInicioAtividade: string;
  tempoCnpj: string;
  idadeCnpjAnos: number;
  fonte: string;
  encontrado: true;
  cnpjValido: true;
  cnpjValidationStatus: 'cadastral_valid';
  company: CnpjCompany;
}

export interface CnpjLookupOptions {
  oidcToken?: string;
  landingId?: string;
  clientIp?: string;
  endpoint?: string;
  timeoutMs?: number;
}

type CentralCnpjResponse = {
  ok?: unknown;
  cnpj?: unknown;
  cnpj_valido?: unknown;
  encontrado?: unknown;
  fonte?: unknown;
  cnpj_validation_status?: unknown;
  company?: unknown;
};

const stringValue = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const objectValue = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' ? value as Record<string, unknown> : {}
);

function parseOpeningDate(value: unknown): { iso: string; date: Date } | null {
  const text = stringValue(value);
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    const brazilian = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
    if (brazilian) return parseOpeningDate(`${brazilian[3]}-${brazilian[2]}-${brazilian[1]}`);
  }
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { iso: `${yearText}-${monthText}-${dayText}`, date };
}

export function calcularIdadeCnpj(dataInicioAtividade: string, hoje = new Date()): number {
  const parsed = parseOpeningDate(dataInicioAtividade);
  if (!parsed || parsed.date > hoje) throw new Error(CNPJ_LOOKUP_ERROR);
  const year = parsed.date.getUTCFullYear();
  const month = parsed.date.getUTCMonth();
  const day = parsed.date.getUTCDate();
  let idade = hoje.getUTCFullYear() - year;
  const aniversarioAindaNaoChegou = hoje.getUTCMonth() < month || (hoje.getUTCMonth() === month && hoje.getUTCDate() < day);
  if (aniversarioAindaNaoChegou) idade--;
  return idade;
}

export function tempoCnpjValueFromYears(idadeCnpjAnos: number): string {
  if (idadeCnpjAnos < 1) return 'opcao-1790102115667-1';
  if (idadeCnpjAnos <= 2) return 'opcao-1790102115667-2';
  if (idadeCnpjAnos <= 4) return 'opcao-1790102115667-3';
  return 'opcao-1790102115667-4';
}

export function normalizeCnpjApiData(data: CentralCnpjResponse, hoje = new Date()): CnpjEnrichment {
  if (data.cnpj_valido === false) throw new Error(CNPJ_ERROR);
  if (data.ok !== true || data.cnpj_valido !== true) throw new Error(CNPJ_LOOKUP_ERROR);
  if (data.encontrado !== true) throw new Error(CNPJ_LOOKUP_ERROR);

  const rawCompany = objectValue(data.company);
  const rawAddress = objectValue(rawCompany.endereco);
  const razaoSocial = stringValue(rawCompany.razao_social || rawCompany.razaoSocial);
  const nomeFantasia = stringValue(rawCompany.nome_fantasia || rawCompany.nomeFantasia);
  const dataAbertura = stringValue(rawCompany.data_abertura || rawCompany.data_inicio_atividade || rawCompany.dataInicioAtividade);
  const parsedOpening = parseOpeningDate(dataAbertura);
  const cidade = stringValue(rawAddress.cidade || rawAddress.municipio || rawCompany.cidade || rawCompany.municipio);
  const estado = stringValue(rawAddress.estado || rawAddress.uf || rawCompany.estado || rawCompany.uf).toUpperCase();
  if (!razaoSocial && !nomeFantasia) throw new Error(CNPJ_LOOKUP_ERROR);
  if (!cidade || !/^[A-Z]{2}$/.test(estado) || !parsedOpening) throw new Error(CNPJ_LOOKUP_ERROR);

  const idadeCnpjAnos = calcularIdadeCnpj(parsedOpening.iso, hoje);
  const company: CnpjCompany = {
    razao_social: razaoSocial,
    nome_fantasia: nomeFantasia,
    situacao_cadastral: stringValue(rawCompany.situacao_cadastral || rawCompany.situacaoCadastral),
    data_abertura: parsedOpening.iso,
    porte: stringValue(rawCompany.porte),
    cnae_principal: stringValue(rawCompany.cnae_principal || rawCompany.cnaePrincipal),
    descricao_cnae_principal: stringValue(rawCompany.descricao_cnae_principal || rawCompany.cnaePrincipalDescricao),
    inscricoes_estaduais: Array.isArray(rawCompany.inscricoes_estaduais) ? rawCompany.inscricoes_estaduais : [],
    inscricao_estadual_status: stringValue(rawCompany.inscricao_estadual_status),
    possui_inscricao_estadual: typeof rawCompany.possui_inscricao_estadual === 'boolean' ? rawCompany.possui_inscricao_estadual : null,
    endereco: {
      completo: stringValue(rawAddress.completo),
      rua: stringValue(rawAddress.rua || rawAddress.logradouro),
      numero: stringValue(rawAddress.numero),
      complemento: stringValue(rawAddress.complemento),
      bairro: stringValue(rawAddress.bairro),
      cidade,
      estado,
      cep: stringValue(rawAddress.cep)
    }
  };

  return {
    cidade,
    estado,
    dataInicioAtividade: parsedOpening.iso,
    tempoCnpj: tempoCnpjValueFromYears(idadeCnpjAnos),
    idadeCnpjAnos,
    fonte: stringValue(data.fonte) || 'API central VFX',
    encontrado: true,
    cnpjValido: true,
    cnpjValidationStatus: 'cadastral_valid',
    company
  };
}

export async function fetchCnpjEnrichment(
  cnpj: string,
  request: typeof fetch = fetch,
  hoje = new Date(),
  options: CnpjLookupOptions = {}
): Promise<CnpjEnrichment> {
  if (!isValidCnpj(cnpj)) throw new Error(CNPJ_ERROR);
  const oidcToken = stringValue(options.oidcToken);
  if (!oidcToken) throw new Error(CNPJ_LOOKUP_ERROR);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${oidcToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-VFX-Landing-ID': options.landingId || FRYSAIDE_CNPJ_LANDING_ID
  };
  if (options.clientIp) headers['X-VFX-Client-IP'] = options.clientIp;
  const response = await request(options.endpoint || CENTRAL_CNPJ_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ cnpj: cnpjDigits(cnpj) }),
    signal: AbortSignal.timeout(options.timeoutMs || 10_000)
  });
  if (!response.ok) throw new Error(CNPJ_LOOKUP_ERROR);
  return normalizeCnpjApiData(await response.json() as CentralCnpjResponse, hoje);
}

export async function consultarCnpj(cnpj: string, request: typeof fetch = fetch): Promise<CnpjEnrichment> {
  if (!isValidCnpj(cnpj)) throw new Error(CNPJ_ERROR);
  const response = await request(`/api/cnpj?cnpj=${encodeURIComponent(cnpjDigits(cnpj))}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(CNPJ_LOOKUP_ERROR);
  return normalizeCnpjApiData(await response.json() as CentralCnpjResponse);
}
