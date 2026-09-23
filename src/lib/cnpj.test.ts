import assert from 'node:assert/strict';
import { test } from 'node:test';
import formLogHandler from '../../api/form-log';
import cnpjHandler from '../../api/cnpj.js';
import leadHandler from '../../api/leads.js';
import { CNPJ_ERROR, cnpjDigits, formatCnpj, getCnpjFieldError, isValidCnpj } from './cnpj';
import { calcularIdadeCnpj, CNPJ_LOOKUP_ERROR, fetchCnpjEnrichment, normalizeCnpjApiData, tempoCnpjValueFromYears } from './cnpjLookup';
import { buildFormLogEntry, leadScoreSummary } from './formLog';
import { LOJA_FISICA_OPTIONS, TEMPO_CNPJ_OPTIONS, TIPO_LOJA_OPTIONS } from './formOptions';
import { buildLeadWebhookPayload } from './leadRequest';
import { calculateLeadQualification, converterParaE164, formatTelefone, isLeadBlockedByCuration, LEAD_SCORE_CONFIG, validarEmail, validarTelefoneCompleto } from './leadScoring';
import { sendLead } from './sendLead';
import type { LeadFormData, LeadSubmissionContext } from '../types';

const data: LeadFormData = {
  nome: 'João Teste', nomeLoja: 'Loja de teste', telefone: '(11) 99999-9999', email: 'teste@example.test',
  cidade: 'São Paulo', estado: 'SP', cnpj: '60887522000189', instagramLoja: '@teste',
  marcasVendidas: 'Teste', tipoLoja: 'opcao-storeType-3', lojaFisica: 'yes', tempoCnpj: 'opcao-1790102115667-4'
};
const context: LeadSubmissionContext = {
  timestamp: '2026-09-22T12:00:00.000Z', pageUrl: 'https://example.test/', userAgent: 'test-agent', referrer: 'direct'
};

test('accepts the valid checksum, raw or masked', () => {
  assert.equal(isValidCnpj('60887522000189'), true);
  assert.equal(isValidCnpj('60.887.522/0001-89'), true);
});

test('rejects altered check digits, repeated digits, incomplete and oversized values', () => {
  for (const value of ['60887522000188', '60887522000179', '', '608875220001', '608875220001899', ...Array.from({ length: 10 }, (_, i) => String(i).repeat(14))]) {
    assert.equal(isValidCnpj(value), false, value);
  }
});

test('shows the standard error on blur for incomplete or invalid CNPJ', () => {
  assert.equal(getCnpjFieldError(''), '');
  assert.equal(getCnpjFieldError('608875220001'), CNPJ_ERROR);
  assert.equal(getCnpjFieldError('60887522000188'), CNPJ_ERROR);
  assert.equal(getCnpjFieldError('60887522000189'), '');
});

test('strips non-numeric characters, limits to 14 digits, and masks partial input', () => {
  assert.equal(formatCnpj('abc60.887.522/0001-89xyz1234'), '60.887.522/0001-89');
  for (let i = 0; i <= 14; i++) {
    const input = '60887522000189'.slice(0, i);
    assert.equal(cnpjDigits(formatCnpj(input)), input);
  }
});

test('invalid or incomplete CNPJ never calls backup or webhook', async () => {
  let calls = 0;
  const request: typeof fetch = async () => { calls++; throw new Error('Unexpected network call'); };
  for (const cnpj of ['60887522000188', '00000000000000', '608875220001', '']) {
    await assert.rejects(sendLead({ ...data, cnpj }, '/api/leads', request, context), { message: CNPJ_ERROR });
  }
  assert.equal(calls, 0);
});

