# Próximo passo: publicar no Render

Use este guia depois que os arquivos estiverem visíveis no GitHub em:

```text
https://github.com/felgss/MGV
```

## 1. Entrar no Render

Acesse:

```text
https://render.com
```

## 2. Criar pelo Blueprint

No painel do Render:

1. Clique em **New**.
2. Escolha **Blueprint**.
3. Conecte sua conta GitHub, se ainda não estiver conectada.
4. Escolha o repositório:

```text
felgss/MGV
```

5. Confirme o arquivo:

```text
render.yaml
```

6. Clique para aplicar/criar.

## 3. O que o Render vai criar

O Blueprint vai criar:

- Web Service: `mgv-dashboard`
- PostgreSQL: `mgv-dashboard-db`
- Variável `DATABASE_URL` conectada ao banco
- Health check em `/api/health`

## 4. Variável obrigatória

Antes ou logo após criar o serviço, defina:

```text
ADMIN_PASSWORD
```

Sugestão temporária:

```text
Mgv@SenhaForte2026
```

Depois você pode trocar.

## 5. Primeiro deploy

O Render vai rodar automaticamente:

```bash
npm install && npm run render:build
```

Se o deploy terminar com sucesso, o app vai iniciar com:

```bash
npm run start
```

## 6. Criar o primeiro admin

No Render, abra o Shell do serviço `mgv-dashboard` e rode:

```bash
npm run db:bootstrap
```

## 7. Testar

Abra:

```text
https://SUA-URL.onrender.com/api/health
```

Esperado:

```json
{
  "ok": true,
  "service": "mgv-dashboard",
  "database": "connected"
}
```

Depois entre no sistema:

```text
https://SUA-URL.onrender.com
```

Login:

```text
admin@mgv.com
ADMIN_PASSWORD que você definiu
```

## Se algo falhar

Copie o erro do log do Render e envie aqui. Os erros mais prováveis são:

- `ADMIN_PASSWORD` não configurado.
- GitHub ainda sem os arquivos.
- Build sem acesso a alguma dependência.
- `DATABASE_URL` não criada pelo Blueprint.
