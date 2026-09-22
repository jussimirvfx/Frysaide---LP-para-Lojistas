# Etapa 2 — Meta Pixel / Conversions API

Projeto Vite + React, não Next.js. Pacote `scoretrack@1.0.0` do registry.npmjs.org.

## Localhost

`npm.cmd ci` e `npm.cmd run dev`. Porta alternativa:
`npm.cmd run dev -- --port 3001 --strictPort`.

O Vite força dry-run em `/api/leads` e `/api/meta/conversions`, sem Meta/n8n.
O Pixel do navegador também fica desativado em desenvolvimento/localhost.
Console: `LOCAL_LEAD_SCORE` mostra componentes, soma, total e classificação;
`LOCAL_META_DRY_RUN` mostra evento, ID, score e `skipped_meta:true`.
Terminal: `conversion_api_event_backup` antes do processamento.

| Perfil sintético | Soma | Eventos |
| --- | --- | --- |
| Boutique, loja física, mais de 5 anos, SP | 39 + 30 + 30 + 1 = 100 | Lead + LeadQualificado |
| Magazine, loja física, 1 a 2 anos, SP | 10 + 30 + 10 + 1 = 51 | Lead |
| Autônomo, sem loja física, menos de 1 ano, SP | 0 + 0 + 5 + 1 = 6 | Lead |

Qualificação: score >= 70, sem desqualificadores. `value === lead_score`.
CNPJ validado apenas pelo checksum; não comprova existência/situação cadastral.
Inválidos não disparam tracking. Tracking ocorre após sucesso comercial, sem bloquear o form.
O payload Meta exclui CNPJ, Instagram e demais campos comerciais do formulário.

## Segurança

Somente `VITE_META_PIXEL_ID` é público. `META_API_ACCESS_TOKEN` é exclusivo do
servidor, em `.env.local` ignorado pelo Git ou no provedor de hospedagem.
Nunca prefixar o token com `VITE_` ou `NEXT_PUBLIC_`.

`patches/scoretrack+1.0.0.patch` é aplicado por patch-package em postinstall,
predev e prebuild, com falha em incompatibilidade. Remove exigência de token
público e fallback direto à Meta, bloqueia Pixel no dry-run, evita PageView
duplicado entre provider/componente e aguarda preparação assíncrona dos dados.
Imports continuam vindo de scoretrack. Não remover a correção sem revisão.
O pacote inclui SDK de servidor no bundle: há avisos de tamanho e eval no build,
uma limitação da dependência, não erro de compilação.

## Rota server-side

POST `/api/meta/conversions`: dry-run por `X-VFX-Dry-Run: true/1`,
`META_DRY_RUN=true` ou body `dry_run`, `dryRun`, `vfx_dry_run`, `skip_webhook`
com true/1 (também strings). Retorna 200, `dry_run:true`, `skipped_meta:true`.
Matching SHA-256 sem re-hash de dados já preparados. Pixel/CAPI compartilham ID.
Sucesso confirmado: `meta_sent:true`. Falha: 202, `accepted:true`, `meta_sent:false`,
log `conversion_api_event_error` com request e payload preparado, tokens redigidos.
Restringir acesso e retenção dos logs de leads.

## Publicação — ainda não validada

Configurar META_PIXEL_ID, META_API_ACCESS_TOKEN, VITE_META_PIXEL_ID e
META_DRY_RUN=false no ambiente correto. Remover META_TEST_EVENT_CODE em produção;
o código também o ignora quando VERCEL_ENV ou NODE_ENV indica produção.
Preservar as variáveis comerciais da etapa 1. Não publicar `.env.local`.

Validar recebimento/deduplicação no Gerenciador de Eventos e executar
`lp-production-observability-check.sh` do kit VFX após configurar domínio/projeto.
Esse script não foi fornecido neste repositório: gate não executado nem aprovado.
Recebimento real pela Meta e validade das credenciais não foram testados localmente.

## Verificação

`npm.cmd test`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`.
Testes usam mocks; não enviam dados à Meta.
