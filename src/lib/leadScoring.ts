import type { LeadFormData, LeadPriority } from '../types.js';

export const DDDS_VALIDOS = [
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99
] as const;

export const LEAD_SCORE_CONFIG = {
  lastUpdated: '2026-09-22T18:40:19.724Z',
  stateConfig: {
    question: 'Em qual estado está localizado?',
    priorityStates: ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'GO', 'DF', 'BA', 'PE', 'CE', 'ES', 'MT', 'MS', 'PB', 'RN', 'AL', 'SE', 'PI', 'MA', 'TO', 'PA', 'AM', 'RO', 'AC', 'RR', 'AP'],
    disqualifyNonPriority: false,
    pointsForPriorityState: 1
  },
  questions: [
    {
      id: 'storeType', question: 'Qual o tipo da loja?', type: 'single-choice', enabled: true, isDefault: true, disqualifyOnNo: false,
      options: [
        { value: 'opcao-storeType-3', label: 'Boutique', points: 40, disqualifies: false },
        { value: 'opcao-storeType-4', label: 'Multimarcas', points: 40, disqualifies: false },
        { value: 'opcao-storeType-3-2', label: 'Loja de shopping', points: 5, disqualifies: false },
        { value: 'opcao-storeType-5', label: 'Loja online', points: 5, disqualifies: true },
        { value: 'opcao-storeType-6', label: 'Revendedor(a) autônomo(a)', points: 1, disqualifies: true },
        { value: 'opcao-storeType-4-2', label: 'Magazine', points: 5, disqualifies: true }
      ]
    },
    {
      id: 'hasPhysicalStore', question: 'Possui loja física?', type: 'yes-no', enabled: true, isDefault: true, disqualifyOnNo: true,
      options: [
        { value: 'yes', label: 'Sim', points: 34, disqualifies: false },
        { value: 'no', label: 'Não', points: 5, disqualifies: true }
      ]
    },
    {
      id: 1790102115667, question: 'Tempo de CNPJ', type: 'single-choice', enabled: true, isDefault: false, disqualifyOnNo: false,
      options: [
        { value: 'opcao-1790102115667-1', label: 'Menos de 1 ano', points: 10, disqualifies: true },
        { value: 'opcao-1790102115667-2', label: 'De 1 a 2 anos', points: 15, disqualifies: false },
        { value: 'opcao-1790102115667-3', label: 'De 3 a 4 anos', points: 20, disqualifies: false },
        { value: 'opcao-1790102115667-4', label: 'Mais de 5 anos', points: 25, disqualifies: false }
      ]
    }
  ]
} as const;

export const phoneDigits = (value: string) => value.replace(/\D/g, '').slice(0, 11);

export function formatTelefone(value: string): string {
  const digits = phoneDigits(value);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function validarTelefoneCompleto(value: string): { valido: boolean; erro?: string } {
  const digits = phoneDigits(value);
  if (digits.length < 10 || digits.length > 11) return { valido: false, erro: 'Telefone deve ter 10 ou 11 dígitos.' };
  if (!DDDS_VALIDOS.includes(Number(digits.slice(0, 2)) as (typeof DDDS_VALIDOS)[number])) return { valido: false, erro: 'DDD inválido.' };
  if (digits.length === 11 && digits[2] !== '9') return { valido: false, erro: 'Celular deve ter o 9 após o DDD.' };
  return { valido: true };
}

export const validarEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export function converterParaE164(value: string): string {
  return `+55${phoneDigits(value)}`;
}

export const qualificationOptionFor = (questionIndex: number, value: string) => LEAD_SCORE_CONFIG.questions[questionIndex].options.find(option => option.value === value);

export function isLeadBlockedByCuration(data: Pick<LeadFormData, 'tipoLoja' | 'lojaFisica'>): boolean {
  return data.tipoLoja === 'opcao-storeType-4-2'
    || data.tipoLoja === 'opcao-storeType-6'
    || data.lojaFisica === 'no';
}

export function calculateLeadQualification(data: LeadFormData) {
  const storeType = qualificationOptionFor(0, data.tipoLoja);
  const physicalStore = qualificationOptionFor(1, data.lojaFisica);
  const cnpjAge = qualificationOptionFor(2, data.tempoCnpj);
  const statePoints = LEAD_SCORE_CONFIG.stateConfig.priorityStates.includes(data.estado as never)
    ? LEAD_SCORE_CONFIG.stateConfig.pointsForPriorityState
    : 0;
  const breakdown = {
    tipoLoja: { label: storeType?.label ?? '', points: storeType?.points ?? 0, source: 'formulario' },
    lojaFisica: { label: physicalStore?.label ?? '', points: physicalStore?.points ?? 0, source: 'formulario' },
    tempoCnpj: { label: cnpjAge?.label ?? '', points: cnpjAge?.points ?? 0, source: 'cnpj_api' },
    estado: { label: data.estado, points: statePoints, source: 'cnpj_api' }
  };
  const rawTotal = Object.values(breakdown).reduce((sum, item) => sum + item.points, 0);
  const score = Math.min(100, rawTotal);
  const disqualificationReasons = [
    storeType?.disqualifies ? 'storeType' : null,
    physicalStore?.disqualifies ? 'hasPhysicalStore' : null,
    cnpjAge?.disqualifies ? 'cnpjAge' : null
  ].filter((reason): reason is string => Boolean(reason));
  const priority: LeadPriority = disqualificationReasons.length > 0 ? 'disqualified' : score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  return { score, rawTotal, breakdown, priority, disqualified: disqualificationReasons.length > 0, disqualificationReasons };
}

export function logLeadScoreNoConsole(data: LeadFormData) {
  const qualification = calculateLeadQualification(data);
  console.group('Lead Score - Frysaide');
  console.table([
    { criterio: 'Estado', resposta: qualification.breakdown.estado.label, pontos: qualification.breakdown.estado.points, origem: 'API do CNPJ' },
    { criterio: 'Qual o tipo da loja?', resposta: qualification.breakdown.tipoLoja.label, pontos: qualification.breakdown.tipoLoja.points, origem: 'Formulário' },
    { criterio: 'Possui loja física?', resposta: qualification.breakdown.lojaFisica.label, pontos: qualification.breakdown.lojaFisica.points, origem: 'Formulário' },
    { criterio: 'Tempo de CNPJ', resposta: qualification.breakdown.tempoCnpj.label, pontos: qualification.breakdown.tempoCnpj.points, origem: 'API do CNPJ' }
  ]);
  console.info('Total:', qualification.score, 'de 100');
  console.info('Cidade/UF obtidas pela API:', `${data.cidade}/${data.estado}`);
  console.info('Status:', qualification.disqualified ? 'Desqualificado' : qualification.priority);
  if (qualification.disqualificationReasons.length) console.info('Motivos:', qualification.disqualificationReasons);
  console.groupEnd();
  return qualification;
}

export function isValidQualificationOption(questionIndex: number, value: string): boolean {
  return Boolean(qualificationOptionFor(questionIndex, value));
}
