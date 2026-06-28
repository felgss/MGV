# Subir o MGV Dashboard para o GitHub

Repositório:

```text
https://github.com/felgss/MGV
```

## 1. Abrir a pasta do projeto

No terminal:

```bash
cd /Users/felipegrossi/Documents/Codex/2026-06-21/quero-construir-um-saas-chamado-mgv
```

## 2. Conferir arquivos ignorados

O projeto já ignora:

- `.env`
- `node_modules/`
- `.next/`
- banco SQLite local antigo
- Prisma Client gerado
- arquivos temporários

## 3. Inicializar o Git

```bash
git init -b main
```

Se seu Git não aceitar `-b main`, use:

```bash
git init
git branch -M main
```

## 4. Configurar autoria, se necessário

Se o Git pedir nome/e-mail:

```bash
git config user.name "felgss"
git config user.email "felgss@users.noreply.github.com"
```

## 5. Criar o primeiro commit

```bash
git add .
git commit -m "Versão inicial do MGV Dashboard"
```

## 6. Conectar ao GitHub

```bash
git remote add origin https://github.com/felgss/MGV.git
```

Se o remoto já existir:

```bash
git remote set-url origin https://github.com/felgss/MGV.git
```

## 7. Enviar para o GitHub

```bash
git push -u origin main
```

## 8. Se o GitHub pedir login

Use o login da sua conta GitHub.

Se pedir senha, o GitHub normalmente exige um token em vez da senha comum.

Caminho:

1. GitHub.
2. Settings.
3. Developer settings.
4. Personal access tokens.
5. Tokens classic.
6. Generate new token.
7. Marque acesso ao repositório.
8. Use o token como senha no terminal.

## 9. Próximo passo

Depois que o código aparecer no GitHub, siga:

```text
outputs/deploy-render.md
```

Esse guia mostra como conectar o repositório ao Render e publicar o SaaS online.
