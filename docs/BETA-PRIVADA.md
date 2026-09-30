# Cabidê — Beta privada, segurança e PWA

## Fluxo

```
Usuária → URL do Cabidê → Login / Convite → Supabase Auth → Cabidê (Next.js)
        → API server (/api/*) → Supabase (RLS) / Claude / Open-Meteo
```

Segredos (ANTHROPIC_API_KEY) e prompts ficam só no servidor (`src/server/`).
O navegador só recebe a URL do Supabase e a chave publicável (protegida por RLS).

## Beta pública × privada

Uma única variável (lida em `src/server/config.ts`):

| Vercel env            | Efeito                                   |
|-----------------------|------------------------------------------|
| `CABIDE_PUBLIC_BETA=false` (ou ausente) | Só entra quem tem convite |
| `CABIDE_PUBLIC_BETA=true`               | Cadastro livre           |

Depois de mudar a variável na Vercel, faça **Redeploy**.

## Convites (Supabase → SQL Editor)

As tabelas ficam no schema privado `beta` (não exposto pela API).

```sql
-- Criar convite de uso único, válido por 14 dias
select * from beta.create_invitation();

-- Vinculado a um e-mail, válido por 7 dias, com nota
select * from beta.create_invitation(p_email => 'tester@email.com', p_days => 7, p_note => 'Tester 01');

-- Sem expiração / com várias utilizações / código próprio
select * from beta.create_invitation(p_days => null);
select * from beta.create_invitation(p_max_uses => 5);
select * from beta.create_invitation(p_code => 'CABIDE-TEST-001');  -- evite códigos previsíveis

-- Revogar
select beta.revoke_invitation('CABIDE-XXXX-XXXX');

-- Ver todos (status efetivo, quem usou)
select * from beta.invitations_overview;

-- (Opcional) marcar vencidos como EXPIRED — a validação já considera a data
select beta.expire_invitations();
```

Envie à tester o link retornado em `invite_path`, prefixado pelo domínio:
`https://SEU-DOMINIO/signup?convite=CABIDE-XXXX-XXXX`

Estados: `ACTIVE`, `USED`, `EXPIRED`, `REVOKED`.

- **E-mail/senha:** o código é validado antes do cadastro e consumido pelo banco no momento em que a conta é criada.
- **Google:** o código é validado e guardado no navegador; após o login a tela `/convite` o resgata automaticamente.
- Quem tem conta mas não tem convite é levado a `/convite` e não acessa páginas nem APIs.

## Fotos (bucket `pecas`)

As fotos são servidas por `/api/fotos/<user_id>/<arquivo>`, que confere a dona e redireciona
para uma URL assinada (1 h). Depois do deploy deste código, aplique
`supabase/migrations/20260930120100_private_pecas_bucket.sql` para tornar o bucket privado.

## Idiomas

- Configuração: `src/i18n/config.ts` (`ENABLED_LOCALES`), textos em `src/i18n/messages/{pt-BR,es}.json`.
- Cliente: `const t = useT(); t('auth.login.title')`. Servidor: `const t = await getServerT()`.
- Idioma escolhido pelo cookie `cabide_locale` (espelho de `profiles.idioma`); hoje só `pt-BR` está liberado.
- Para liberar espanhol: adicionar `'es'` em `ENABLED_LOCALES` e completar `es.json`.

## PWA

- Manifest: `src/app/manifest.ts` · Ícones: `public/icons/` · Service worker: `public/sw.js`.
- O SW só guarda arquivos estáticos do build, ícones e `offline.html`. Nunca páginas, APIs, fotos ou dados do Supabase.
- Cada deploy gera um SW novo (`/sw.js?v=<commit>`) e apaga caches antigos. O logout também limpa os caches.

**Android (Chrome):** abrir o link → menu ⋮ → *Instalar app* / *Adicionar à tela inicial*.
**iPhone (Safari):** abrir o link no Safari → botão Compartilhar → *Adicionar à Tela de Início*.