test('valid submission awaits backup before webhook and reuses the complete payload', async () => {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  const request: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) as Record<string, unknown> });
    return new Response('{}', { status: 200 });
  };
  await sendLead(data, '/api/leads', request, context);
  assert.deepEqual(calls.map(call => call.url), ['/api/form-log', '/api/leads']);
  const webhookPayload = calls[1].body;
  assert.deepEqual(calls[0].body.payload, webhookPayload);
  assert.equal(webhookPayload.cnpj, '60.887.522/0001-89');
  assert.equal(webhookPayload.cnpj_validation_status, 'checksum_valid');
  assert.equal(webhookPayload.phone, '+5511999999999');
  assert.equal(webhookPayload.whatsapp, '(11) 99999-9999');
  assert.equal(webhookPayload.tipoLoja, 'Boutique');
  assert.equal(webhookPayload.tipoLoja_value, 'opcao-storeType-3');
  assert.equal(webhookPayload.value, 100);
  assert.equal(webhookPayload.lead_score, 100);
});

test('gets hidden city, state and CNPJ age from a mocked CNPJ API response', async () => {
  let requestedUrl = '';
  let requestedInit: RequestInit | undefined;
  const request: typeof fetch = async (url, init) => {
    requestedUrl = String(url);
    requestedInit = init;
    return new Response(JSON.stringify({
      ok: true,
      cnpj_valido: true,
      encontrado: true,
      fonte: 'SINTEGRA',
      company: {
        razao_social: 'Empresa Teste',
        nome_fantasia: 'Loja Teste',
        data_abertura: '23/09/2020',
        endereco: { cidade: 'São Paulo', estado: 'sp' }
      }
    }));
  };
  const result = await fetchCnpjEnrichment('60.887.522/0001-89', request, new Date('2026-09-23T12:00:00Z'), { oidcToken: 'oidc-test', landingId: 'frysaide-lojistas' });
  assert.equal(requestedUrl, 'https://validador-cnpj.vfxaceleradordevendas.com.br/api/v1/cnpj');
  assert.equal(requestedInit?.method, 'POST');
  assert.equal((requestedInit?.headers as Record<string, string>).Authorization, 'Bearer oidc-test');
  assert.equal((requestedInit?.headers as Record<string, string>)['X-VFX-Landing-ID'], 'frysaide-lojistas');
  assert.deepEqual(JSON.parse(String(requestedInit?.body)), { cnpj: '60887522000189' });
  assert.deepEqual(result, {
    cidade: 'São Paulo', estado: 'SP', dataInicioAtividade: '2020-09-23', idadeCnpjAnos: 6,
    tempoCnpj: 'opcao-1790102115667-4', fonte: 'SINTEGRA', encontrado: true,
    cnpjValido: true, cnpjValidationStatus: 'cadastral_valid',
    company: {
      razao_social: 'Empresa Teste', nome_fantasia: 'Loja Teste', situacao_cadastral: '',
      data_abertura: '2020-09-23', porte: '', cnae_principal: '', descricao_cnae_principal: '',
      inscricoes_estaduais: [], inscricao_estadual_status: '', possui_inscricao_estadual: null,
      endereco: { completo: '', rua: '', numero: '', complemento: '', bairro: '', cidade: 'São Paulo', estado: 'SP', cep: '' }
    }
  });
});

