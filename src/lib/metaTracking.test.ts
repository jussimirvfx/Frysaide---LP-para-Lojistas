import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { prepareMetaLead, trackValidatedLead } from './metaTracking';
import { handleMetaConversion, prepareMetaEvent } from './metaConversions';
import type { LeadFormData } from '../types';

const data: LeadFormData = { nome: 'Pessoa Teste', nomeLoja: 'Loja Teste', telefone: '11999999999',
  email: 'teste@example.test', cidade: 'São Paulo', estado: 'SP', cnpj: '60887522000189', instagramLoja: '@teste',
  marcasVendidas: 'Teste', tipoLoja: 'opcao-storeType-3', lojaFisica: 'yes', tempoCnpj: 'opcao-1790102115667-4' };
const event = { event_name: 'Lead', event_id: 'test-lead-1', event_source_url: 'http://127.0.0.1:3000/',
  user_data: { em: ['TESTE@example.test'], ph: ['+5511999999999'], fn: ['Pessoa'], ct: ['São Paulo'], client_ip_address: 'SERÁ_PREENCHIDO_PELO_BACKEND' },
  custom_data: { value: 100, lead_score: 100, disqualified: false, currency: 'BRL' } };

test('good, intermediate and bad leads preserve score and choose correct Meta hooks', async () => {
  for (const [form, total, expected] of [
    [data, 100, ['Lead', 'LeadQualificado']],
    [{ ...data, tipoLoja: 'opcao-storeType-4-2', tempoCnpj: 'opcao-1790102115667-2' }, 51, ['Lead']],
    [{ ...data, tipoLoja: 'opcao-storeType-6', lojaFisica: 'no', tempoCnpj: 'opcao-1790102115667-1' }, 6, ['Lead']]
  ] as const) {
    const calls: string[] = [];
    const lead = prepareMetaLead(form);
    assert.equal(lead.lead_score, total);
    assert.equal(lead.value, total);
    assert.equal('cnpj' in lead, false);
    assert.equal('instagramLoja' in lead, false);
    await trackValidatedLead(form, async () => { calls.push('Lead'); }, async () => { calls.push('LeadQualificado'); });
    assert.deepEqual(calls, expected);
  }
});

test('invalid CNPJ blocks every Meta hook, including incomplete and repeated digits', async () => {
  let calls = 0;
  const tracker = async () => { calls++; };
  for (const cnpj of ['60887522000188', '00000000000000', '60887522', '']) {
    await assert.rejects(trackValidatedLead({ ...data, cnpj }, tracker, tracker), /CNPJ inválido/);
  }
  assert.equal(calls, 0);
});

test('tracking failure does not reject submission or skip qualified attempt', async () => {
  let qualified = false;
  await trackValidatedLead(data, async () => { throw new Error('network'); }, async () => { qualified = true; });
  assert.equal(qualified, true);
});

test('all dry-run flags and forced localhost mode prevent outbound requests', async () => {
  let calls = 0;
  const request: typeof fetch = async () => { calls++; throw new Error('Forbidden'); };
  const log = () => {};
  for (const flag of ['dry_run', 'dryRun', 'vfx_dry_run', 'skip_webhook']) {
    const result = await handleMetaConversion({ ...event, [flag]: true }, {}, { request, log, env: {} });
    assert.equal(result.status, 200);
    assert.equal(result.body.skipped_meta, true);
  }
  for (const options of [{ forceDryRun: true }, { env: { META_DRY_RUN: 'true' } }]) {
    assert.equal((await handleMetaConversion(event, {}, { request, log, ...options })).body.dry_run, true);
  }
  assert.equal((await handleMetaConversion(event, { 'x-vfx-dry-run': '1' }, { request, log, env: {} })).body.dry_run, true);
  assert.equal(calls, 0);
});

test('matching data is normalized/hashed once; IP and user agent come from server headers', () => {
  const prepared = prepareMetaEvent(event, { 'x-forwarded-for': '203.0.113.10, 10.0.0.1', 'user-agent': 'test-agent' });
  for (const field of ['em', 'ph', 'fn', 'ct']) assert.match((prepared.user_data[field] as string[])[0], /^[a-f0-9]{64}$/);
  assert.equal(prepared.user_data.client_ip_address, '203.0.113.10');
  assert.equal(prepared.user_data.client_user_agent, 'test-agent');
  const twice = prepareMetaEvent({ ...event, user_data: prepared.user_data }, {});
  assert.deepEqual(twice.user_data.em, prepared.user_data.em);
  assert.equal('client_ip_address' in twice.user_data, false);
  assert.equal(prepared.event_id, event.event_id);
});

test('Meta error is 202 with recoverable payloads and no token in logs', async () => {
  const secret = 'secret-test-token';
  const logs: Record<string, unknown>[] = [];
  const result = await handleMetaConversion({ ...event, access_token: secret }, {}, {
    env: { META_PIXEL_ID: '2607151959787465', META_API_ACCESS_TOKEN: secret }, log: entry => logs.push(entry),
    request: async (_url, init) => {
      assert.equal(logs[0].event, 'conversion_api_event_backup');
      assert.equal((init?.headers as Record<string, string>).Authorization, `Bearer ${secret}`);
      assert.ok(!String(init?.body).includes(secret));
      return new Response(JSON.stringify({ error: { message: secret } }), { status: 400 });
    }
  });
  assert.equal(result.status, 202);
  assert.equal(result.body.accepted, true);
  assert.equal(result.body.meta_sent, false);
  const error = logs.find(entry => entry.event === 'conversion_api_event_error');
  assert.ok(error?.request_payload);
  assert.ok(error?.prepared_meta_payload);
  assert.equal(error?.meta_status, 400);
  assert.ok(!JSON.stringify(logs).includes(secret));
});

test('successful mocked Meta request confirms receipt; test code never goes to production', async () => {
  for (const production of [false, true]) {
    const result = await handleMetaConversion(event, {}, {
      env: { META_PIXEL_ID: '2607151959787465', META_API_ACCESS_TOKEN: 'test-only', META_TEST_EVENT_CODE: 'TEST84559', VERCEL_ENV: production ? 'production' : 'preview' },
      log: () => {}, request: async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        assert.equal(body.test_event_code, production ? undefined : 'TEST84559');
        return new Response('{"events_received":1}');
      }
    });
    assert.equal(result.body.meta_sent, true);
  }
});

test('missing credentials and internal errors are accepted without breaking the form', async () => {
  for (const body of [event, '{bad json', { ...event, event_name: 'LeadQualificado', custom_data: { lead_score: 6, value: 6, disqualified: true } }]) {
    const logs: Record<string, unknown>[] = [];
    const result = await handleMetaConversion(body, {}, { env: {}, log: entry => logs.push(entry) });
    assert.equal(result.status, 202);
    assert.ok(logs.some(entry => entry.event === 'conversion_api_event_error'));
  }
});

test('installed scoretrack safety patch is present', () => {
  const source = readFileSync(new URL('../../node_modules/scoretrack/dist/index.js', import.meta.url), 'utf8');
  assert.ok(!source.includes('return yield sendDirectToMetaAPI(event)'));
  assert.ok(source.includes('if (META_PIXEL_CONFIG.LOCAL_DRY_RUN) return false;'));
  assert.ok(source.includes('LOCAL_META_DRY_RUN'));
});
