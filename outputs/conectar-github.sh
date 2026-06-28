#!/usr/bin/env bash
set -euo pipefail

cd "/Users/felipegrossi/Documents/Codex/2026-06-21/quero-construir-um-saas-chamado-mgv"

if [ ! -d ".git" ]; then
  git init -b main 2>/dev/null || {
    git init
    git branch -M main
  }
fi

git config user.name "felgss"
git config user.email "felgss@users.noreply.github.com"

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "https://github.com/felgss/MGV.git"
else
  git remote add origin "https://github.com/felgss/MGV.git"
fi

git add .
git commit -m "Versão inicial do MGV Dashboard" || true
git push -u origin main