test('same-origin CNPJ route forwards only the runtime OIDC token to the central API', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  let requestedInit: RequestInit | undefined;
  globalThis.fetch = async (url, init) => {
    requestedUrl = String(url);
    requestedInit = init;
    return new Response(JSON.stringify({
      ok: true, cnpj_valido: true, encontrado: true, fonte: 'SINTEGRA',
      company: { razao_social: 'Empresa Teste', data_abertura: '23/09/2020', endereco: { cidade: 'São Paulo', estado: 'SP' } }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  let statusCode = 0;
  let responseBody: unknown;
  const response = {
    status(code: number) { statusCode = code; return this; },
    json(body: unknown) { responseBody = body; },
    setHeader() { return this; }
  };
  try {
    await cnpjHandler({
      method: 'GET',
      url: '/api/cnpj?cnpj=60887522000189',
      headers: { host: 'localhost', 'x-vercel-oidc-token': 'runtime-oidc', authorization: 'Bearer browser-token' }
    } as never, response as never);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(statusCode, 200);
  assert.equal(requestedUrl, 'https://validador-cnpj.vfxaceleradordevendas.com.br/api/v1/cnpj');
  const headers = requestedInit?.headers as Record<string, string>;
  assert.equal(headers.Authorization, 'Bearer runtime-oidc');
  assert.equal(headers['X-VFX-Landing-ID'], 'frysaide-lojistas');
  assert.equal(JSON.parse(String(requestedInit?.body)).cnpj, '60887522000189');
  assert.equal(JSON.stringify(headers).includes('browser-token'), false);
  assert.equal((responseBody as { cnpj_validation_status: string }).cnpj_validation_status, 'cadastral_valid');
});

test('classifies hidden CNPJ age without gaps and rejects invalid lookup data', () => {
  const today = new Date('2026-09-23T12:00:00Z');
  assert.equal(calcularIdadeCnpj('2025-09-24', today), 0);
  assert.equal(calcularIdadeCnpj('2024-09-23', today), 2);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(tempoCnpjValueFromYears), [
    'opcao-1790102115667-1', 'opcao-1790102115667-2', 'opcao-1790102115667-2',
    'opcao-1790102115667-3', 'opcao-1790102115667-3', 'opcao-1790102115667-4'
  ]);
  assert.throws(() => normalizeCnpjApiData({ ok: true, cnpj_valido: true, encontrado: true, company: { razao_social: '', endereco: { estado: 'SP' }, data_abertura: '2020-01-01' } }, today), { message: CNPJ_LOOKUP_ERROR });
  assert.throws(() => normalizeCnpjApiData({ ok: true, cnpj_valido: true, encontrado: true, company: { razao_social: 'Empresa', endereco: { cidade: 'São Paulo', estado: 'SP' }, data_abertura: '2099-01-01' } }, today), { message: CNPJ_LOOKUP_ERROR });
});

test('invalid CNPJ blocks the external lookup request', async () => {
  let calls = 0;
  const request: typeof fetch = async () => { calls++; return new Response('{}'); };
  for (const cnpj of ['60887522000188', '00000000000000', '608875220001']) {
    await assert.rejects(fetchCnpjEnrichment(cnpj, request), { message: CNPJ_ERROR });
  }
  assert.equal(calls, 0);
});

test('lead without a physical store never calls backup or webhook', async () => {
  let calls = 0;
  const request: typeof fetch = async () => { calls++; throw new Error('Unexpected network call'); };
  await assert.rejects(
    sendLead({ ...data, lojaFisica: 'no' }, '/api/leads', request, context),
    { message: 'Cadastro não selecionado pela curadoria.' }
  );
  assert.equal(calls, 0);
});

test('backup failure is handled before preserving failed-webhook behavior', async () => {
  let calls = 0;
  const request: typeof fetch = async () => {
    calls++;
    return new Response(null, { status: calls === 1 ? 500 : 502 });
  };
  const originalWarn = console.warn;
  console.warn = () => undefined;
  try {
    await assert.rejects(sendLead(data, '/api/leads', request, context), { message: 'Submission failed' });
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(calls, 2);
});

test('uses the exact lead-score options and user-facing labels', () => {
  assert.deepEqual(TIPO_LOJA_OPTIONS.map(option => option.label), ['Boutique', 'Multimarcas', 'Loja de shopping', 'Loja online', 'Revendedor(a) autônomo(a)', 'Magazine']);
  assert.deepEqual(LOJA_FISICA_OPTIONS.map(option => option.label), ['Sim', 'Não']);
  assert.deepEqual(TEMPO_CNPJ_OPTIONS.map(option => option.label), ['Menos de 1 ano', 'De 1 a 2 anos', 'De 3 a 4 anos', 'Mais de 5 anos']);
});

test('matches every score and disqualification rule from the approved configuration', () => {
  assert.deepEqual(LEAD_SCORE_CONFIG.questions.map(question => question.options.map(option => ({
    label: option.label, points: option.points, disqualifies: option.disqualifies
  }))), [
    [
      { label: 'Boutique', points: 40, disqualifies: false },
      { label: 'Multimarcas', points: 40, disqualifies: false },
      { label: 'Loja de shopping', points: 5, disqualifies: false },
      { label: 'Loja online', points: 5, disqualifies: true },
      { label: 'Revendedor(a) autônomo(a)', points: 1, disqualifies: true },
      { label: 'Magazine', points: 5, disqualifies: true }
    ],
    [
      { label: 'Sim', points: 34, disqualifies: false },
      { label: 'Não', points: 5, disqualifies: true }
    ],
    [
      { label: 'Menos de 1 ano', points: 10, disqualifies: true },
      { label: 'De 1 a 2 anos', points: 15, disqualifies: false },
      { label: 'De 3 a 4 anos', points: 20, disqualifies: false },
      { label: 'Mais de 5 anos', points: 25, disqualifies: false }
    ]
  ]);
  assert.equal(LEAD_SCORE_CONFIG.stateConfig.priorityStates.length, 27);
  assert.equal(LEAD_SCORE_CONFIG.stateConfig.pointsForPriorityState, 1);
});

test('curation blocks Magazine, Revendedor(a) autônomo(a) and leads without a physical store', () => {
  assert.equal(isLeadBlockedByCuration({ tipoLoja: 'opcao-storeType-4-2', lojaFisica: 'yes' }), true);
  assert.equal(isLeadBlockedByCuration({ tipoLoja: 'opcao-storeType-6', lojaFisica: 'yes' }), true);
  assert.equal(isLeadBlockedByCuration({ tipoLoja: 'opcao-storeType-3', lojaFisica: 'no' }), true);
  for (const tipoLoja of ['opcao-storeType-3', 'opcao-storeType-4', 'opcao-storeType-3-2', 'opcao-storeType-5', '']) {
    assert.equal(isLeadBlockedByCuration({ tipoLoja, lojaFisica: 'yes' }), false, tipoLoja);
  }
});

test('scores and disqualifies leads from the configured option values', () => {
  const scenarios = [
    { label: 'bom', changes: {}, points: [40, 34, 25, 1], total: 100, priority: 'high', disqualified: false },
    { label: 'intermediário', changes: { tipoLoja: 'opcao-storeType-3-2', tempoCnpj: 'opcao-1790102115667-2' }, points: [5, 34, 15, 1], total: 55, priority: 'medium', disqualified: false },
    { label: 'ruim', changes: { tipoLoja: 'opcao-storeType-6', lojaFisica: 'no', tempoCnpj: 'opcao-1790102115667-1' }, points: [1, 5, 10, 1], total: 17, priority: 'disqualified', disqualified: true }
  ] as const;
  for (const scenario of scenarios) {
    const qualification = calculateLeadQualification({ ...data, ...scenario.changes });
    assert.deepEqual(Object.values(qualification.breakdown).map(item => item.points), scenario.points, scenario.label);
    assert.equal(qualification.rawTotal, scenario.total, scenario.label);
    assert.equal(qualification.score, scenario.total, scenario.label);
    assert.equal(qualification.priority, scenario.priority, scenario.label);
    assert.equal(qualification.disqualified, scenario.disqualified, scenario.label);
  }
});

test('validates, masks and converts Brazilian phones', () => {
  assert.equal(formatTelefone('11999999999abc'), '(11) 99999-9999');
  assert.deepEqual(validarTelefoneCompleto('(11) 99999-9999'), { valido: true });
  assert.deepEqual(validarTelefoneCompleto('00999999999'), { valido: false, erro: 'DDD inválido.' });
  assert.deepEqual(validarTelefoneCompleto('11899999999'), { valido: false, erro: 'Celular deve ter o 9 após o DDD.' });
  assert.deepEqual(validarTelefoneCompleto('1199999'), { valido: false, erro: 'Telefone deve ter 10 ou 11 dígitos.' });
  assert.equal(converterParaE164('(11) 99999-9999'), '+5511999999999');
  assert.equal(validarEmail('pessoa@example.com'), true);
  assert.equal(validarEmail('sem-arroba'), false);
});

test('builds a Meta-compatible webhook payload without dropping form fields', () => {
  const payload = buildLeadWebhookPayload(data, context.timestamp, context.pageUrl, context.userAgent, context.referrer);
  assert.equal(payload.nomeLoja, data.nomeLoja);
  assert.equal(payload.name, data.nome);
  assert.equal(payload.email, data.email);
  assert.equal(payload.city, data.cidade);
  assert.equal(payload.state, data.estado);
  assert.equal(payload.value, payload.lead_score);
  assert.equal(payload.timestamp, context.timestamp);
  assert.equal(payload.page_url, context.pageUrl);
});

test('allows checksum-valid leads when optional CNPJ enrichment is unavailable', () => {
  const payload = buildLeadWebhookPayload({ ...data, cidade: '', estado: '', tempoCnpj: '' }, context.timestamp, context.pageUrl);
  assert.equal(payload.cnpj_validation_status, 'checksum_valid');
  assert.equal(payload.cidade, '');
  assert.equal(payload.estado, '');
  assert.equal(payload.tempoCnpj, '');
});

test('lead endpoint delivers a checksum-valid lead when the central CNPJ API is unavailable', async () => {
  const originalFetch = globalThis.fetch;
  const originalWebhook = process.env.N8N_FRYSAIDE_WEBHOOK_URL;
  const originalWarn = console.warn;
  let webhookPayload: Record<string, unknown> | null = null;
  let statusCode = 0;
  let responseBody: unknown;
  process.env.N8N_FRYSAIDE_WEBHOOK_URL = 'https://n8n.example.test/webhook';
  globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('https://validador-cnpj.vfxaceleradordevendas.com.br/')) return new Response('unavailable', { status: 503 });
    webhookPayload = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response('{}', { status: 200 });
  };
  console.warn = () => undefined;
  const response = {
    status(code: number) { statusCode = code; return this; },
    json(body: unknown) { responseBody = body; },
    setHeader() { return this; }
  };
  try {
    await leadHandler({ method: 'POST', body: { ...data, cidade: '', estado: '', tempoCnpj: '' }, headers: {} } as never, response as never);
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    if (originalWebhook === undefined) delete process.env.N8N_FRYSAIDE_WEBHOOK_URL;
    else process.env.N8N_FRYSAIDE_WEBHOOK_URL = originalWebhook;
  }
  assert.equal(statusCode, 200);
  assert.deepEqual(responseBody, {
    success: true,
    enrichment_available: false,
    lead_score_summary: { lead_score: 74, lead_priority: 'high', disqualified: false }
  });
  assert.equal(webhookPayload?.cnpj_validation_status, 'checksum_valid');
  assert.equal(webhookPayload?.cidade, '');
  assert.equal(webhookPayload?.tempoCnpj, '');
});

test('server-side validation blocks invalid phone, email and qualification options', () => {
  assert.throws(() => buildLeadWebhookPayload({ ...data, telefone: '123' }, '', ''), { message: 'Telefone deve ter 10 ou 11 dígitos.' });
  assert.throws(() => buildLeadWebhookPayload({ ...data, email: 'inválido' }, '', ''), { message: 'E-mail inválido.' });
  assert.throws(() => buildLeadWebhookPayload({ ...data, tipoLoja: 'Boutique' }, '', ''), { message: 'Tipo de loja inválido.' });
});

test('form log marks dry-run and the route responds 200 without external requests', async () => {
  const payload = buildLeadWebhookPayload(data, context.timestamp, context.pageUrl);
  const entry = buildFormLogEntry({ body: { dry_run: true, payload }, headers: {} }, new Date(context.timestamp));
  assert.equal(entry.msg, 'landing_form_backup');
  assert.equal(entry.dry_run, true);
  assert.deepEqual(entry.lead_score_summary, leadScoreSummary(payload));
  assert.equal(entry.lead_score_summary.raw_total, 100);
  assert.equal(entry.lead_score_summary.total, 100);

  let statusCode = 0;
  let responseBody: unknown;
  const response = {
    status(code: number) { statusCode = code; return this; },
    json(body: unknown) { responseBody = body; },
    end() { return this; },
    setHeader() { return this; }
  };
  const originalInfo = console.info;
  console.info = () => undefined;
  try {
    await formLogHandler({ method: 'POST', body: { dry_run: true }, headers: {} } as never, response as never);
  } finally {
    console.info = originalInfo;
  }
  assert.equal(statusCode, 200);
  assert.deepEqual(responseBody, { ok: true });
});
