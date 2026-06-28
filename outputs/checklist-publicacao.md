# Checklist de publicação - MGV Dashboard

Use este checklist para colocar o SaaS online.

## Antes de subir

- [ ] Criar conta no GitHub.
- [ ] Criar conta no Render.
- [ ] Criar um repositório no GitHub.
- [ ] Subir o projeto para o repositório.
  - Guia: `outputs/subir-para-github.md`

## No Render

- [ ] Criar um novo Blueprint.
- [ ] Selecionar o repositório do GitHub.
- [ ] Confirmar o arquivo `render.yaml`.
- [ ] Conferir se foram criados:
  - [ ] Web Service `mgv-dashboard`.
  - [ ] PostgreSQL `mgv-dashboard-db`.
- [ ] Definir a variável `ADMIN_PASSWORD`.
- [ ] Fazer o primeiro deploy.

## Depois do primeiro deploy

- [ ] Abrir o Shell do Web Service no Render.
- [ ] Rodar:

```bash
npm run db:bootstrap
```

- [ ] Abrir a URL pública do Render.
- [ ] Entrar com o e-mail administrador.
- [ ] Cadastrar os primeiros clientes reais.
- [ ] Configurar baseline e regra de participação.
- [ ] Criar acessos de consultores e clientes.

## Testes rápidos em produção

- [ ] Abrir `/api/health` e confirmar que retorna `ok: true`.
- [ ] Fazer login como administrador.
- [ ] Criar um cliente.
- [ ] Registrar um lucro operacional mensal.
- [ ] Conferir se o lucro incremental foi calculado.
- [ ] Abrir o relatório PDF do cliente.
- [ ] Criar um usuário cliente e testar o acesso restrito.

## Atenção

- Não rode `npm run db:seed` em produção.
- Use `npm run db:bootstrap` apenas para criar/atualizar o primeiro administrador.
- Guarde a senha do administrador em local seguro.
- Se trocar `ADMIN_EMAIL` ou `ADMIN_PASSWORD`, rode o bootstrap novamente se quiser atualizar o acesso inicial.
