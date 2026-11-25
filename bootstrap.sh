#!/usr/bin/env bash
set -euo pipefail

echo "📦 Instalando skills desde skills-lock.json..."
npx -y skills experimental_install -a antigravity -y

echo "🎨 Inicializando ui-ux-pro-max-cli para Antigravity..."
npx -y ui-ux-pro-max-cli init --ai antigravity

echo "🕸️ Instalando graphifyy via uv..."
uv tool install graphifyy

echo "✅ Bootstrap de Agent Brain completado."
