import assert from 'node:assert/strict';
import { test } from 'node:test';
import formLogHandler from '../../api/form-log';
import { CNPJ_ERROR, cnpjDigits, formatCnpj, getCnpjFieldError, isValidCnpj } from './cnpj';
import { buildFormLogEntry, leadScoreSummary } from './formLog';
import { LOJA_FISICA_OPTIONS, TEMPO_CNPJ_OPTIONS, TIPO_LOJA_OPTIONS } from './formOptions';
import { buildLeadWebhookPayload } from './leadRequest';
import { calculateLeadQualification, converterParaE164, formatTelefone, validarEmail, validarTelefoneCompleto } from './leadScoring';
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
  assert.deepEqual(TIPO_LOJA_OPTIONS.map(option => option.label), ['Boutique', 'Multimarcas', 'Loja de Shopping', 'Magazine', 'Loja online', 'Revendedor(a) Autônomo(a)']);
  assert.deepEqual(LOJA_FISICA_OPTIONS.map(option => option.label), ['Sim', 'Não']);
  assert.deepEqual(TEMPO_CNPJ_OPTIONS.map(option => option.label), ['Menos de 1 ano', 'De 1 a 2 anos', 'De 2 a 4 anos', 'Mais de 5 anos']);
});

test('scores and disqualifies leads from the configured option values', () => {
  const scenarios = [
    { label: 'bom', changes: {}, points: [39, 30, 30, 1], total: 100, priority: 'high', disqualified: false },
    { label: 'intermediário', changes: { tipoLoja: 'opcao-storeType-4-2', tempoCnpj: 'opcao-1790102115667-2' }, points: [10, 30, 10, 1], total: 51, priority: 'medium', disqualified: false },
    { label: 'ruim', changes: { tipoLoja: 'opcao-storeType-6', lojaFisica: 'no', tempoCnpj: 'opcao-1790102115667-1' }, points: [0, 0, 5, 1], total: 6, priority: 'disqualified', disqualified: true }
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
