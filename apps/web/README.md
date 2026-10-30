# Symetra · web

Um único app Next.js serve o site e o painel em www.symetra.com.br.

## Rotas

| Rota | O que é | Onde fica | No Google? |
| :--- | :--- | :--- | :--- |
| `/` | Site da Symetra (serviços sob medida) | `public/home.html` (HTML estático, servido por rewrite no `next.config.ts`) | Sim |
| `/blog` | Artigos para SEO | `src/app/blog/` (novos artigos em `posts.ts`) | Sim |
| `/clinicas` | Landing antiga do produto para clínicas (arquivada) | `src/app/clinicas/` | Não (noindex) |
| `/contabilidade` | Landing antiga de teste (arquivada) | `src/app/contabilidade/` | Não (noindex) |
| `/login` | Entrada do painel | `src/app/(auth)/login/` | Não (noindex) |
| `/dashboard/*` | Painel (clínica e agência); exige login | `src/app/dashboard/` | Não |
| `/logout`, `/sair` | Encerram a sessão | `src/app/logout/` | — |
| `/inbox`, `/dashboards` | Atalhos para o painel | redirects no `next.config.ts` | — |

Regras:

- Página nova do site: crie a pasta em `src/app/` e, se for pública, adicione no `src/app/sitemap.ts`.
- Página antiga que não deve aparecer no Google: `robots: { index: false }` no `layout.tsx` dela (não bloqueie no `robots.ts`).
- O login só é verificado em `/dashboard` (`src/middleware.ts`). O site público não depende do banco nem da autenticação.

## Rodar

```bash
pnpm dev                                  # desenvolvimento, porta 3000
pnpm build && AUTH_TRUST_HOST=true pnpm start   # produção local (na Vercel o AUTH_TRUST_HOST é automático)
```
