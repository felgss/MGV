# MGV Dashboard — Arquitetura do Sistema

## 1. Visão do produto

O MGV Dashboard será um SaaS multiempresa para consultorias acompanharem indicadores financeiros de seus clientes, compararem resultados com uma linha de base e calcularem automaticamente o lucro incremental e a participação da consultoria.

Cada consultoria será um tenant isolado. Usuários administrativos poderão gerenciar clientes, métricas, contratos e relatórios. Usuários de clientes verão apenas as empresas às quais receberam acesso.

## 2. Arquitetura proposta

### Aplicação

- Next.js com App Router, React e TypeScript.
- Tailwind CSS para design system responsivo.
- Server Components para leitura e composição das telas.
- Server Actions e Route Handlers para comandos, integrações e download de relatórios.
- Prisma como camada de persistência.
- SQLite no MVP, mantendo o schema compatível com uma futura migração para PostgreSQL.
- Validação compartilhada no servidor e nos formulários.
- Autenticação por sessão segura em cookie HTTP-only.
- Controle de acesso por tenant, papel e vínculo com cliente.

### Camadas

1. **Apresentação:** páginas, layouts, componentes, gráficos e formulários.
2. **Aplicação:** casos de uso como cadastrar cliente, lançar período, fechar resultado e emitir relatório.
3. **Domínio:** regras de baseline, lucro incremental, participação, arredondamento e status dos períodos.
4. **Infraestrutura:** Prisma, autenticação, geração de PDF, armazenamento e observabilidade.

As regras financeiras não ficarão dentro de componentes React nem diretamente em rotas. Elas serão funções de domínio testáveis e chamadas pelos casos de uso.

### Módulos

- Identidade e acesso
- Consultorias (tenants)
- Clientes e unidades de negócio
- Indicadores financeiros
- Contratos e regras de participação
- Apuração mensal
- Dashboards e análises
- Relatórios e PDFs
- Administração e auditoria

## 3. Perfis e autorização

- **ADMINISTRADOR:** administra a consultoria, usuários, clientes, contratos, configurações e relatórios.
- **CONSULTOR:** registra dados e acompanha apenas os clientes permitidos.
- **CLIENTE:** acessa apenas sua empresa, seus resultados e seus relatórios.

Toda consulta deve incluir o `tenantId`. Para perfis de cliente, também deve validar um vínculo explícito com `clientId`. Esconder elementos na interface não substitui essa autorização no servidor.

## 4. Modelo de dados

### Tenant

Representa a consultoria.

- `id`
- `name`
- `slug` (único)
- `document`
- `logoUrl`
- `timezone`
- `currency`
- `status`
- `createdAt`, `updatedAt`

### User

Identidade de acesso.

- `id`
- `name`
- `email` (único)
- `passwordHash`
- `status`
- `lastLoginAt`
- `createdAt`, `updatedAt`

### Membership

Vínculo do usuário com uma consultoria.

- `id`
- `tenantId`
- `userId`
- `role`
- `createdAt`, `updatedAt`
- único: (`tenantId`, `userId`)

### Client

Empresa atendida pela consultoria.

- `id`
- `tenantId`
- `name`
- `legalName`
- `document`
- `email`
- `phone`
- `industry`
- `status`
- `startDate`
- `notes`
- `createdAt`, `updatedAt`, `archivedAt`
- índices: (`tenantId`, `status`) e (`tenantId`, `name`)

### ClientAccess

Define quais usuários podem acessar cada cliente.

- `id`
- `tenantId`
- `clientId`
- `userId`
- `accessLevel`
- `createdAt`
- único: (`clientId`, `userId`)

### BusinessUnit

Unidade opcional para clientes que precisam separar filiais, marcas ou operações.

- `id`
- `tenantId`
- `clientId`
- `name`
- `code`
- `status`
- `createdAt`, `updatedAt`

### MetricDefinition

Catálogo de indicadores que podem ser lançados.

- `id`
- `tenantId`
- `name`
- `key`
- `description`
- `category` (`REVENUE`, `COST`, `EXPENSE`, `PROFIT`, `CUSTOM`)
- `valueType` (`CURRENCY`, `PERCENTAGE`, `NUMBER`)
- `aggregation` (`SUM`, `AVERAGE`, `LAST_VALUE`)
- `isRequired`
- `isActive`
- `createdAt`, `updatedAt`
- único: (`tenantId`, `key`)

### FinancialPeriod

Cabeçalho de uma competência mensal.

- `id`
- `tenantId`
- `clientId`
- `businessUnitId` (opcional)
- `year`
- `month`
- `status` (`DRAFT`, `SUBMITTED`, `APPROVED`, `LOCKED`)
- `submittedAt`, `approvedAt`, `lockedAt`
- `createdById`, `updatedById`
- `createdAt`, `updatedAt`
- único: (`clientId`, `businessUnitId`, `year`, `month`)

### MetricEntry

Valor de um indicador em uma competência.

