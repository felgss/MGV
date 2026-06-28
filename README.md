# MGV Dashboard

SaaS financeiro multiempresa do Método MGV para acompanhar lucro operacional, lucro incremental e participação da consultoria.

## Caminho recomendado de produção

O projeto está preparado para:

- GitHub para versionamento.
- Render para hospedar o Next.js.
- Render PostgreSQL para banco de dados.

Veja o guia completo em [outputs/deploy-render.md](outputs/deploy-render.md).

Checklist operacional: [outputs/checklist-publicacao.md](outputs/checklist-publicacao.md).

Guia para subir no GitHub: [outputs/subir-para-github.md](outputs/subir-para-github.md).

Próximo passo no Render: [outputs/proximo-passo-render.md](outputs/proximo-passo-render.md).

## Rodar localmente

Para rodar localmente agora também é necessário um PostgreSQL disponível.

```bash
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:bootstrap
npm run dev
```

Acesse `http://localhost:3000`.

No primeiro bootstrap, configure antes:

```bash
ADMIN_EMAIL="seu-email"
ADMIN_PASSWORD="uma-senha-segura"
```

## Perfis de demonstração

- Administrador: `admin@mgv.com`
- Consultor: `consultor@mgv.com`
- Cliente: `cliente@mgv.com`
- Senha comum: `Mgv@2026`

## Fundação entregue

- Next.js App Router, React, TypeScript e Tailwind CSS.
- Prisma com PostgreSQL e schema multiempresa.
- Sessões seguras persistidas no banco.
- Papéis administrador, consultor e cliente.
- Isolamento por tenant e vínculo explícito com clientes.
- Dashboard inicial responsivo com dados de demonstração.
