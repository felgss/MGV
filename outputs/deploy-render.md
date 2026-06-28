# Deploy do MGV Dashboard no Render

Este é o caminho mais simples recomendado para colocar o SaaS online em produção.

## 1. Subir o código para o GitHub

Crie um repositório no GitHub e envie esta pasta do projeto.

Se estiver fazendo pelo terminal:

```bash
git init
git add .
git commit -m "Versão inicial do MGV Dashboard"
git branch -M main
git remote add origin URL_DO_SEU_REPOSITORIO
git push -u origin main
```

## 2. Criar o serviço no Render

No Render:

1. Clique em New.
2. Escolha Blueprint.
3. Conecte o repositório do GitHub.
4. Selecione o arquivo `render.yaml`.
5. Confirme a criação.

O `render.yaml` já cria:

- um Web Service para o Next.js;
- um banco PostgreSQL;
- a variável `DATABASE_URL`;
- as variáveis básicas do ambiente.

## 3. Definir a senha inicial do administrador

No serviço web do Render, configure a variável:

```text
ADMIN_PASSWORD
```

Use uma senha forte. Exemplo:

```text
Mgv@SenhaForte2026
```

O e-mail inicial está definido como:

```text
admin@mgv.com
```

Você pode mudar no Render pela variável:

```text
ADMIN_EMAIL
```

## 4. Primeiro deploy

O Render vai executar:

```bash
npm install && npm run render:build
```

Esse comando:

1. instala dependências;
2. gera o Prisma Client;
3. aplica migrations no PostgreSQL;
4. compila o Next.js.

Depois ele inicia com:

```bash
npm run start
```

## 5. Criar o primeiro administrador

Após o primeiro deploy, abra o Shell do serviço no Render e rode:

```bash
npm run db:bootstrap
```

Esse comando é seguro para produção: ele cria ou atualiza o tenant, o usuário administrador e o indicador principal sem apagar dados existentes.

## 6. Acessar o sistema

Abra a URL pública gerada pelo Render, por exemplo:

```text
https://mgv-dashboard.onrender.com
```

Entre com:

```text
admin@mgv.com
SENHA_CONFIGURADA_EM_ADMIN_PASSWORD
```

## 7. Verificar se está tudo saudável

Abra:

```text
https://SUA-URL-DO-RENDER.onrender.com/api/health
```

O retorno esperado é:

```json
{
  "ok": true,
  "service": "mgv-dashboard",
  "database": "connected"
}
```

## Observações importantes

- Não use GitHub Pages para este projeto. Ele não roda backend, login, Prisma nem banco de dados.
- Não use SQLite em produção para este SaaS. O projeto já está preparado para PostgreSQL.
- O seed de demonstração (`npm run db:seed`) apaga e recria dados. Use apenas em ambiente de teste.
- Em produção, use `npm run db:bootstrap`.

## Checklist

Também deixei um checklist operacional em [checklist-publicacao.md](checklist-publicacao.md).