- `id`
- `tenantId`
- `financialPeriodId`
- `metricDefinitionId`
- `value` (decimal)
- `source`
- `notes`
- `createdById`
- `createdAt`, `updatedAt`
- único: (`financialPeriodId`, `metricDefinitionId`)

### Contract

Contrato comercial com o cliente.

- `id`
- `tenantId`
- `clientId`
- `name`
- `startDate`, `endDate`
- `status`
- `currency`
- `createdAt`, `updatedAt`

### CompensationRule

Regra versionada de participação da consultoria.

- `id`
- `tenantId`
- `contractId`
- `version`
- `percentage`
- `minimumFee` (opcional)
- `maximumFee` (opcional)
- `effectiveFrom`, `effectiveTo`
- `createdAt`, `updatedAt`
- único: (`contractId`, `version`)

### BaselinePolicy

Configuração da linha de base usada na comparação.

- `id`
- `tenantId`
- `contractId`
- `method` (`FIXED_VALUE`, `HISTORICAL_AVERAGE`)
- `metricDefinitionId`
- `lookbackMonths` (opcional)
- `fixedValue` (opcional)
- `createdAt`, `updatedAt`

### MonthlyCalculation

Snapshot imutável da apuração de uma competência.

- `id`
- `tenantId`
- `clientId`
- `financialPeriodId`
- `contractId`
- `compensationRuleId`
- `baselineValue`
- `actualValue`
- `incrementalProfit`
- `eligibleIncrementalProfit`
- `consultancyShare`
- `clientShare`
- `currency`
- `formulaVersion`
- `calculationDetails` (JSON serializado)
- `calculatedAt`
- `createdAt`
- único: (`financialPeriodId`, `contractId`)

### Report

Registro de relatórios gerados.

- `id`
- `tenantId`
- `clientId`
- `type`
- `periodStart`, `periodEnd`
- `status` (`PENDING`, `GENERATING`, `READY`, `FAILED`)
- `filePath` ou `storageKey`
- `checksum`
- `generatedById`
- `generatedAt`
- `errorMessage`
- `createdAt`, `updatedAt`

### AuditLog

Trilha de operações sensíveis.

- `id`
- `tenantId`
- `userId`
- `action`
- `entityType`
- `entityId`
- `beforeData`, `afterData` (JSON serializado)
- `ipAddress`
- `createdAt`

## 5. Regras financeiras

### Regras definitivas do MVP

- Indicador principal: lucro operacional.
- Baseline configurável como valor fixo ou média histórica.
- Participação da consultoria calculada por percentual.
- Piso e teto da participação são opcionais.
- Lucro incremental negativo não gera participação.
- Perfis iniciais: administrador, consultor e cliente.

### Valor realizado

O indicador principal recomendado é o lucro operacional, em vez de faturamento. Cada contrato escolhe qual `MetricDefinition` será usada na apuração.

### Linha de base

A linha de base será configurada por contrato usando uma destas opções:

- valor fixo;
- média histórica de uma quantidade configurável de competências fechadas.

Competências ausentes não entrarão na média. O sistema deverá exigir ao menos uma competência válida; caso contrário, a apuração permanecerá pendente. O valor fixo ou a janela histórica usados serão preservados no snapshot da apuração.

### Lucro incremental

`lucro incremental = valor realizado - linha de base`

Por padrão, valores negativos não geram participação:

`lucro incremental elegível = máximo(0, lucro incremental)`

### Participação percentual

`participação da consultoria = lucro incremental elegível × percentual`

Depois serão aplicados, nesta ordem, o piso opcional e o teto opcional definidos no contrato. O piso somente será aplicado quando existir lucro incremental elegível; um mês sem lucro incremental sempre gera participação igual a zero.

`participação do cliente = lucro incremental - participação da consultoria`

### Precisão e histórico

- Valores monetários serão armazenados como `Decimal`, nunca ponto flutuante.
- Arredondamento monetário ocorrerá apenas no resultado final, com duas casas decimais.
- Ao aprovar ou bloquear uma competência, será salvo um snapshot completo da fórmula e da regra utilizadas.
- Alterações futuras em contrato, baseline ou percentual não reescreverão apurações fechadas.
- Recalcular período aprovado exigirá reabertura autorizada e registro em auditoria.

## 6. Experiência e rotas

### Área administrativa da plataforma

- `/admin/tenants`
- `/admin/users`
- `/admin/audit`
- `/admin/system`

### Área da consultoria

- `/dashboard`
- `/clients`
- `/clients/[clientId]`
- `/clients/[clientId]/financials`
- `/clients/[clientId]/contracts`
- `/clients/[clientId]/reports`
- `/settings/users`
- `/settings/metrics`
- `/settings/consultancy`

### Área do cliente

- `/portal`
- `/portal/financials`
- `/portal/results`
- `/portal/reports`

O dashboard mostrará KPIs, evolução mensal, baseline versus realizado, lucro incremental, participação acumulada, filtros por cliente/período e alertas de competências pendentes.

## 7. Relatórios PDF

O PDF será gerado no servidor a partir de um modelo próprio e conterá:

