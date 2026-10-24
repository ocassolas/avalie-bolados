# Avalie Bolados

Web app (PWA) para rodas de amigos avaliarem bolados de tabaco e beck com um checklist em duas fases (pré-crema e pós-crema), calculadora de nota ponderada, ranking com média bayesiana, histórico por dia e hora, fotos e vídeos, e gamificação (XP, níveis, Brasas, conquistas, loja de temas).

Produção: https://avaliebolados.com.br · Guia do usuário: [COMO-USAR.txt](COMO-USAR.txt)

## Stack

- **Next.js 16** (App Router, Server Actions, `src/proxy.ts`) + React 19 + TypeScript
- **Tailwind CSS 4** com tokens em `src/app/globals.css` (7 temas via `data-theme`)
- **Supabase**: Auth (e-mail e senha), Postgres com RLS em todas as tabelas, Storage privado
- **Vercel** (região `gru1`)
- zod, Radix UI, motion, lucide, sonner, canvas-confetti, browser-image-compression, vitest

## Rodando local

```bash
npm install
cp .env.example .env.local   # sem as chaves do Supabase o app roda em modo demonstração
npm run dev
```

| Script | O que faz |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` | ESLint |
| `npm run typecheck` | gera os tipos de rota e roda `tsc` |
| `npm test` | testes da calculadora e da curva de níveis (vitest) |
| `npm run icons` | regenera favicon, ícones PWA, Apple e OG a partir de `public/brand/logo-mark.svg` |

## Banco de dados

Migrations em `supabase/migrations/`:

- `20261019000000_init.sql`: schema, helpers de autorização, triggers de XP/nota/conquistas, RPCs, RLS e políticas do Storage
- `20261019000100_seed_catalog.sql`: critérios do checklist, conquistas e itens da loja
- `20261020000000_rodas_owner_select.sql`: dono enxerga a roda no INSERT ... RETURNING
- `20261020010000_bolado_types.sql` + `20261020010100_bolado_contents.sql`: tipos novos, conteúdo do bolado (`contents[]`), proporção, peso, tamanho da seda; o tipo é derivado do conteúdo por trigger (espelho em `src/lib/contents.ts`)
- `20261020020000_mesclado_cumbaia.sql`: tabaco + flor/extração vira **mesclado** (com % de tabaco) e **cumbaia** passa a ser o blend de ervas naturais

Aplicar num projeto novo:

```bash
npx supabase db push --db-url "postgresql://postgres:SENHA@db.REF.supabase.co:5432/postgres"
```

Depois, no painel do Supabase (Authentication):

1. **URL Configuration** → Site URL `https://avaliebolados.com.br` e Redirect URLs `https://avaliebolados.com.br/**`, `http://localhost:3000/**`
2. **Email Templates** → colar `supabase/templates/confirmacao.html` (Confirm signup) e `recuperar-senha.html` (Reset password)
3. **Providers → Email** → "Confirm email" ligado; senha mínima 8

### Regras de segurança (resumo)

- Toda tabela tem RLS. O acesso é por roda (`is_roda_member`), e perfis só aparecem para quem divide roda com a pessoa ou quando ela os torna públicos.
- XP, nível, Brasas, notas, compras e conquistas só mudam por funções `security definer`. O cliente não tem `UPDATE` nessas colunas, e `evaluations` não tem `INSERT` direto: tudo passa por `submit_evaluation`.
- Regras no banco: ninguém avalia o próprio bolado, a nota vai de 0 a 10 com passo de 0,5, a edição só vale por 24 h, todos os critérios obrigatórios precisam de nota, há teto diário de XP e o cadastro exige 18 anos ou mais.
- Storage: buckets privados `avatars/{user}/…` e `media/{roda}/{bolado}/…`, com URLs assinadas válidas por 1 h.
- LGPD: consentimentos versionados, `export_my_data()`, `delete_my_account()` (as rodas passam para o próximo membro) e `revoke_consent()`.

O fluxo foi testado num Postgres local com stubs de `auth` e `storage`: cadastro de menor bloqueado, autoavaliação recusada, nota inválida recusada, XP protegido, isolamento entre rodas, Storage, loja e exclusão de conta.

## Modo demonstração

Sem `NEXT_PUBLIC_SUPABASE_URL` e sem a chave pública, `IS_DEMO` fica verdadeiro (`src/lib/env.ts`). Nesse modo, `src/lib/data.ts` devolve os dados fictícios de `src/lib/demo.ts` e todas as server actions respondem "modo demonstração".

## Estrutura

```
src/
  app/
    (auth)/        entrar, cadastro, recuperar-senha, redefinir-senha
    (app)/         inicio, ranking, historico, bolados/[id](/avaliar), bolados/novo,
                   perfil/[username], rodas(/[id]), loja, conquistas, configuracoes, como-usar
    actions/       server actions (auth.ts, app.ts)
    api/me/export  download LGPD
    auth/confirm   retorno dos links de e-mail
  components/      ui, brand, shell, ranking, bolado, evaluation (wizard), media, charts, gamification
  lib/             data (camada de dados), demo, scoring, levels, criteria, validation, supabase/*
supabase/          migrations e templates de e-mail
```
