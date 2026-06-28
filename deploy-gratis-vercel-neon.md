# Deploy gratuito - Vercel + Neon

Este é o caminho recomendado para continuar sem assinatura paga.

## Stack gratuita

- GitHub: código.
- Neon Free: banco PostgreSQL.
- Vercel Hobby: hospedagem do Next.js.

## 1. Criar banco grátis no Neon

Acesse:

```text
https://neon.tech
```

Crie uma conta e um projeto gratuito.

Depois copie a connection string do banco. Ela deve parecer com:

```text
postgresql://usuario:senha@host.neon.tech/database?sslmode=require
```

Essa será a variável:

```text
DATABASE_URL
```

## 2. Criar projeto na Vercel

Acesse:

```text
https://vercel.com
```

1. Clique em **Add New**.
2. Clique em **Project**.
3. Importe o repositório:

```text
felgss/MGV
```

4. A Vercel deve detectar Next.js.

O arquivo `vercel.json` já define o build:

```bash
npm run vercel:build
```

Esse build:

1. gera o Prisma Client;
2. aplica migrations no Neon;
3. compila o Next.js.

## 3. Configurar variáveis na Vercel

Em **Settings → Environment Variables**, adicione:

```text
DATABASE_URL
```

Valor: connection string do Neon.

```text
SESSION_COOKIE_NAME
```

Valor:

```text
mgv_session
```

```text
TENANT_NAME
```

Valor:

```text
Método MGV
```

```text
TENANT_SLUG
```

Valor:

```text
metodo-mgv
```

```text
ADMIN_NAME
```

Valor:

```text
Felipe Grossi
```

```text
ADMIN_EMAIL
```

Valor:

```text
admin@mgv.com
```

```text
ADMIN_PASSWORD
```

Valor sugerido:

```text
Mgv@SenhaForte2026
```

```text
BOOTSTRAP_SECRET
```

Valor sugerido:

```text
mgv-bootstrap-2026-trocar
```

Use outro valor se preferir.

## 4. Fazer deploy

Depois de configurar as variáveis, clique em:

```text
Deploy
```

## 5. Criar o primeiro administrador

Depois que o deploy terminar, abra:

```text
https://SUA-URL-DA-VERCEL.vercel.app/api/bootstrap?secret=SEU_BOOTSTRAP_SECRET
```

Exemplo:

```text
https://mgv-dashboard.vercel.app/api/bootstrap?secret=mgv-bootstrap-2026-trocar
```

Se der certo, você verá:

```json
{
  "ok": true,
  "message": "Bootstrap concluído."
}
```

Depois disso, por segurança, troque ou remova a variável:

```text
BOOTSTRAP_SECRET
```

## 6. Testar saúde do app

Abra:

```text
https://SUA-URL-DA-VERCEL.vercel.app/api/health
```

Esperado:

```json
{
  "ok": true,
  "service": "mgv-dashboard",
  "database": "connected"
}
```

## 7. Entrar no sistema

Abra:

```text
https://SUA-URL-DA-VERCEL.vercel.app
```

Login:

```text
admin@mgv.com
ADMIN_PASSWORD configurada
```

## Observações

- Não use Render se ele estiver exigindo assinatura.
- Não use GitHub Pages para este sistema.
- Não rode `npm run db:seed` em produção.
- O banco gratuito do Neon é suficiente para desenvolvimento e validação inicial.
- Quando o SaaS virar operação real com clientes, revisamos limites, backups e segurança.