- identidade da consultoria e do cliente;
- período e filtros utilizados;
- resumo executivo;
- indicadores e gráficos;
- memória de cálculo do lucro incremental;
- participação da consultoria e do cliente;
- observações e data de emissão.

No MVP, a geração pode ser síncrona para relatórios pequenos. A interface já será desenhada com estados de processamento para permitir fila assíncrona e armazenamento em objeto quando o volume crescer.

## 8. Organização do projeto

```text
src/
  app/
    (auth)/
    (consultancy)/
    (client)/
    admin/
    api/
  components/
    ui/
    charts/
    forms/
  modules/
    auth/
    tenants/
    clients/
    financials/
    contracts/
    calculations/
    reports/
    audit/
  lib/
    db/
    auth/
    validation/
    money/
    permissions/
  styles/
prisma/
  schema.prisma
  migrations/
  seed.ts
tests/
  unit/
  integration/
  e2e/
```

Cada módulo poderá conter `domain`, `application`, `infrastructure` e `ui` conforme sua complexidade. Não serão criadas abstrações sem uso, mas os limites entre domínio, dados e interface estarão claros desde o início.

## 9. Segurança e operação

- Senhas com hash forte e cookies seguros.
- Proteção contra enumeração de contas e limitação de tentativas de login.
- Validação de entrada no servidor.
- Autorização centralizada em todos os casos de uso.
- Isolamento obrigatório por `tenantId`.
- Auditoria de alterações financeiras, contratos, permissões e reaberturas.
- Soft delete para entidades de negócio; apurações fechadas não serão apagadas.
- Cabeçalhos de segurança, proteção CSRF nas mutações e política de conteúdo.
- Backup periódico do banco e teste de restauração.
- Logs estruturados sem dados financeiros sensíveis.
- Datas armazenadas em UTC; competência representada explicitamente por ano e mês.

## 10. Estratégia de testes

- **Unitários:** fórmulas, arredondamento, baseline, piso, teto e autorização.
- **Integração:** casos de uso com banco temporário e isolamento entre tenants.
- **Componentes:** formulários, estados vazios, tabelas e filtros.
- **Ponta a ponta:** login, cliente, lançamento mensal, fechamento e PDF.
- **Regressão financeira:** cenários tabelados com resultados esperados e versões de fórmula.

## 11. Roadmap de desenvolvimento

### Fase 0 — decisões de produto (concluída)

- Indicador principal definido como lucro operacional.
- Baseline definido como valor fixo ou média histórica configurável.
- Participação definida como percentual com piso e teto opcionais.
- Lucro incremental negativo definido como não elegível para participação.
- Perfis iniciais definidos como administrador, consultor e cliente.
- Direção visual inicial extraída do Método MGV: fundo escuro, dourado, linguagem executiva e foco em crescimento com previsibilidade.

### Fase 1 — fundação

- Criar aplicação, design system e layout responsivo.
- Configurar Prisma, SQLite, migrations e seed.
- Implementar autenticação, sessão, papéis e isolamento multi-tenant.
- Adicionar validação, tratamento de erros, auditoria e testes-base.

### Fase 2 — clientes e usuários

- CRUD de clientes e unidades.
- Convites e gestão de acesso.
- Área administrativa da consultoria.
- Busca, filtros, paginação, arquivamento e estados vazios.

### Fase 3 — indicadores financeiros

- Catálogo de métricas.
- Lançamento e edição por competência.
- Fluxo rascunho, envio, aprovação e bloqueio.
- Validação de competências duplicadas e dados obrigatórios.

### Fase 4 — contratos e cálculos

- Contratos, baselines e regras versionadas.
- Motor de cálculo puro e testado.
- Apuração, snapshot, reabertura e auditoria.
- Cenários percentuais com e sem piso e teto.

### Fase 5 — dashboards

- KPIs e filtros globais.
- Gráficos de evolução, comparação e composição.
- Visão consolidada da consultoria e visão individual do cliente.
- Exportação de dados tabulares.

### Fase 6 — portal do cliente e PDFs

- Portal de leitura com permissões restritas.
- Relatório PDF com gráficos e memória de cálculo.
- Histórico, reemissão e download seguro.

### Fase 7 — qualidade e lançamento

- Testes ponta a ponta, acessibilidade e responsividade.
- Revisão de segurança e isolamento de tenants.
- Backup, monitoramento e documentação operacional.
- Dados de demonstração, onboarding e deploy.

### Fase 8 — escala pós-MVP

- Migração para PostgreSQL quando concorrência e volume justificarem.
- Fila para PDFs, importações e notificações.
- Armazenamento de arquivos em objeto.
- Importação de planilhas, integrações contábeis e API pública.
- Cobrança por assinatura e limites por plano.

## 12. Critério de conclusão do MVP

O MVP estará pronto quando uma consultoria conseguir cadastrar sua equipe e um cliente, configurar contrato e baseline, lançar competências mensais, aprovar uma apuração, visualizar os gráficos, conceder acesso ao cliente e emitir um PDF cuja memória de cálculo reproduza exatamente os valores do dashboard.
